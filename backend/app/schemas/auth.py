from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    role: str
    location: str | None = None


class OTPRequest(BaseModel):
    email: EmailStr
    phone: str | None = None
    channel: str | None = None
    purpose: str = "REGISTER"


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str
    phone: str | None = None
    channel: str | None = None
    purpose: str = "REGISTER"