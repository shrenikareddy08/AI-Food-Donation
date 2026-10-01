from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssignmentCreate(BaseModel):
    donation_id: int
    ngo_id: int
    volunteer_id: int
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
    volunteer_id: int
    pickup_location: str | None = None
    delivery_location: str | None = None
    pickup_time: datetime | None = None
    delivery_time: datetime | None = None
    status: str | None = None
    assigned_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)