import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select

logger = logging.getLogger(__name__)

from app.core.rate_limiter import login_rate_limiter, otp_rate_limiter
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.mongo import otp_collection
from app.db.postgres import AsyncSessionLocal
from app.models.user import User
from app.schemas.auth import (
    OTPRequest,
    OTPVerifyRequest,
    RegisterRequest,
)
from app.schemas.user import UserResponse
from app.services.email_service import email_service
from app.services.otp_service import create_otp, verify_otp
from app.services.sms_service import (
    SMSDeliveryError,
    is_valid_phone,
    normalize_phone,
    sms_service,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


ALLOWED_REGISTRATION_ROLES = {
    "DONOR",
    "NGO",
    "VOLUNTEER",
}


@router.post("/send-otp")
@router.post("/request-otp")
async def request_otp(data: OTPRequest, request: Request):
    user_email = data.email.strip().lower()
    otp_rate_limiter.check(request, user_email)

    async with AsyncSessionLocal() as session:
        res_email = await session.execute(
            select(User).where(User.email == user_email)
        )
        if res_email.scalars().first() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        if data.phone:
            norm_phone = normalize_phone(data.phone)
            if norm_phone:
                ten_digit = norm_phone[-10:] if len(norm_phone) >= 10 else norm_phone
                res_phone = await session.execute(
                    select(User).where(
                        (User.phone == norm_phone) | (User.phone == ten_digit)
                    )
                )
                if res_phone.scalars().first() is not None:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Phone number is already registered",
                    )

    # Generate EXACTLY ONE OTP for this registration request
    otp = await create_otp(
        email=user_email,
        purpose=data.purpose,
    )

    # Send OTP strictly to user's email
    email_sent = await email_service.send_otp_email(
        email=user_email,
        otp=otp,
        purpose=data.purpose,
    )
    if not email_sent and email_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to deliver OTP via email. Please check your email configuration.",
        )

    return {
        "message": "OTP generated and sent successfully to your email",
        "email": user_email,
        "channel": "email",
        "purpose": data.purpose,
    }


@router.post("/verify-otp")
async def verify_otp_endpoint(data: OTPVerifyRequest, request: Request):
    user_email = data.email.strip().lower()
    otp_rate_limiter.check(request, user_email)

    verified = await verify_otp(
        email=user_email,
        otp=data.otp.strip(),
        purpose=data.purpose,
    )

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    return {
        "message": "OTP verified successfully",
        "email": user_email,
    }


@router.post(
    "/register",
    response_model=UserResponse,
)
async def register(data: RegisterRequest):
    role = data.role.upper()

    if role not in ALLOWED_REGISTRATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid registration role",
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 8 characters",
        )

    user_email = data.email.strip().lower()
    norm_phone = normalize_phone(data.phone) if data.phone else None

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == user_email)
        )

        existing_user = result.scalars().first()

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        if norm_phone:
            ten_digit = norm_phone[-10:] if len(norm_phone) >= 10 else norm_phone
            res_phone = await session.execute(
                select(User).where(
                    (User.phone == norm_phone) | (User.phone == ten_digit)
                )
            )
            if res_phone.scalars().first() is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Phone number is already registered",
                )

        otp_record = await otp_collection.find_one(
            {
                "$or": [
                    {"email": user_email},
                    {"identifier": user_email},
                ],
                "purpose": "REGISTER",
                "verified": True,
            },
            sort=[("created_at", -1)],
        )

        if otp_record is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please verify OTP before registration",
            )

        new_user = User(
            name=data.name.strip(),
            email=user_email,
            password=hash_password(data.password),
            phone=norm_phone or (data.phone.strip() if data.phone else None),
            role=role,
            location=data.location.strip() if data.location else None,
        )

        session.add(new_user)

        await session.commit()
        await session.refresh(new_user)

    await otp_collection.delete_one(
        {"_id": otp_record["_id"]}
    )

    return new_user


@router.post("/login")
async def login(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends(),
    ],
    request: Request,
):
    login_rate_limiter.check(request, form_data.username)

    norm_username = normalize_phone(form_data.username) if form_data.username else None

    async with AsyncSessionLocal() as session:
        conditions = [User.email == form_data.username]
        if norm_username:
            ten_digit = norm_username[-10:] if len(norm_username) >= 10 else norm_username
            conditions.append(User.phone == norm_username)
            conditions.append(User.phone == ten_digit)
            conditions.append(User.email == f"{norm_username}@phone.mealbridge.org")

        result = await session.execute(
            select(User).where(or_(*conditions))
        )

        user = result.scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not verify_password(
            form_data.password,
            user.password,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        access_token = create_access_token(
            user_id=user.user_id,
            role=user.role,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }