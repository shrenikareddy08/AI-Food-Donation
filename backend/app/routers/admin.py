from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_role
from app.db.postgres import get_session

from app.models.user import User
from app.models.donation import Donation
from app.models.ngo import NGO
from app.models.volunteer import Volunteer
from app.models.match import Match
from app.models.assignment import Assignment
from app.models.delivery_confirmation import DeliveryConfirmation

from app.schemas.admin import (
    AdminDashboardResponse,
    NGOVerificationUpdate
)

from app.schemas.ngo import NGOResponse

from app.services.notification_service import create_notification
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse
)
async def admin_dashboard(
    current_user: dict = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):

    # -----------------------------------------------------
    # USERS
    # -----------------------------------------------------

    total_users_result = await session.execute(
        select(func.count(User.user_id))
    )

    total_users = total_users_result.scalar() or 0

    # -----------------------------------------------------
    # DONATIONS
    # -----------------------------------------------------

    total_donations_result = await session.execute(
        select(func.count(Donation.donation_id))
    )

    total_donations = total_donations_result.scalar() or 0

    posted_donations_result = await session.execute(
        select(func.count(Donation.donation_id))
        .where(
            Donation.status == "POSTED"
        )
    )

    posted_donations = (
        posted_donations_result.scalar() or 0
    )

    delivered_donations_result = await session.execute(
        select(func.count(Donation.donation_id))
        .where(
            Donation.status == "DELIVERED"
        )
    )

    delivered_donations = (
        delivered_donations_result.scalar() or 0
    )

    # -----------------------------------------------------
    # NGOS
    # -----------------------------------------------------

    total_ngos_result = await session.execute(
        select(func.count(NGO.ngo_id))
    )

    total_ngos = total_ngos_result.scalar() or 0

    verified_ngos_result = await session.execute(
        select(func.count(NGO.ngo_id))
        .where(
            NGO.verification_status == "VERIFIED"
        )
    )

    verified_ngos = (
        verified_ngos_result.scalar() or 0
    )

    # -----------------------------------------------------
    # VOLUNTEERS
    # -----------------------------------------------------

    total_volunteers_result = await session.execute(
        select(func.count(Volunteer.volunteer_id))
    )

    total_volunteers = (
        total_volunteers_result.scalar() or 0
    )

    available_volunteers_result = await session.execute(
        select(func.count(Volunteer.volunteer_id))
        .where(
            Volunteer.availability == "AVAILABLE"
        )
    )

    available_volunteers = (
        available_volunteers_result.scalar() or 0
    )

    # -----------------------------------------------------
    # MATCHES
    # -----------------------------------------------------

    total_matches_result = await session.execute(
        select(func.count(Match.match_id))
    )

    total_matches = total_matches_result.scalar() or 0

    pending_matches_result = await session.execute(
        select(func.count(Match.match_id))
        .where(
            Match.status == "PENDING"
        )
    )

    pending_matches = (
        pending_matches_result.scalar() or 0
    )

    # -----------------------------------------------------
    # ASSIGNMENTS
    # -----------------------------------------------------

    total_assignments_result = await session.execute(
        select(func.count(Assignment.assignment_id))
    )

    total_assignments = (
        total_assignments_result.scalar() or 0
    )

    active_assignments_result = await session.execute(
        select(func.count(Assignment.assignment_id))
        .where(
            Assignment.status.in_(
                [
                    "ASSIGNED",
                    "PICKED_UP",
                    "IN_TRANSIT"
                ]
            )
        )
    )

    active_assignments = (
        active_assignments_result.scalar() or 0
    )

    completed_assignments_result = await session.execute(
        select(func.count(Assignment.assignment_id))
        .where(
            Assignment.status == "DELIVERED"
        )
    )

    completed_assignments = (
        completed_assignments_result.scalar() or 0
    )

    # -----------------------------------------------------
    # DELIVERY CONFIRMATIONS
    # -----------------------------------------------------

    total_confirmations_result = await session.execute(
        select(func.count(
            DeliveryConfirmation.confirmation_id
        ))
    )

    total_confirmations = (
        total_confirmations_result.scalar() or 0
    )

    return {
        "total_users": total_users,
        "total_donations": total_donations,
        "posted_donations": posted_donations,
        "delivered_donations": delivered_donations,
        "total_ngos": total_ngos,
        "verified_ngos": verified_ngos,
        "total_volunteers": total_volunteers,
        "available_volunteers": available_volunteers,
        "total_matches": total_matches,
        "pending_matches": pending_matches,
        "total_assignments": total_assignments,
        "active_assignments": active_assignments,
        "completed_assignments": completed_assignments,
        "total_confirmations": total_confirmations
    }


# =========================================================
# GET ALL NGOS FOR ADMIN
# =========================================================

@router.get(
    "/ngos",
    response_model=list[NGOResponse]
)
async def get_admin_ngos(
    current_user: dict = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(NGO).order_by(
            NGO.ngo_id
        )
    )

    return result.scalars().all()


# =========================================================
# VERIFY / REJECT NGO
# =========================================================

@router.put(
    "/ngos/{ngo_id}/verification",
    response_model=NGOResponse
)
async def update_ngo_verification(
    ngo_id: int,
    data: NGOVerificationUpdate,
    current_user: dict = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):

    new_status = data.verification_status.upper()

    # -----------------------------------------------------
    # VALID STATUS
    # -----------------------------------------------------

    if new_status not in [
        "VERIFIED",
        "REJECTED",
        "PENDING"
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "verification_status must be "
                "VERIFIED, REJECTED, or PENDING"
            )
        )

    # -----------------------------------------------------
    # FIND NGO
    # -----------------------------------------------------

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

    old_status = ngo.verification_status

    # -----------------------------------------------------
    # UPDATE STATUS
    # -----------------------------------------------------

    ngo.verification_status = new_status

    # -----------------------------------------------------
    # NOTIFY NGO
    # -----------------------------------------------------

    await create_notification(
        session=session,
        user_id=ngo.user_id,
        message=(
            f"Your NGO verification status has been "
            f"changed from {old_status} to {new_status}."
        ),
        notification_type="NGO_VERIFICATION"
    )

    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="NGO_VERIFICATION_UPDATED",
        entity_type="NGO",
        entity_id=ngo.ngo_id,
        details=(
            f"NGO #{ngo.ngo_id} verification status "
            f"changed from {old_status} to {new_status}"
        )
    )

    await session.commit()
    await session.refresh(ngo)

    return ngo