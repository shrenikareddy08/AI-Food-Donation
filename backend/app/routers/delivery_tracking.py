from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.postgres import get_session

from app.models.delivery_tracking import DeliveryTracking
from app.models.assignment import Assignment
from app.models.volunteer import Volunteer
from app.models.ngo import NGO
from app.models.donation import Donation

from app.schemas.delivery_tracking import (
    DeliveryTrackingCreate,
    DeliveryTrackingResponse
)


router = APIRouter(
    prefix="/api/delivery-tracking",
    tags=["Delivery Tracking"]
)


# =========================================================
# ADD DELIVERY TRACKING
# VOLUNTEER ONLY
# =========================================================

@router.post(
    "/",
    response_model=DeliveryTrackingResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_delivery_tracking(
    data: DeliveryTrackingCreate,
    current_user: dict = Depends(require_role("VOLUNTEER")),
    session: AsyncSession = Depends(get_session)
):

    # -----------------------------------------------------
    # FIND VOLUNTEER PROFILE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # FIND ASSIGNMENT
    # -----------------------------------------------------

    assignment_result = await session.execute(
        select(Assignment).where(
            Assignment.assignment_id == data.assignment_id
        )
    )

    assignment = assignment_result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    # -----------------------------------------------------
    # CHECK ASSIGNMENT OWNERSHIP
    # -----------------------------------------------------

    if assignment.volunteer_id != volunteer.volunteer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update tracking for your own assignments"
        )

    # -----------------------------------------------------
    # TRACKING ONLY DURING ACTIVE DELIVERY
    # -----------------------------------------------------

    if assignment.status not in [
        "PICKED_UP",
        "IN_TRANSIT"
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Tracking can only be added when assignment "
                "status is PICKED_UP or IN_TRANSIT"
            )
        )

    # -----------------------------------------------------
    # CREATE TRACKING RECORD
    # -----------------------------------------------------

    tracking = DeliveryTracking(
        assignment_id=data.assignment_id,
        volunteer_id=volunteer.volunteer_id,
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy=data.accuracy,
        speed=data.speed,
        heading=data.heading,
        status=data.status,
        recorded_at=datetime.now(timezone.utc)
    )

    session.add(tracking)

    await session.commit()
    await session.refresh(tracking)

    return tracking


# =========================================================
# GET TRACKING HISTORY FOR ASSIGNMENT
# =========================================================

@router.get(
    "/assignment/{assignment_id}",
    response_model=list[DeliveryTrackingResponse]
)
async def get_assignment_tracking(
    assignment_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    # -----------------------------------------------------
    # FIND ASSIGNMENT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if current_user["role"] == "ADMIN":
        pass

    # -----------------------------------------------------
    # VOLUNTEER
    # -----------------------------------------------------

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
                detail="You can only view tracking for your own assignments"
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

        if assignment.ngo_id != ngo.ngo_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view tracking for your NGO's assignments"
            )

    # -----------------------------------------------------
    # DONOR
    # -----------------------------------------------------

    elif current_user["role"] == "DONOR":

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
                detail=(
                    "You can only view tracking for "
                    "your own donations"
                )
            )

    else:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view tracking"
        )

    # -----------------------------------------------------
    # GET TRACKING HISTORY
    # -----------------------------------------------------

    result = await session.execute(
        select(DeliveryTracking)
        .where(
            DeliveryTracking.assignment_id == assignment_id
        )
        .order_by(
            DeliveryTracking.recorded_at.asc()
        )
    )

    return result.scalars().all()


# =========================================================
# GET TRACKING RECORD BY ID
# =========================================================

@router.get(
    "/{tracking_id}",
    response_model=DeliveryTrackingResponse
)
async def get_tracking_record(
    tracking_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    # -----------------------------------------------------
    # FIND TRACKING
    # -----------------------------------------------------

    tracking_result = await session.execute(
        select(DeliveryTracking).where(
            DeliveryTracking.tracking_id == tracking_id
        )
    )

    tracking = tracking_result.scalar_one_or_none()

    if not tracking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracking record not found"
        )

    # -----------------------------------------------------
    # FIND ASSIGNMENT
    # -----------------------------------------------------

    assignment_result = await session.execute(
        select(Assignment).where(
            Assignment.assignment_id
            == tracking.assignment_id
        )
    )

    assignment = assignment_result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if current_user["role"] == "ADMIN":
        return tracking

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
                detail="You can only view your own tracking records"
            )

        return tracking

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
                detail="You can only view your NGO's tracking records"
            )

        return tracking

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
                detail=(
                    "You can only view tracking records "
                    "for your own donations"
                )
            )

        return tracking

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this tracking record"
    )