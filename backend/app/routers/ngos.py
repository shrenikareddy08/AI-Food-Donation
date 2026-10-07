from datetime import datetime, timedelta
import logging
from math import radians, sin, cos, sqrt, atan2
import re
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.postgres import get_session

from app.models.ngo import NGO, NGOEmailVerificationToken
from app.models.user import User

from app.schemas.ngo import (
    NGOUpdate,
    NGOResponse,
    EmailVerificationRequest,
    EmailVerificationResponse
)

from app.services.audit_service import create_audit_log
from app.services.email_service import email_service

logger = logging.getLogger("mealbridge.ngos")

router = APIRouter(
    prefix="/api/ngos",
    tags=["NGOs"]
)

# Dedicated router for /api/ngo/email/ singular prefix
ngo_email_router = APIRouter(
    prefix="/api/ngo/email",
    tags=["NGO Email Verification"]
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
# GET LOGGED IN NGO
# =========================================================

@router.get(
    "/me",
    response_model=NGOResponse
)
async def get_my_ngo(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(NGO).where(
            NGO.user_id == current_user["user_id"]
        )
    )
    ngo = result.scalar_one_or_none()
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found for current user"
        )
    return ngo


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


# =========================================================
# NGO EMAIL VERIFICATION HELPERS & ENDPOINTS
# =========================================================

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def _is_valid_email(email: str | None) -> bool:
    if not email or not isinstance(email, str):
        return False
    email = email.strip()
    if len(email) < 5 or len(email) > 150:
        return False
    if not EMAIL_REGEX.match(email):
        return False
    parts = email.split("@")
    if len(parts) != 2:
        return False
    domain = parts[1]
    if "." not in domain or domain.startswith(".") or domain.endswith("."):
        return False
    tld = domain.split(".")[-1]
    if len(tld) < 2 or not tld.isalpha():
        return False
    return True


async def _handle_send_or_resend_verification(
    data: EmailVerificationRequest | None,
    current_user: dict,
    session: AsyncSession
):
    # Lookup NGO
    ngo_res = await session.execute(
        select(NGO).where(NGO.user_id == current_user["user_id"])
    )
    ngo = ngo_res.scalar_one_or_none()
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )

    # Determine target email
    target_email = (data.email.strip() if data and data.email else None)
    if not target_email:
        target_email = ngo.email or ""

    if not target_email:
        # Fallback to user email
        user_res = await session.execute(
            select(User.email).where(User.user_id == current_user["user_id"])
        )
        target_email = user_res.scalar_one_or_none() or ""

    target_email = target_email.strip()

    # Validate email format
    if not _is_valid_email(target_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid organization email address."
        )

    # Rate limiting: 60-second cooldown between requests
    recent_token_res = await session.execute(
        select(NGOEmailVerificationToken)
        .where(
            NGOEmailVerificationToken.ngo_id == ngo.ngo_id,
            NGOEmailVerificationToken.created_at >= datetime.utcnow() - timedelta(seconds=60)
        )
        .order_by(NGOEmailVerificationToken.created_at.desc())
    )
    if recent_token_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many verification requests. Please wait a few minutes before trying again."
        )

    # Invalidate all previous unused tokens
    await session.execute(
        update(NGOEmailVerificationToken)
        .where(
            NGOEmailVerificationToken.ngo_id == ngo.ngo_id,
            NGOEmailVerificationToken.used_at.is_(None)
        )
        .values(used_at=datetime.utcnow())
    )

    # Generate secure random token
    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    token_record = NGOEmailVerificationToken(
        ngo_id=ngo.ngo_id,
        token=raw_token,
        expires_at=expires_at,
        created_at=datetime.utcnow(),
        used_at=None
    )
    session.add(token_record)

    # Update ngo.email if changed or unset
    if ngo.email != target_email:
        ngo.email = target_email
        ngo.email_verified = False
        ngo.email_verified_at = None

    await session.commit()
    await session.refresh(ngo)

    # Dispatch email
    try:
        sent = await email_service.send_verification_email(
            email=target_email,
            ngo_name=ngo.organization_name,
            token=raw_token
        )
        if not sent and email_service.enabled:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="We could not send a verification email to this address. Please check that you entered the original working organization email and try again."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dispatching verification email to {target_email}: {e}")
        if email_service.enabled:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="We could not send a verification email to this address. Please check that you entered the original working organization email and try again."
            )

    return {
        "message": "✓ Verification email sent successfully. Please check the organization's inbox and click the verification link.",
        "email": target_email,
        "email_verified": ngo.email_verified,
        "status": "SENT"
    }


async def _handle_verify_token(token: str, session: AsyncSession):
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link. Please request a new verification email."
        )

    res = await session.execute(
        select(NGOEmailVerificationToken).where(
            NGOEmailVerificationToken.token == token.strip()
        )
    )
    token_record = res.scalar_one_or_none()
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link. Please request a new verification email."
        )

    ngo_res = await session.execute(
        select(NGO).where(NGO.ngo_id == token_record.ngo_id)
    )
    ngo = ngo_res.scalar_one_or_none()
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO account not found."
        )

    # Check if already used
    if token_record.used_at is not None:
        if ngo.email_verified:
            return {
                "message": "Email is already verified.",
                "status": "ALREADY_VERIFIED",
                "organization_name": ngo.organization_name,
                "email": ngo.email
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link. Please request a new verification email."
        )

    # Check if expired
    if token_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link has expired. Please request a new verification email."
        )

    # Mark as verified
    token_record.used_at = datetime.utcnow()
    ngo.email_verified = True
    ngo.email_verified_at = datetime.utcnow()

    await session.commit()
    await session.refresh(ngo)

    return {
        "message": "✓ Email Verified Successfully",
        "detail": "Your organization email has been verified.",
        "status": "SUCCESS",
        "organization_name": ngo.organization_name,
        "email": ngo.email
    }


# Endpoints mounted on router (/api/ngos/email/...)
@router.post("/email/send-verification", response_model=EmailVerificationResponse)
async def send_verification(
    data: EmailVerificationRequest | None = None,
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):
    return await _handle_send_or_resend_verification(data, current_user, session)


@router.post("/email/resend-verification", response_model=EmailVerificationResponse)
async def resend_verification(
    data: EmailVerificationRequest | None = None,
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):
    return await _handle_send_or_resend_verification(data, current_user, session)


@router.get("/email/verify")
async def verify_email_token(
    token: str = Query(..., description="Verification token"),
    session: AsyncSession = Depends(get_session)
):
    return await _handle_verify_token(token, session)


# Endpoints mounted on ngo_email_router (/api/ngo/email/...)
@ngo_email_router.post("/send-verification", response_model=EmailVerificationResponse)
async def singular_send_verification(
    data: EmailVerificationRequest | None = None,
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):
    return await _handle_send_or_resend_verification(data, current_user, session)


@ngo_email_router.post("/resend-verification", response_model=EmailVerificationResponse)
async def singular_resend_verification(
    data: EmailVerificationRequest | None = None,
    current_user: dict = Depends(require_role("NGO")),
    session: AsyncSession = Depends(get_session)
):
    return await _handle_send_or_resend_verification(data, current_user, session)


@ngo_email_router.get("/verify")
async def singular_verify_email_token(
    token: str = Query(..., description="Verification token"),
    session: AsyncSession = Depends(get_session)
):
    return await _handle_verify_token(token, session)