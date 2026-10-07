import base64
import math
import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_current_user_optional
from app.db.postgres import get_session

from app.models.donation import Donation
from app.models.user import User
from app.models.ngo import NGO
from app.models.match import Match
from app.models.assignment import Assignment
from app.models.volunteer import Volunteer

from app.schemas.donation import (
    DonationCreate,
    DonationUpdate,
    DonationResponse
)

from app.services.audit_service import create_audit_log
from app.services.email_service import email_service
from app.services.matching_service import calculate_match_scores
from app.services.notification_service import create_notification


router = APIRouter(
    prefix="/api/donations",
    tags=["Donations"]
)

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def _save_base64_image(image_data: str) -> str | None:
    try:
        if not image_data or not image_data.startswith("data:image/"):
            return image_data
        header, encoded = image_data.split(",", 1)
        ext = "jpg"
        if "png" in header:
            ext = "png"
        elif "webp" in header:
            ext = "webp"
        elif "jpeg" in header:
            ext = "jpg"
        filename = f"food_{uuid.uuid4().hex[:12]}.{ext}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(encoded))
        return f"/api/donations/images/{filename}"
    except Exception:
        return None


# =========================================================
# INDIA TIMEZONE
# =========================================================

INDIA_TIMEZONE = timezone(
    timedelta(hours=5, minutes=30)
)


# =========================================================
# DATETIME HELPER
# =========================================================

def to_database_datetime(
    value: datetime | None
) -> datetime | None:

    if value is None:
        return None

    if value.tzinfo is not None:

        value = value.astimezone(
            INDIA_TIMEZONE
        )

        value = value.replace(
            tzinfo=None
        )

    return value


async def _enrich_donation_workflow(session: AsyncSession, donation: Donation):
    try:
        donation.pickup_address = donation.location

        # 1. Query match details (prefer ACCEPTED, else latest)
        match_res = await session.execute(
            select(Match, NGO.organization_name)
            .join(NGO, Match.ngo_id == NGO.ngo_id)
            .where(Match.donation_id == donation.donation_id)
            .order_by(Match.matched_at.desc())
        )
        matches = match_res.all()
        accepted_match = next((m for m in matches if m[0].status == "ACCEPTED"), None)
        selected_match = accepted_match or (matches[0] if matches else None)
        if selected_match:
            donation.matched_ngo_name = selected_match[1]
            donation.match_status = selected_match[0].status

        # Calculate distance to NGO if coordinates exist
        if donation.latitude is not None and donation.longitude is not None:
            ngo_coords = None
            if selected_match:
                ngo_obj = (await session.execute(
                    select(NGO.latitude, NGO.longitude).where(NGO.ngo_id == selected_match[0].ngo_id)
                )).first()
                if ngo_obj and ngo_obj[0] is not None and ngo_obj[1] is not None:
                    ngo_coords = (float(ngo_obj[0]), float(ngo_obj[1]))

            if not ngo_coords:
                first_ngo = (await session.execute(
                    select(NGO.latitude, NGO.longitude).where(NGO.latitude.isnot(None)).order_by(NGO.ngo_id).limit(1)
                )).first()
                if first_ngo and first_ngo[0] is not None and first_ngo[1] is not None:
                    ngo_coords = (float(first_ngo[0]), float(first_ngo[1]))

            if ngo_coords:
                lat1, lon1 = math.radians(float(donation.latitude)), math.radians(float(donation.longitude))
                lat2, lon2 = math.radians(ngo_coords[0]), math.radians(ngo_coords[1])
                dlat, dlon = lat2 - lat1, lon2 - lon1
                a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                donation.distance_km = round(6371.0 * c, 1)

        # 2. Query assignment details
        assign_res = await session.execute(
            select(Assignment, User.name, User.phone)
            .outerjoin(Volunteer, Assignment.volunteer_id == Volunteer.volunteer_id)
            .outerjoin(User, Volunteer.user_id == User.user_id)
            .where(Assignment.donation_id == donation.donation_id)
            .order_by(Assignment.assigned_at.desc())
        )
        assign_row = assign_res.first()
        if assign_row:
            assignment_obj, vol_name, vol_phone = assign_row
            donation.assigned_volunteer_name = vol_name
            donation.assigned_volunteer_phone = vol_phone
            donation.assignment_status = assignment_obj.status
    except Exception:
        pass


# =========================================================
# GET ALL DONATIONS
# =========================================================

