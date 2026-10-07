from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_current_user_optional
from app.db.postgres import get_session

from app.models.assignment import Assignment
from app.models.donation import Donation
from app.models.ngo import NGO
from app.models.volunteer import Volunteer
from app.models.match import Match
from app.models.user import User

from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentStatusUpdate
)

from app.services.notification_service import create_notification
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/assignments",
    tags=["Assignments"]
)


async def _enrich_assignment_details(session: AsyncSession, assignment: Assignment):
    try:
        # Donation and donor
        don_res = await session.execute(
            select(Donation, User.name, User.phone)
            .join(User, Donation.donor_id == User.user_id)
            .where(Donation.donation_id == assignment.donation_id)
        )
        don_row = don_res.first()
        if don_row:
            d, donor_name, donor_phone = don_row
            assignment.food_name = d.food_name
            assignment.food_type = d.food_type
            assignment.quantity = float(d.quantity) if d.quantity else None
            assignment.unit = d.unit
            assignment.donor_name = donor_name
            assignment.donor_phone = donor_phone
            assignment.donor_location = d.location
            assignment.pickup_latitude = float(d.latitude) if d.latitude is not None else None
            assignment.pickup_longitude = float(d.longitude) if d.longitude is not None else None

            # Clean placeholder text
            placeholders = ("Current Location", "Donor Location", "Pickup location", "Donor Address", "Pickup location selected")
            if not assignment.pickup_location or assignment.pickup_location in placeholders:
                if d.location and d.location not in placeholders:
                    assignment.pickup_location = d.location
                elif d.latitude and d.longitude and abs(float(d.latitude) - 17.3482) < 0.05:
                    assignment.pickup_location = "Aziz Nagar"

        # NGO
        ngo_res = await session.execute(
            select(NGO, User.phone)
            .join(User, NGO.user_id == User.user_id)
            .where(NGO.ngo_id == assignment.ngo_id)
        )
        ngo_row = ngo_res.first()
        if ngo_row:
            ngo, ngo_phone = ngo_row
            assignment.ngo_name = ngo.organization_name
            assignment.ngo_phone = ngo_phone
            assignment.delivery_latitude = float(ngo.latitude) if ngo.latitude is not None else None
            assignment.delivery_longitude = float(ngo.longitude) if ngo.longitude is not None else None
            if not assignment.delivery_location:
                assignment.delivery_location = ngo.address or "Hitech City, Hyderabad"

        # Calculate real distance (Haversine)
        p_lat = getattr(assignment, "pickup_latitude", None)
        p_lon = getattr(assignment, "pickup_longitude", None)
        d_lat = getattr(assignment, "delivery_latitude", None)
        d_lon = getattr(assignment, "delivery_longitude", None)
        if p_lat is not None and p_lon is not None and d_lat is not None and d_lon is not None:
            import math
            lat1, lon1 = math.radians(p_lat), math.radians(p_lon)
            lat2, lon2 = math.radians(d_lat), math.radians(d_lon)
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            assignment.distance_km = round(6371.0 * c, 1)

        # Volunteer
        if assignment.volunteer_id:
            vol_res = await session.execute(
                select(Volunteer, User.name, User.phone, User.email)
                .join(User, Volunteer.user_id == User.user_id)
                .where(Volunteer.volunteer_id == assignment.volunteer_id)
            )
            vol_row = vol_res.first()
            if vol_row:
                _, vol_name, vol_phone, vol_email = vol_row
                assignment.volunteer_name = vol_name
                assignment.volunteer_phone = vol_phone
                assignment.volunteer_email = vol_email
    except Exception as e:
        import logging
        logging.getLogger("mealbridge.assignments").warning(f"Error enriching assignment: {e}")


# =========================================================
# CREATE ASSIGNMENT
# =========================================================

