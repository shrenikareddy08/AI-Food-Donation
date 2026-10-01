from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.postgres import get_session

from app.models.delivery_confirmation import DeliveryConfirmation
from app.models.assignment import Assignment
from app.models.donation import Donation
from app.models.ngo import NGO
from app.models.volunteer import Volunteer

from app.schemas.delivery_confirmation import (
    DeliveryConfirmationCreate,
    DeliveryConfirmationResponse
)

from app.services.notification_service import create_notification
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/delivery-confirmations",
    tags=["Delivery Confirmations"]
)


# =========================================================
# CREATE DELIVERY CONFIRMATION
# =========================================================

@router.post(
    "/",
    response_model=DeliveryConfirmationResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_delivery_confirmation(
    data: DeliveryConfirmationCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    # -----------------------------------------------------
    # ONLY NGO CAN CONFIRM DELIVERY
    # -----------------------------------------------------

    if current_user["role"] != "NGO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can confirm delivery"
        )

    # -----------------------------------------------------
    # FIND NGO PROFILE
    # -----------------------------------------------------

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
    # CHECK NGO OWNERSHIP
    # -----------------------------------------------------

    if assignment.ngo_id != ngo.ngo_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only confirm deliveries for your NGO"
        )

    # -----------------------------------------------------
    # ASSIGNMENT MUST BE DELIVERED
    # -----------------------------------------------------

    if assignment.status != "DELIVERED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery can only be confirmed after assignment is DELIVERED"
        )

    # -----------------------------------------------------
    # CHECK DUPLICATE CONFIRMATION
    # -----------------------------------------------------

    existing_result = await session.execute(
        select(DeliveryConfirmation).where(
            DeliveryConfirmation.donation_id == assignment.donation_id
        )
    )

    existing_confirmation = existing_result.scalar_one_or_none()

    if existing_confirmation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delivery is already confirmed"
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
    # FIND VOLUNTEER
    # -----------------------------------------------------

    volunteer_result = await session.execute(
        select(Volunteer).where(
            Volunteer.volunteer_id == assignment.volunteer_id
        )
    )

    volunteer = volunteer_result.scalar_one_or_none()

    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )

    # -----------------------------------------------------
    # CREATE CONFIRMATION
    # -----------------------------------------------------

    confirmation = DeliveryConfirmation(
        donation_id=assignment.donation_id,
        ngo_id=assignment.ngo_id,
        volunteer_id=assignment.volunteer_id,
        verification_method=data.verification_method,
        remarks=data.remarks
    )

    session.add(confirmation)

    await session.flush()

    # -----------------------------------------------------
    # UPDATE DONATION STATUS
    # -----------------------------------------------------

    donation.status = "DELIVERED"

    # -----------------------------------------------------
    # NOTIFY DONOR
    # -----------------------------------------------------

    await create_notification(
        session=session,
        user_id=donation.donor_id,
        message=(
            f"Your food donation {donation.food_name} "
            f"has been delivered and confirmed by the NGO."
        ),
        notification_type="DELIVERY_CONFIRMED"
    )

    # -----------------------------------------------------
    # NOTIFY VOLUNTEER
    # -----------------------------------------------------

    await create_notification(
        session=session,
        user_id=volunteer.user_id,
        message=(
            f"Delivery of {donation.food_name} "
            f"has been confirmed by the NGO."
        ),
        notification_type="DELIVERY_CONFIRMED"
    )

    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="DELIVERY_CONFIRMED",
        entity_type="DELIVERY_CONFIRMATION",
        entity_id=confirmation.confirmation_id,
        details=(
            f"NGO #{ngo.ngo_id} confirmed delivery for "
            f"donation #{donation.donation_id}, "
            f"assignment #{assignment.assignment_id}, "
            f"volunteer #{volunteer.volunteer_id}. "
            f"Verification method: "
            f"{data.verification_method}"
        )
    )

    await session.commit()
    await session.refresh(confirmation)

    return confirmation


# =========================================================
# GET ALL DELIVERY CONFIRMATIONS
# =========================================================

@router.get(
    "/",
    response_model=list[DeliveryConfirmationResponse]
)
async def get_delivery_confirmations(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

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

        result = await session.execute(
            select(DeliveryConfirmation)
            .where(
                DeliveryConfirmation.ngo_id == ngo.ngo_id
            )
            .order_by(
                DeliveryConfirmation.confirmed_at.desc()
            )
        )

        return result.scalars().all()

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
            select(DeliveryConfirmation)
            .where(
                DeliveryConfirmation.volunteer_id
                == volunteer.volunteer_id
            )
            .order_by(
                DeliveryConfirmation.confirmed_at.desc()
            )
        )

        return result.scalars().all()

    # -----------------------------------------------------
    # DONOR
    # -----------------------------------------------------

    if current_user["role"] == "DONOR":

        result = await session.execute(
            select(DeliveryConfirmation)
            .join(
                Donation,
                DeliveryConfirmation.donation_id
                == Donation.donation_id
            )
            .where(
                Donation.donor_id
                == current_user["user_id"]
            )
            .order_by(
                DeliveryConfirmation.confirmed_at.desc()
            )
        )

        return result.scalars().all()

    # -----------------------------------------------------
    # ADMIN
    # -----------------------------------------------------

    if current_user["role"] == "ADMIN":

        result = await session.execute(
            select(DeliveryConfirmation)
            .order_by(
                DeliveryConfirmation.confirmed_at.desc()
            )
        )

        return result.scalars().all()

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view confirmations"
    )


# =========================================================
# GET DELIVERY CONFIRMATION BY ID
# =========================================================

@router.get(
    "/{confirmation_id}",
    response_model=DeliveryConfirmationResponse
)
async def get_delivery_confirmation(
    confirmation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(DeliveryConfirmation).where(
            DeliveryConfirmation.confirmation_id
            == confirmation_id
        )
    )

    confirmation = result.scalar_one_or_none()

    if not confirmation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery confirmation not found"
        )

    # -----------------------------------------------------
    # ADMIN CAN VIEW ANY
    # -----------------------------------------------------

    if current_user["role"] == "ADMIN":
        return confirmation

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

        if confirmation.ngo_id != ngo.ngo_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your NGO's confirmations"
            )

        return confirmation

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

        if confirmation.volunteer_id != volunteer.volunteer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own confirmations"
            )

        return confirmation

    # -----------------------------------------------------
    # DONOR
    # -----------------------------------------------------

    if current_user["role"] == "DONOR":

        donation_result = await session.execute(
            select(Donation).where(
                Donation.donation_id
                == confirmation.donation_id
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
                detail="You can only view confirmations for your donations"
            )

        return confirmation

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this confirmation"
    )