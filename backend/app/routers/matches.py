from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.postgres import get_session

from app.models.match import Match
from app.models.donation import Donation
from app.models.ngo import NGO

from app.schemas.match import (
    MatchCreate,
    MatchResponse,
    MatchStatusUpdate
)

from app.schemas.donation import DonationResponse

from app.services.matching_service import calculate_match_scores
from app.services.notification_service import create_notification
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/matches",
    tags=["Matches"]
)


# =========================================================
# CREATE MATCH
# ADMIN ONLY
# =========================================================

@router.post(
    "/",
    response_model=MatchResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_match(
    data: MatchCreate,
    current_user: dict = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):

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

    if donation.status != "POSTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only POSTED donations can be matched"
        )

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

    if ngo.verification_status != "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NGO is not verified"
        )

    existing_result = await session.execute(
        select(Match).where(
            Match.donation_id == data.donation_id,
            Match.ngo_id == data.ngo_id
        )
    )

    existing_match = existing_result.scalar_one_or_none()

    if existing_match:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Match already exists for this donation and NGO"
        )

    scores = calculate_match_scores(
        donation,
        ngo
    )

    match = Match(
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

    session.add(match)

    await session.flush()

    await create_notification(
        session=session,
        user_id=ngo.user_id,
        message=(
            f"New match created for donation "
            f"'{donation.food_name}'. "
            f"Match score: {scores['total_score']}"
        ),
        notification_type="MATCH_CREATED"
    )

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="MATCH_CREATED",
        entity_type="MATCH",
        entity_id=match.match_id,
        details=(
            f"Admin created match #{match.match_id} "
            f"for donation #{donation.donation_id} "
            f"with NGO #{ngo.ngo_id}. "
            f"Score: {scores['total_score']}"
        )
    )

    await session.commit()
    await session.refresh(match)

    return match


# =========================================================
# GET AVAILABLE DONATIONS FOR NGO
#
# Only POSTED donations
# Excludes donations that already have ACCEPTED matches
# =========================================================

@router.get(
    "/available",
    response_model=list[DonationResponse]
)
async def get_available_donations(
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Donation)
        .where(
            Donation.status == "POSTED"
        )
        .where(
            ~Donation.donation_id.in_(
                select(Match.donation_id)
                .where(
                    Match.status == "ACCEPTED"
                )
            )
        )
        .order_by(
            Donation.created_at.desc()
        )
    )

    donations = result.scalars().all()

    return donations


# =========================================================
# GET MATCHES
#
# ADMIN  -> all
# NGO    -> own
# DONOR  -> own donations
# VOLUNTEER -> forbidden
# =========================================================

@router.get(
    "/",
    response_model=list[MatchResponse]
)
async def get_matches(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    role = current_user["role"]

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if role == "ADMIN":

        result = await session.execute(
            select(Match).order_by(
                Match.matched_at.desc()
            )
        )

        return result.scalars().all()

    # -----------------------------------------------------
    # NGO
    # -----------------------------------------------------

    if role == "NGO":

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
            select(Match)
            .where(
                Match.ngo_id == ngo.ngo_id
            )
            .order_by(
                Match.matched_at.desc()
            )
        )

        return result.scalars().all()

    # -----------------------------------------------------
    # DONOR
    # -----------------------------------------------------

    if role == "DONOR":

        result = await session.execute(
            select(Match)
            .join(
                Donation,
                Match.donation_id == Donation.donation_id
            )
            .where(
                Donation.donor_id == current_user["user_id"]
            )
            .order_by(
                Match.matched_at.desc()
            )
        )

        return result.scalars().all()

    # -----------------------------------------------------
    # VOLUNTEER
    # -----------------------------------------------------

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Volunteers cannot access match records"
    )


# =========================================================
# GET NGO'S OWN MATCHES
# =========================================================

