from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.postgres import get_session

from app.models.assignment import Assignment
from app.models.donation import Donation
from app.models.ngo import NGO
from app.models.volunteer import Volunteer
from app.models.match import Match

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
                Assignment.volunteer_id == volunteer.volunteer_id
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

    return result.scalars().all()


# =========================================================
# GET ASSIGNMENT BY ID
# =========================================================

@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse
)
async def get_assignment(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
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

    # -----------------------------------------------------
    # ADMIN CAN VIEW ANY
    # -----------------------------------------------------

    if current_user["role"] == "ADMIN":
        return assignment

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

        if assignment.volunteer_id != volunteer.volunteer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own assignments"
            )

        return assignment

    # -----------------------------------------------------
    # NGO
    # -----------------------------------------------------

    if current_user["role"] == "NGO":

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

        if assignment.ngo_id != ngo.ngo_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your NGO's assignments"
            )

        return assignment

    # -----------------------------------------------------
    # DONOR
    # -----------------------------------------------------

    if current_user["role"] == "DONOR":

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

        if donation.donor_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view assignments for your donations"
            )

        return assignment

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this assignment"
    )


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
        "ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
        "DELIVERED",
        "CANCELLED"
    ]

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Status must be ASSIGNED, PICKED_UP, "
                "IN_TRANSIT, DELIVERED, or CANCELLED"
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

        if assignment.volunteer_id != volunteer.volunteer_id:
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

    if assignment.status in ["DELIVERED", "CANCELLED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assignment can no longer be updated"
        )

    old_status = assignment.status

    # -----------------------------------------------------
    # UPDATE ASSIGNMENT
    # -----------------------------------------------------

    assignment.status = new_status

    # -----------------------------------------------------
    # UPDATE DONATION STATUS
    # -----------------------------------------------------

    if new_status == "ASSIGNED":
        donation.status = "MATCHED"

    elif new_status == "PICKED_UP":
        donation.status = "PICKED_UP"

    elif new_status == "IN_TRANSIT":
        donation.status = "IN_TRANSIT"

    elif new_status == "DELIVERED":
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
    # FIND VOLUNTEER
    # -----------------------------------------------------

    volunteer_result = await session.execute(
        select(Volunteer).where(
            Volunteer.volunteer_id == assignment.volunteer_id
        )
    )

    volunteer = volunteer_result.scalar_one_or_none()

    # -----------------------------------------------------
    # RELEASE VOLUNTEER
    # -----------------------------------------------------

    if new_status in ["DELIVERED", "CANCELLED"]:

        if volunteer:
            volunteer.availability = "AVAILABLE"

    # -----------------------------------------------------
    # NOTIFY DONOR
    # -----------------------------------------------------

    await create_notification(
        session=session,
        user_id=donation.donor_id,
        message=(
            f"Your donation {donation.food_name} "
            f"status changed to {new_status}."
        ),
        notification_type="ASSIGNMENT_STATUS"
    )

    # -----------------------------------------------------
    # NOTIFY NGO
    # -----------------------------------------------------

    if ngo:

        await create_notification(
            session=session,
            user_id=ngo.user_id,
            message=(
                f"Delivery status for {donation.food_name} "
                f"changed to {new_status}."
            ),
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

    return assignment