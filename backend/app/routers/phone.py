import logging
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.core.rate_limiter import otp_rate_limiter
from app.schemas.phone import (
    PhoneSendOTPRequest,
    PhoneSendOTPResponse,
    PhoneVerifyOTPRequest,
    PhoneVerifyOTPResponse,
)
from app.services.otp_service import create_otp, verify_otp_detailed
from app.services.sms_service import (
    SMSDeliveryError,
    is_valid_indian_phone,
    normalize_phone,
    sms_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/phone",
    tags=["Phone Verification"],
)


@router.post(
    "/send-otp",
    response_model=PhoneSendOTPResponse,
)
async def send_phone_otp(data: PhoneSendOTPRequest, request: Request):
    """
    Standalone Phone OTP Dispatch Endpoint.
    Validates Indian phone number, generates secure 6-digit OTP, stores HMAC hash
    in MongoDB with a 5-minute expiry, and dispatches via configured SMS provider.
    Never exposes or logs the plaintext OTP.
    """
    phone_raw = data.phone.strip() if data.phone else ""
    if not is_valid_indian_phone(phone_raw):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Invalid phone number. Please enter a valid 10-digit Indian mobile number.",
            },
        )

    norm_phone = normalize_phone(phone_raw)

    # Apply rate limiting per client & phone number
    otp_rate_limiter.check(request, norm_phone)

    # Generates cryptographically secure 6-digit OTP and stores HMAC-SHA256 hash
    # in MongoDB (invalidates prior unverified OTPs for this phone number and purpose)
    otp = await create_otp(
        phone=norm_phone,
        purpose="PHONE_VERIFY",
    )

    # Dispatches through existing SMS service
    try:
        await sms_service.send_otp_sms(
            phone=norm_phone,
            otp=otp,
        )
    except SMSDeliveryError as exc:
        logger.warning(
            "SMS delivery failed for %s: %s",
            norm_phone[:5] + "***" if len(norm_phone) > 5 else "***",
            exc,
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "message": "Unable to send OTP. Please try again later.",
            },
        )
    except Exception as exc:
        logger.error("Unexpected error during SMS dispatch: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "message": "Unable to send OTP. Please try again later.",
            },
        )

    return {
        "success": True,
        "message": "OTP sent successfully",
    }


@router.post(
    "/verify-otp",
    response_model=PhoneVerifyOTPResponse,
)
async def verify_phone_otp(data: PhoneVerifyOTPRequest, request: Request):
    """
    Standalone Phone OTP Verification Endpoint.
    Verifies 6-digit OTP securely against HMAC-SHA256 hash in MongoDB.
    Enforces 5-minute expiry and maximum attempt rate limiting.
    """
    phone_raw = data.phone.strip() if data.phone else ""
    if not is_valid_indian_phone(phone_raw):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "verified": False,
                "message": "Invalid phone number.",
            },
        )

    norm_phone = normalize_phone(phone_raw)
    clean_otp = data.otp.strip() if data.otp else ""

    if len(clean_otp) != 6 or not clean_otp.isdigit():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "verified": False,
                "message": "Invalid OTP",
            },
        )

    is_valid, reason, _ = await verify_otp_detailed(
        phone=norm_phone,
        otp=clean_otp,
        purpose="PHONE_VERIFY",
    )

    if reason == "TOO_MANY_ATTEMPTS":
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "verified": False,
                "message": "Too many attempts. Please request a new OTP.",
            },
        )

    if reason == "EXPIRED":
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "verified": False,
                "message": "OTP expired. Please request a new OTP.",
            },
        )

    if not is_valid:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "verified": False,
                "message": "Invalid OTP",
            },
        )

    return {
        "verified": True,
        "message": "Phone number verified successfully",
    }