@router.post(
    "/",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_assignment(
    data: AssignmentCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    # Only ADMIN can create assignments
    if current_user["role"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create assignments"
        )

    # -----------------------------------------------------
    # FIND DONATION
    # -----------------------------------------------------

    donation_result = await session.execute(
        select(Donation).where(
            Donation.donation_id == data.donation_id
        )
    )

    donation = donation_result.scalar_one_or_none()

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )

    # -----------------------------------------------------
    # FIND NGO
    # -----------------------------------------------------

    ngo_result = await session.execute(
        select(NGO).where(
            NGO.ngo_id == data.ngo_id
        )
    )

    ngo = ngo_result.scalar_one_or_none()

    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )

    # NGO must be verified
    if ngo.verification_status != "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NGO is not verified"
        )

    # -----------------------------------------------------
    # FIND VOLUNTEER
    # -----------------------------------------------------

    volunteer_result = await session.execute(
        select(Volunteer).where(
            Volunteer.volunteer_id == data.volunteer_id
        )
    )

    volunteer = volunteer_result.scalar_one_or_none()

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )

    # Volunteer must be available
    if volunteer.availability != "AVAILABLE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Volunteer is not available"
        )

    # -----------------------------------------------------
    # FIND MATCH
    # -----------------------------------------------------

    match_result = await session.execute(
        select(Match).where(
            Match.donation_id == data.donation_id,
            Match.ngo_id == data.ngo_id
        )
    )

    match = match_result.scalar_one_or_none()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found for this donation and NGO"
        )

    # Only ACCEPTED matches can be assigned
    if match.status != "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ACCEPTED matches can be assigned"
        )

    # -----------------------------------------------------
    # CHECK EXISTING ASSIGNMENT
    # -----------------------------------------------------

    existing_result = await session.execute(
        select(Assignment).where(
            Assignment.donation_id == data.donation_id,
            Assignment.ngo_id == data.ngo_id,
            Assignment.status.notin_(["CANCELLED"])
        )
    )

    existing_assignment = existing_result.scalar_one_or_none()

    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active assignment already exists for this donation"
        )

    # -----------------------------------------------------
    # CREATE ASSIGNMENT
    # -----------------------------------------------------

    assignment = Assignment(
        donation_id=data.donation_id,
        ngo_id=data.ngo_id,
        volunteer_id=data.volunteer_id,
        pickup_location=data.pickup_location,
        delivery_location=data.delivery_location,
        pickup_time=data.pickup_time,
        delivery_time=data.delivery_time,
        status="ASSIGNED"
    )

    session.add(assignment)

    await session.flush()

    # Mark volunteer as assigned
    volunteer.availability = "ASSIGNED"

    # -----------------------------------------------------
    # NOTIFY VOLUNTEER
    # -----------------------------------------------------

    await create_notification(
        session=session,
        user_id=volunteer.user_id,
        message=(
            f"You have been assigned to deliver "
            f"{donation.food_name}."
        ),
        notification_type="ASSIGNMENT_CREATED"
    )

    # -----------------------------------------------------
    # NOTIFY NGO
    # -----------------------------------------------------

    await create_notification(
        session=session,
        user_id=ngo.user_id,
        message=(
            f"A volunteer has been assigned for "
            f"{donation.food_name}."
        ),
        notification_type="ASSIGNMENT_CREATED"
    )

    # -----------------------------------------------------
    # NOTIFY DONOR
    # -----------------------------------------------------

    await create_notification(
        session=session,
        user_id=donation.donor_id,
        message=(
            f"Your food donation {donation.food_name} "
            f"has been assigned to a volunteer."
        ),
        notification_type="ASSIGNMENT_CREATED"
    )

    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="ASSIGNMENT_CREATED",
        entity_type="ASSIGNMENT",
        entity_id=assignment.assignment_id,
        details=(
            f"Admin created assignment #{assignment.assignment_id} "
            f"for donation #{donation.donation_id}, "
            f"NGO #{ngo.ngo_id}, "
            f"volunteer #{volunteer.volunteer_id}"
        )
    )

    await session.commit()
    await session.refresh(assignment)

    return assignment


# =========================================================
# GET ASSIGNMENTS
# =========================================================

