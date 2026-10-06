from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# VOLUNTEER CREATE
# =========================================================

class VolunteerCreate(BaseModel):
    user_id: int
    availability: str | None = "AVAILABLE"
    vehicle_type: str | None = None
    vehicle_number: str | None = None
    current_location: str | None = None
    latitude: float | None = None
    longitude: float | None = None


# =========================================================
# VOLUNTEER PROFILE UPDATE
# =========================================================

class VolunteerUpdate(BaseModel):
    availability: str | None = None
    vehicle_type: str | None = None
    vehicle_number: str | None = None
    current_location: str | None = None
    latitude: float | None = None
    longitude: float | None = None


# =========================================================
# VOLUNTEER LOCATION UPDATE
# =========================================================

class VolunteerLocationUpdate(BaseModel):
    current_location: str | None = None
    latitude: float
    longitude: float


# =========================================================
# VOLUNTEER RESPONSE
# =========================================================

class VolunteerResponse(BaseModel):
    volunteer_id: int
    user_id: int
    availability: str | None = None
    vehicle_type: str | None = None
    vehicle_number: str | None = None
    current_location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )