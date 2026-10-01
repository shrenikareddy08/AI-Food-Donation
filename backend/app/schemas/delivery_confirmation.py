from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DeliveryConfirmationCreate(BaseModel):
    assignment_id: int
    verification_method: str | None = None
    remarks: str | None = None


class DeliveryConfirmationResponse(BaseModel):
    confirmation_id: int
    donation_id: int
    ngo_id: int
    volunteer_id: int
    confirmed_at: datetime | None = None
    verification_method: str | None = None
    remarks: str | None = None

    model_config = ConfigDict(from_attributes=True)