@router.get(
    "/",
    response_model=list[AssignmentResponse]
)
async def get_assignments(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    # -----------------------------------------------------
    # VOLUNTEER
    # -----------------------------------------------------

    if current_user["role"] == "VOLUNTEER":

        volunteer_result = await session.execute(
            select(Volunteer).where(
                Volunteer.user_id == current_user["user_id"]
            )
        )

        volunteer = volunteer_result.scalar_one_or_none()

        if not volunteer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Volunteer profile not found"
            )

        result = await session.execute(
            select(Assignment)
            .where(
                or_(
                    Assignment.volunteer_id == volunteer.volunteer_id,
                    Assignment.status.in_(["REQUESTED", "PENDING"]),
                    Assignment.volunteer_id.is_(None)
                )
            )
            .order_by(
                Assignment.assigned_at.desc()
            )
        )

    # -----------------------------------------------------
    # DONOR
    # -----------------------------------------------------

    elif current_user["role"] == "DONOR":

        result = await session.execute(
            select(Assignment)
            .join(
                Donation,
                Assignment.donation_id == Donation.donation_id
            )
            .where(
                Donation.donor_id == current_user["user_id"]
            )
            .order_by(
                Assignment.assigned_at.desc()
            )
        )

    # -----------------------------------------------------
    # NGO
    # -----------------------------------------------------

    elif current_user["role"] == "NGO":

        ngo_result = await session.execute(
            select(NGO).where(
                NGO.user_id == current_user["user_id"]
            )
        )

        ngo = ngo_result.scalar_one_or_none()

        if not ngo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NGO profile not found"
            )

        result = await session.execute(
            select(Assignment)
            .where(
                Assignment.ngo_id == ngo.ngo_id
            )
            .order_by(
                Assignment.assigned_at.desc()
            )
        )

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    elif current_user["role"] == "ADMIN":

        result = await session.execute(
            select(Assignment).order_by(
                Assignment.assigned_at.desc()
            )
        )

    else:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view assignments"
        )

    assignments = result.scalars().all()
    for a in assignments:
        await _enrich_assignment_details(session, a)
    return assignments


# =========================================================
# GET ASSIGNMENT BY ID
# =========================================================

@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse
)
async def get_assignment(
    assignment_id: int,
    current_user: dict | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Assignment).where(
            Assignment.assignment_id == assignment_id
        )
    )

    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    # If logged in as specific roles, apply checks
    if current_user:
        if current_user["role"] == "NGO":
            ngo_result = await session.execute(
                select(NGO).where(
                    NGO.user_id == current_user["user_id"]
                )
            )
            ngo = ngo_result.scalar_one_or_none()
            if ngo and assignment.ngo_id != ngo.ngo_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view your NGO's assignments"
                )

        elif current_user["role"] == "DONOR":
            donation_result = await session.execute(
                select(Donation).where(
                    Donation.donation_id == assignment.donation_id
                )
            )
            donation = donation_result.scalar_one_or_none()
            if donation and donation.donor_id != current_user["user_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view assignments for your donations"
                )

    await _enrich_assignment_details(session, assignment)
    return assignment


# =========================================================
# ACCEPT ASSIGNMENT (VOLUNTEER CLAIM)
# =========================================================