@router.get(
    "/my",
    response_model=list[MatchResponse]
)
async def get_my_matches(
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):

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
        select(Match)
        .where(
            Match.ngo_id == ngo.ngo_id
        )
        .order_by(
            Match.matched_at.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# GET MATCH BY ID
# =========================================================

@router.get(
    "/{match_id}",
    response_model=MatchResponse
)
async def get_match(
    match_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(Match).where(
            Match.match_id == match_id
        )
    )

    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )

    role = current_user["role"]

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if role == "ADMIN":
        return match

    # -----------------------------------------------------
    # NGO
    # -----------------------------------------------------

    if role == "NGO":

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

        if match.ngo_id != ngo.ngo_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your NGO's matches"
            )

        return match

    # -----------------------------------------------------
    # DONOR
    # -----------------------------------------------------

    if role == "DONOR":

        donation_result = await session.execute(
            select(Donation).where(
                Donation.donation_id == match.donation_id
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
                detail="You can only view matches for your donations"
            )

        return match

    # -----------------------------------------------------
    # VOLUNTEER
    # -----------------------------------------------------

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Volunteers cannot access match records"
    )


# =========================================================
# NGO ACCEPT / REJECT MATCH
# NGO ONLY
# =========================================================

@router.put(
    "/{match_id}/status",
    response_model=MatchResponse
)
async def update_match_status(
    match_id: int,
    data: MatchStatusUpdate,
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):

    new_status = data.status.upper()

    if new_status not in [
        "ACCEPTED",
        "REJECTED"
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be ACCEPTED or REJECTED"
        )

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

    match_result = await session.execute(
        select(Match).where(
            Match.match_id == match_id
        )
    )

    match = match_result.scalar_one_or_none()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )

    if match.ngo_id != ngo.ngo_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage matches assigned to your NGO"
        )

    if match.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING matches can be accepted or rejected"
        )

    donation_result = await session.execute(
        select(Donation).where(
            Donation.donation_id == match.donation_id
        )
    )

    donation = donation_result.scalar_one_or_none()

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )

    # -----------------------------------------------------
    # ACCEPT
    # -----------------------------------------------------

    if new_status == "ACCEPTED":

        if donation.status != "POSTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only POSTED donations can be accepted"
            )

        # Prevent another accepted match
        accepted_result = await session.execute(
            select(Match).where(
                Match.donation_id == match.donation_id,
                Match.status == "ACCEPTED",
                Match.match_id != match.match_id
            )
        )

        existing_accepted_match = (
            accepted_result.scalar_one_or_none()
        )

        if existing_accepted_match:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This donation has already been accepted by another NGO"
            )

        match.status = "ACCEPTED"

        if match.matched_at is None:
            match.matched_at = datetime.now()

        donation.status = "MATCHED"

        await create_notification(
            session=session,
            user_id=donation.donor_id,
            message=(
                f"Your donation #{donation.donation_id} "
                f"was accepted by "
                f"{ngo.organization_name}."
            ),
            notification_type="MATCH_ACCEPTED"
        )

        await create_audit_log(
            session=session,
            user_id=current_user["user_id"],
            action="MATCH_ACCEPTED",
            entity_type="MATCH",
            entity_id=match.match_id,
            details=(
                f"NGO #{ngo.ngo_id} accepted match "
                f"#{match.match_id} for donation "
                f"#{donation.donation_id}"
            )
        )

    # -----------------------------------------------------
    # REJECT
    # -----------------------------------------------------

    else:

        match.status = "REJECTED"

        await create_notification(
            session=session,
            user_id=donation.donor_id,
            message=(
                f"Your donation #{donation.donation_id} "
                f"match was rejected by "
                f"{ngo.organization_name}."
            ),
            notification_type="MATCH_REJECTED"
        )

        await create_audit_log(
            session=session,
            user_id=current_user["user_id"],
            action="MATCH_REJECTED",
            entity_type="MATCH",
            entity_id=match.match_id,
            details=(
                f"NGO #{ngo.ngo_id} rejected match "
                f"#{match.match_id} for donation "
                f"#{donation.donation_id}"
            )
        )

    await session.commit()

    await session.refresh(match)

    return match