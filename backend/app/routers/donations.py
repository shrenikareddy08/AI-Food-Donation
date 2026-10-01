from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.postgres import get_session

from app.models.donation import Donation
from app.models.user import User

from app.schemas.donation import (
    DonationCreate,
    DonationUpdate,
    DonationResponse
)

from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/donations",
    tags=["Donations"]
)


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

    donation = Donation(
        donor_id=current_user["user_id"],

        food_name=data.food_name,

        food_type=data.food_type,

        quantity=data.quantity,

        unit=data.unit,

        expiry_time=expiry_time,

        pickup_start=pickup_start,

        pickup_end=pickup_end,

        location=data.location,

        latitude=data.latitude,

        longitude=data.longitude,

        image_url=data.image_url,

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
    current_user: dict = Depends(get_current_user),
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
        current_user["role"] == "DONOR"
        and
        donation.donor_id !=
        current_user["user_id"]
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