@router.post(
    "/{assignment_id}/accept",
    response_model=AssignmentResponse
)
async def accept_assignment(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user["role"] != "VOLUNTEER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only volunteers can accept assignments"
        )

    volunteer_result = await session.execute(
        select(Volunteer).where(
            Volunteer.user_id == current_user["user_id"]
        )
    )
    volunteer = volunteer_result.scalar_one_or_none()

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer profile not found"
        )

    assignment_result = await session.execute(
        select(Assignment).where(
            Assignment.assignment_id == assignment_id
        )
    )
    assignment = assignment_result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if (
        assignment.volunteer_id is not None
        and assignment.volunteer_id != volunteer.volunteer_id
        and assignment.status not in ["REQUESTED", "PENDING"]
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This assignment has already been claimed by another volunteer"
        )

    donation_result = await session.execute(
        select(Donation).where(
            Donation.donation_id == assignment.donation_id
        )
    )
    donation = donation_result.scalar_one_or_none()

    ngo_result = await session.execute(
        select(NGO).where(
            NGO.ngo_id == assignment.ngo_id
        )
    )
    ngo = ngo_result.scalar_one_or_none()

    # Assign to this volunteer
    assignment.volunteer_id = volunteer.volunteer_id
    assignment.status = "ACCEPTED"
    volunteer.availability = "ASSIGNED"

    if donation:
        donation.status = "ASSIGNED"

    food_title = donation.food_name if donation else "food donation"

    # Notify Volunteer
    await create_notification(
        session=session,
        user_id=volunteer.user_id,
        message=f"You accepted the delivery request for {food_title}.",
        notification_type="ASSIGNMENT_ACCEPTED"
    )

    # Notify NGO
    if ngo:
        await create_notification(
            session=session,
            user_id=ngo.user_id,
            message=f"Volunteer has accepted the delivery request for {food_title}.",
            notification_type="ASSIGNMENT_ACCEPTED"
        )

    # Notify Donor
    if donation:
        await create_notification(
            session=session,
            user_id=donation.donor_id,
            message=f"A volunteer has accepted the delivery request for your donation {food_title}.",
            notification_type="ASSIGNMENT_ACCEPTED"
        )

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="ASSIGNMENT_ACCEPTED",
        entity_type="ASSIGNMENT",
        entity_id=assignment.assignment_id,
        details=(
            f"Volunteer #{volunteer.volunteer_id} accepted assignment "
            f"#{assignment.assignment_id} for donation #{assignment.donation_id}"
        )
    )

    await session.commit()
    await session.refresh(assignment)
    await _enrich_assignment_details(session, assignment)

    return assignment


# =========================================================
# UPDATE ASSIGNMENT STATUS
# =========================================================