@router.get(
    "/",
    response_model=list[DonationResponse]
)
async def get_donations(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    if current_user["role"] == "DONOR":

        result = await session.execute(
            select(
                Donation,
                User.name.label("donor_name"),
                User.phone.label("donor_phone")
            )
            .join(
                User,
                Donation.donor_id == User.user_id
            )
            .where(
                Donation.donor_id ==
                current_user["user_id"]
            )
            .order_by(
                Donation.created_at.desc()
            )
        )

    else:

        result = await session.execute(
            select(
                Donation,
                User.name.label("donor_name"),
                User.phone.label("donor_phone")
            )
            .join(
                User,
                Donation.donor_id == User.user_id
            )
            .order_by(
                Donation.created_at.desc()
            )
        )

    rows = result.all()

    donations = []

    for donation, donor_name, donor_phone in rows:

        donation.donor_name = donor_name
        donation.donor_phone = donor_phone
        await _enrich_donation_workflow(session, donation)

        donations.append(donation)

    return donations


# =========================================================
# CREATE DONATION
# =========================================================

@router.post(
    "/",
    response_model=DonationResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_donation(
    data: DonationCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    if current_user["role"] != "DONOR":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can create donations"
        )

    expiry_time = to_database_datetime(
        data.expiry_time
    )

    pickup_start = to_database_datetime(
        data.pickup_start
    )

    pickup_end = to_database_datetime(
        data.pickup_end
    )

    image_url = data.image_url
    if image_url and image_url.startswith("data:image/"):
        saved = _save_base64_image(image_url)
        if saved:
            image_url = saved

    location_val = data.location or data.pickup_address

    donation = Donation(
        donor_id=current_user["user_id"],

        food_name=data.food_name,

        food_type=data.food_type,

        quantity=data.quantity,

        unit=data.unit,

        expiry_time=expiry_time,

        pickup_start=pickup_start,

        pickup_end=pickup_end,

        location=location_val,

        latitude=data.latitude,

        longitude=data.longitude,

        image_url=image_url,

        status="POSTED"
    )

    session.add(donation)

    await session.flush()

    await create_audit_log(
        session=session,

        user_id=current_user["user_id"],

        action="DONATION_CREATED",

        entity_type="DONATION",

        entity_id=donation.donation_id,

        details=(
            f"Created donation "
            f"'{donation.food_name}' "
            f"with quantity "
            f"{donation.quantity} "
            f"{donation.unit or ''}"
        )
    )

    # -----------------------------------------------------
    # AUTOMATIC NGO MATCHING & NOTIFICATION WORKFLOW
    # -----------------------------------------------------
    ngo_res = await session.execute(
        select(NGO).where(NGO.verification_status == "VERIFIED")
    )
    verified_ngos = ngo_res.scalars().all()
    matched_count = 0

    for ngo in verified_ngos:
        scores = calculate_match_scores(donation, ngo)
        # Create match for relevant NGOs (e.g. score >= 10.0 or if fewer than 5 NGOs)
        if scores["total_score"] >= 10.0 or len(verified_ngos) <= 3:
            candidate_match = Match(
                donation_id=donation.donation_id,
                ngo_id=ngo.ngo_id,
                location_score=scores["location_score"],
                quantity_score=scores["quantity_score"],
                expiry_score=scores["expiry_score"],
                capacity_score=scores["capacity_score"],
                requirement_score=scores["requirement_score"],
                total_score=scores["total_score"],
                status="PENDING",
                matched_at=datetime.now()
            )
            session.add(candidate_match)
            matched_count += 1

            await create_notification(
                session=session,
                user_id=ngo.user_id,
                message=(
                    f"New donation match available: '{donation.food_name}' "
                    f"({donation.quantity} {donation.unit or 'kg'}) in {donation.location or 'nearby'}. "
                    f"Match score: {scores['total_score']}%. Please review and accept."
                ),
                notification_type="NEW_MATCH"
            )

            # Send operational match email only to verified NGO email
            if getattr(ngo, "email_verified", False) and ngo.email:
                try:
                    await email_service.send_donation_match_email(
                        email=ngo.email,
                        ngo_name=ngo.organization_name,
                        food_name=donation.food_name,
                        quantity=f"{donation.quantity} {donation.unit or 'servings'}",
                        pickup_location=donation.location or "Donor Location",
                        expiry=str(donation.expiry_time) if donation.expiry_time else "Not specified"
                    )
                except Exception as mail_err:
                    import logging
                    logging.getLogger("mealbridge.donations").warning(f"Could not send match email to NGO {ngo.ngo_id}: {mail_err}")

    # Notify donor about matching broadcast
    await create_notification(
        session=session,
        user_id=current_user["user_id"],
        message=(
            f"Your donation '{donation.food_name}' was registered and "
            f"notified to {matched_count} verified NGO partners."
        ),
        notification_type="DONATION_CREATED"
    )

    await session.commit()

    await session.refresh(
        donation
    )

    # Add donor information for response
    donor_result = await session.execute(
        select(User).where(
            User.user_id ==
            current_user["user_id"]
        )
    )

    donor = donor_result.scalar_one_or_none()

    if donor:
        donation.donor_name = donor.name
        donation.donor_phone = donor.phone
        if donor.email:
            await email_service.send_donation_created(
                email=donor.email,
                donor_name=donor.name,
                food_name=donation.food_name,
                quantity=str(donation.quantity),
                unit=donation.unit or "units"
            )

    await _enrich_donation_workflow(session, donation)
    return donation


# =========================================================
# GET DONATION BY ID
# =========================================================

@router.get(
    "/{donation_id}",
    response_model=DonationResponse
)
async def get_donation(
    donation_id: int,
    current_user: dict | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(
            Donation,
            User.name.label("donor_name"),
            User.phone.label("donor_phone")
        )
        .join(
            User,
            Donation.donor_id == User.user_id
        )
        .where(
            Donation.donation_id ==
            donation_id
        )
    )

    row = result.first()

    if not row:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )

    donation, donor_name, donor_phone = row

    if (
        current_user
        and current_user["role"] == "DONOR"
        and donation.donor_id != current_user["user_id"]
        and donation.status not in ["POSTED", "MATCHED", "ACCEPTED", "ASSIGNED", "PICKED_UP", "DELIVERED"]
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only access "
                "your own donations"
            )
        )

    donation.donor_name = donor_name
    donation.donor_phone = donor_phone
    await _enrich_donation_workflow(session, donation)

    return donation


