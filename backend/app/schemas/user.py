from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    role: str
    location: str | None = None


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: str | None = None
    role: str
    location: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)