@router.put(
    "/{assignment_id}/status",
    response_model=AssignmentResponse
)
async def update_assignment_status(
    assignment_id: int,
    data: AssignmentStatusUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    new_status = data.status.upper()

    allowed_statuses = [
        "REQUESTED",
        "ACCEPTED",
        "ASSIGNED",
        "PICKUP_IN_PROGRESS",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED"
    ]

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Status must be REQUESTED, ACCEPTED, ASSIGNED, "
                "PICKUP_IN_PROGRESS, PICKED_UP, IN_TRANSIT, DELIVERED, COMPLETED, or CANCELLED"
            )
        )

    # -----------------------------------------------------
    # FIND ASSIGNMENT
    # -----------------------------------------------------

    result = await session.execute(
        select(Assignment).where(
            Assignment.assignment_id == assignment_id
        )
    )

    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    # -----------------------------------------------------
    # FIND DONATION
    # -----------------------------------------------------

    donation_result = await session.execute(
        select(Donation).where(
            Donation.donation_id == assignment.donation_id
        )
    )

    donation = donation_result.scalar_one_or_none()

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )

    # -----------------------------------------------------
    # CHECK USER PERMISSION
    # -----------------------------------------------------

    volunteer = None

    if current_user["role"] == "ADMIN":
        pass

    elif current_user["role"] == "VOLUNTEER":

        volunteer_result = await session.execute(
            select(Volunteer).where(
                Volunteer.user_id == current_user["user_id"]
            )
        )

        volunteer = volunteer_result.scalar_one_or_none()

        if not volunteer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Volunteer profile not found"
            )

        if assignment.volunteer_id is None:
            # Claim unassigned assignment
            assignment.volunteer_id = volunteer.volunteer_id
            volunteer.availability = "ASSIGNED"
        elif assignment.volunteer_id != volunteer.volunteer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own assignments"
            )

    else:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only admins or the assigned volunteer "
                "can update assignment status"
            )
        )

    # -----------------------------------------------------
    # PREVENT CHANGES AFTER DELIVERY/CANCELLATION
    # -----------------------------------------------------

    if assignment.status in ["DELIVERED", "COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assignment can no longer be updated"
        )

    old_status = assignment.status

    # -----------------------------------------------------
    # UPDATE ASSIGNMENT & DONATION STATUS
    # -----------------------------------------------------

    assignment.status = new_status

    if new_status in ["ASSIGNED", "ACCEPTED", "PICKUP_IN_PROGRESS"]:
        donation.status = "ASSIGNED"

    elif new_status == "PICKED_UP":
        donation.status = "PICKED_UP"

    elif new_status == "IN_TRANSIT":
        donation.status = "IN_TRANSIT"

    elif new_status in ["DELIVERED", "COMPLETED"]:
        assignment.status = "DELIVERED"
        donation.status = "DELIVERED"

    elif new_status == "CANCELLED":
        donation.status = "CANCELLED"

    # -----------------------------------------------------
    # FIND NGO
    # -----------------------------------------------------

    ngo_result = await session.execute(
        select(NGO).where(
            NGO.ngo_id == assignment.ngo_id
        )
    )

    ngo = ngo_result.scalar_one_or_none()

    # -----------------------------------------------------
    # FIND VOLUNTEER IF NOT ALREADY QUERIED
    # -----------------------------------------------------

    if volunteer is None and assignment.volunteer_id is not None:
        volunteer_result = await session.execute(
            select(Volunteer).where(
                Volunteer.volunteer_id == assignment.volunteer_id
            )
        )
        volunteer = volunteer_result.scalar_one_or_none()

    # -----------------------------------------------------
    # RELEASE VOLUNTEER
    # -----------------------------------------------------

    if new_status in ["DELIVERED", "COMPLETED", "CANCELLED"]:
        if volunteer:
            volunteer.availability = "AVAILABLE"

    # -----------------------------------------------------
    # DISPATCH CONTEXT-AWARE NOTIFICATIONS
    # -----------------------------------------------------

    food_title = donation.food_name if donation else "food donation"

    if new_status in ["DELIVERED", "COMPLETED"]:
        ngo_name = ngo.organization_name if ngo else "the NGO"
        await create_notification(
            session=session,
            user_id=donation.donor_id,
            message=f"Your donation {food_title} has been delivered successfully to {ngo_name}.",
            notification_type="DELIVERY_COMPLETED"
        )
        if ngo:
            await create_notification(
                session=session,
                user_id=ngo.user_id,
                message=f"The food donation {food_title} has been delivered to your location.",
                notification_type="DELIVERY_COMPLETED"
            )
        if volunteer:
            await create_notification(
                session=session,
                user_id=volunteer.user_id,
                message=f"Delivery completed successfully! Thank you for redistributing food with MealBridge.",
                notification_type="DELIVERY_COMPLETED"
            )

    elif new_status == "PICKED_UP":
        await create_notification(
            session=session,
            user_id=donation.donor_id,
            message=f"Volunteer has picked up your food donation {food_title}.",
            notification_type="PICKUP_COMPLETED"
        )
        if ngo:
            await create_notification(
                session=session,
                user_id=ngo.user_id,
                message=f"Volunteer has picked up {food_title} and is on the way.",
                notification_type="PICKUP_COMPLETED"
            )

    elif new_status == "IN_TRANSIT":
        if ngo:
            await create_notification(
                session=session,
                user_id=ngo.user_id,
                message=f"Food donation {food_title} is in transit to your location.",
                notification_type="ASSIGNMENT_STATUS"
            )

    elif new_status == "PICKUP_IN_PROGRESS":
        await create_notification(
            session=session,
            user_id=donation.donor_id,
            message=f"Volunteer is on the way to pick up your donation {food_title}.",
            notification_type="PICKUP_IN_PROGRESS"
        )

    else:
        await create_notification(
            session=session,
            user_id=donation.donor_id,
            message=f"Your donation {food_title} status changed to {new_status}.",
            notification_type="ASSIGNMENT_STATUS"
        )
        if ngo:
            await create_notification(
                session=session,
                user_id=ngo.user_id,
                message=f"Delivery status for {food_title} changed to {new_status}.",
                notification_type="ASSIGNMENT_STATUS"
            )

    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="ASSIGNMENT_STATUS_CHANGED",
        entity_type="ASSIGNMENT",
        entity_id=assignment.assignment_id,
        details=(
            f"Assignment #{assignment.assignment_id} "
            f"status changed from {old_status} "
            f"to {new_status}"
        )
    )

    await session.commit()
    await session.refresh(assignment)
    await _enrich_assignment_details(session, assignment)

    return assignment