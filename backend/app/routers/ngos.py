from math import radians, sin, cos, sqrt, atan2

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.postgres import get_session

from app.models.ngo import NGO

from app.schemas.ngo import (
    NGOUpdate,
    NGOResponse
)

from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/ngos",
    tags=["NGOs"]
)


# =========================================================
# GET ALL NGOS
# =========================================================

@router.get(
    "/",
    response_model=list[NGOResponse]
)
async def get_ngos(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(NGO).order_by(
            NGO.ngo_id
        )
    )

    return result.scalars().all()


# =========================================================
# GET NGO BY ID
# =========================================================

@router.get(
    "/{ngo_id}",
    response_model=NGOResponse
)
async def get_ngo(
    ngo_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(NGO).where(
            NGO.ngo_id == ngo_id
        )
    )

    ngo = result.scalar_one_or_none()

    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )

    return ngo


# =========================================================
# GET NEARBY NGOS
# =========================================================

@router.get(
    "/nearby/search",
    response_model=list[NGOResponse]
)
async def nearby_ngos(
    latitude: float,
    longitude: float,
    radius_km: float = 10,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(NGO).where(
            NGO.latitude.is_not(None),
            NGO.longitude.is_not(None)
        )
    )

    ngos = result.scalars().all()

    nearby = []

    earth_radius_km = 6371.0

    for ngo in ngos:

        lat1 = radians(latitude)
        lon1 = radians(longitude)

        lat2 = radians(float(ngo.latitude))
        lon2 = radians(float(ngo.longitude))

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = (
            sin(dlat / 2) ** 2
            + cos(lat1)
            * cos(lat2)
            * sin(dlon / 2) ** 2
        )

        c = 2 * atan2(
            sqrt(a),
            sqrt(1 - a)
        )

        distance = earth_radius_km * c

        if distance <= radius_km:
            nearby.append(ngo)

    return nearby


# =========================================================
# UPDATE MY NGO PROFILE
# =========================================================

@router.put(
    "/me",
    response_model=NGOResponse
)
async def update_my_ngo_profile(
    data: NGOUpdate,
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):

    # Find NGO linked to logged-in user
    result = await session.execute(
        select(NGO).where(
            NGO.user_id == current_user["user_id"]
        )
    )

    ngo = result.scalar_one_or_none()

    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # Update only allowed fields
    for field, value in update_data.items():
        setattr(ngo, field, value)

    # Audit log
    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="NGO_PROFILE_UPDATED",
        entity_type="NGO",
        entity_id=ngo.ngo_id,
        details=(
            f"Updated NGO profile "
            f"#{ngo.ngo_id}"
        )
    )

    await session.commit()
    await session.refresh(ngo)

    return ngo