# =========================================================
# UPDATE DONATION
# =========================================================

@router.put(
    "/{donation_id}",
    response_model=DonationResponse
)
async def update_donation(
    donation_id: int,
    data: DonationUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    if current_user["role"] != "DONOR":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can update donations"
        )

    result = await session.execute(
        select(Donation)
        .where(
            Donation.donation_id ==
            donation_id
        )
    )

    donation = result.scalar_one_or_none()

    if not donation:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )

    if (
        donation.donor_id !=
        current_user["user_id"]
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only update "
                "your own donations"
            )
        )

    if donation.status in [
        "DELIVERED",
        "CANCELLED"
    ]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This donation can no longer "
                "be updated"
            )
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "pickup_address" in update_data:
        addr = update_data.pop("pickup_address")
        if "location" not in update_data or not update_data["location"]:
            update_data["location"] = addr

    if "image_url" in update_data and update_data["image_url"] and update_data["image_url"].startswith("data:image/"):
        saved = _save_base64_image(update_data["image_url"])
        if saved:
            update_data["image_url"] = saved

    for field, value in update_data.items():

        if isinstance(
            value,
            datetime
        ):

            value = to_database_datetime(
                value
            )

        setattr(
            donation,
            field,
            value
        )

    await create_audit_log(
        session=session,

        user_id=current_user["user_id"],

        action="DONATION_UPDATED",

        entity_type="DONATION",

        entity_id=donation.donation_id,

        details=(
            f"Updated donation "
            f"'{donation.food_name}'"
        )
    )

    await session.commit()

    await session.refresh(
        donation
    )

    donor_result = await session.execute(
        select(User).where(
            User.user_id ==
            donation.donor_id
        )
    )

    donor = donor_result.scalar_one_or_none()

    if donor:
        donation.donor_name = donor.name
        donation.donor_phone = donor.phone

    return donation


# =========================================================
# DELETE DONATION
# =========================================================

@router.delete(
    "/{donation_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_donation(
    donation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    if current_user["role"] != "DONOR":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can delete donations"
        )

    result = await session.execute(
        select(Donation)
        .where(
            Donation.donation_id ==
            donation_id
        )
    )

    donation = result.scalar_one_or_none()

    if not donation:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )

    if (
        donation.donor_id !=
        current_user["user_id"]
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only delete "
                "your own donations"
            )
        )

    if donation.status != "POSTED":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only POSTED donations "
                "can be deleted"
            )
        )

    food_name = donation.food_name

    await create_audit_log(
        session=session,

        user_id=current_user["user_id"],

        action="DONATION_DELETED",

        entity_type="DONATION",

        entity_id=donation.donation_id,

        details=(
            f"Deleted donation "
            f"'{food_name}'"
        )
    )

    await session.delete(
        donation
    )

    await session.commit()

    return None


# =========================================================
# GET UPLOADED DONATION IMAGE
# =========================================================

@router.get("/images/{filename}")
async def get_donation_image(filename: str):
    safe_name = os.path.basename(filename)
    file_path = os.path.join(UPLOADS_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    return FileResponse(file_path)