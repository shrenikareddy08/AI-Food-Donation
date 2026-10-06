from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssignmentCreate(BaseModel):
    donation_id: int
    ngo_id: int
    volunteer_id: int | None = None
    pickup_location: str | None = None
    delivery_location: str | None = None
    pickup_time: datetime | None = None
    delivery_time: datetime | None = None


class AssignmentStatusUpdate(BaseModel):
    status: str


class AssignmentResponse(BaseModel):
    assignment_id: int
    donation_id: int
    ngo_id: int
    volunteer_id: int | None = None
    pickup_location: str | None = None
    delivery_location: str | None = None
    pickup_time: datetime | None = None
    delivery_time: datetime | None = None
    status: str | None = None
    assigned_at: datetime | None = None

    # Enriched context fields for seamless UI display
    food_name: str | None = None
    food_type: str | None = None
    quantity: float | None = None
    unit: str | None = None
    donor_name: str | None = None
    donor_phone: str | None = None
    ngo_name: str | None = None
    ngo_phone: str | None = None
    volunteer_name: str | None = None
    volunteer_phone: str | None = None

    model_config = ConfigDict(from_attributes=True)