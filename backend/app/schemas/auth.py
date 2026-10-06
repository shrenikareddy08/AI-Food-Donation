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
    purpose: str = "REGISTER"


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: str = "REGISTER"