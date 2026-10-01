from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.postgres import get_session

from app.models.volunteer import Volunteer

from app.schemas.volunteer import (
    VolunteerUpdate,
    VolunteerLocationUpdate,
    VolunteerResponse
)

from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/volunteers",
    tags=["Volunteers"]
)


# =========================================================
# GET MY VOLUNTEER PROFILE
# =========================================================

@router.get(
    "/me",
    response_model=VolunteerResponse
)
async def get_my_volunteer_profile(
    current_user: dict = Depends(require_role("VOLUNTEER")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Volunteer).where(
            Volunteer.user_id == current_user["user_id"]
        )
    )

    volunteer = result.scalar_one_or_none()

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer profile not found"
        )

    return volunteer


# =========================================================
# UPDATE MY VOLUNTEER PROFILE
# =========================================================

@router.put(
    "/me",
    response_model=VolunteerResponse
)
async def update_my_volunteer_profile(
    data: VolunteerUpdate,
    current_user: dict = Depends(require_role("VOLUNTEER")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Volunteer).where(
            Volunteer.user_id == current_user["user_id"]
        )
    )

    volunteer = result.scalar_one_or_none()

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer profile not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # AVAILABILITY
    # -----------------------------------------------------

    if "availability" in update_data:

        new_availability = update_data["availability"]

        if new_availability is not None:
            new_availability = new_availability.upper()

        # ASSIGNED is controlled by assignment operations
        if new_availability not in [
            "AVAILABLE",
            "UNAVAILABLE"
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Availability must be AVAILABLE or UNAVAILABLE"
            )

        # A volunteer with an active assignment cannot mark
        # themselves as unavailable
        if (
            volunteer.availability == "ASSIGNED"
            and new_availability == "UNAVAILABLE"
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Volunteer with an active assignment "
                    "cannot mark themselves unavailable"
                )
            )

        update_data["availability"] = new_availability

    # -----------------------------------------------------
    # UPDATE PROFILE FIELDS
    # -----------------------------------------------------

    for field, value in update_data.items():
        setattr(volunteer, field, value)

    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="VOLUNTEER_PROFILE_UPDATED",
        entity_type="VOLUNTEER",
        entity_id=volunteer.volunteer_id,
        details=(
            f"Volunteer #{volunteer.volunteer_id} "
            f"updated their profile"
        )
    )

    await session.commit()
    await session.refresh(volunteer)

    return volunteer


# =========================================================
# UPDATE MY LOCATION
# =========================================================

@router.put(
    "/me/location",
    response_model=VolunteerResponse
)
async def update_my_location(
    data: VolunteerLocationUpdate,
    current_user: dict = Depends(require_role("VOLUNTEER")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Volunteer).where(
            Volunteer.user_id == current_user["user_id"]
        )
    )

    volunteer = result.scalar_one_or_none()

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer profile not found"
        )

    volunteer.current_location = data.current_location
    volunteer.latitude = data.latitude
    volunteer.longitude = data.longitude

    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="VOLUNTEER_LOCATION_UPDATED",
        entity_type="VOLUNTEER",
        entity_id=volunteer.volunteer_id,
        details=(
            f"Volunteer #{volunteer.volunteer_id} "
            f"updated location to "
            f"{data.current_location or 'location coordinates'}"
        )
    )

    await session.commit()
    await session.refresh(volunteer)

    return volunteer


# =========================================================
# GET ALL VOLUNTEERS
# ADMIN ONLY
# =========================================================

@router.get(
    "/",
    response_model=list[VolunteerResponse]
)
async def get_all_volunteers(
    current_user: dict = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Volunteer).order_by(
            Volunteer.volunteer_id
        )
    )

    return result.scalars().all()


# =========================================================
# GET VOLUNTEER BY ID
# =========================================================

@router.get(
    "/{volunteer_id}",
    response_model=VolunteerResponse
)
async def get_volunteer(
    volunteer_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Volunteer).where(
            Volunteer.volunteer_id == volunteer_id
        )
    )

    volunteer = result.scalar_one_or_none()

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )

    # -----------------------------------------------------
    # ADMIN CAN VIEW ANY VOLUNTEER
    # -----------------------------------------------------

    if current_user["role"] == "ADMIN":
        return volunteer

    # -----------------------------------------------------
    # VOLUNTEER CAN VIEW ONLY THEMSELVES
    # -----------------------------------------------------

    if current_user["role"] == "VOLUNTEER":

        if volunteer.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own volunteer profile"
            )

        return volunteer

    # -----------------------------------------------------
    # NGO / DONOR
    # -----------------------------------------------------

    if current_user["role"] in ["NGO", "DONOR"]:
        return volunteer

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this volunteer"
    )