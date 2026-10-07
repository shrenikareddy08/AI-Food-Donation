from pydantic import BaseModel, Field


class PhoneSendOTPRequest(BaseModel):
    phone: str = Field(..., description="Indian mobile number (10 digits)")


class PhoneVerifyOTPRequest(BaseModel):
    phone: str = Field(..., description="Indian mobile number (10 digits)")
    otp: str = Field(..., description="6-digit OTP code")


class PhoneSendOTPResponse(BaseModel):
    success: bool = True
    message: str = "OTP sent successfully"


class PhoneVerifyOTPResponse(BaseModel):
    verified: bool
    message: str
