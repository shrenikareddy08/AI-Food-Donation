from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

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
from app.services.otp_service import create_otp, verify_otp


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


ALLOWED_REGISTRATION_ROLES = {
    "DONOR",
    "NGO",
    "VOLUNTEER",
}


@router.post("/request-otp")
async def request_otp(data: OTPRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == data.email)
        )

        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

    otp = await create_otp(
        email=data.email,
        purpose=data.purpose,
    )

    return {
        "message": "OTP generated successfully",
        "email": data.email,
        "purpose": data.purpose,
        "development_otp": otp,
    }


@router.post("/verify-otp")
async def verify_otp_endpoint(data: OTPVerifyRequest):
    verified = await verify_otp(
        email=data.email,
        otp=data.otp,
        purpose=data.purpose,
    )

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    return {
        "message": "OTP verified successfully",
        "email": data.email,
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

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == data.email)
        )

        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        otp_record = await otp_collection.find_one(
            {
                "email": data.email,
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
            name=data.name,
            email=data.email,
            password=hash_password(data.password),
            phone=data.phone,
            role=role,
            location=data.location,
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
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(
                User.email == form_data.username
            )
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