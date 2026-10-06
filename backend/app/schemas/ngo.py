from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# NGO CREATE
# =========================================================

class NGOCreate(BaseModel):
    user_id: int
    organization_name: str
    address: str | None = None
    capacity: float | None = None
    capacity_unit: str | None = None
    food_requirements: str | None = None
    latitude: float | None = None
    longitude: float | None = None


# =========================================================
# NGO UPDATE
# =========================================================

class NGOUpdate(BaseModel):
    organization_name: str | None = None
    address: str | None = None
    capacity: float | None = None
    capacity_unit: str | None = None
    food_requirements: str | None = None
    latitude: float | None = None
    longitude: float | None = None


# =========================================================
# NGO RESPONSE
# =========================================================

class NGOResponse(BaseModel):
    ngo_id: int
    user_id: int
    organization_name: str
    address: str | None = None
    capacity: float | None = None
    capacity_unit: str | None = None
    food_requirements: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    verification_status: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )