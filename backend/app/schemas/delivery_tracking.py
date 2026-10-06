from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DeliveryTrackingCreate(BaseModel):
    assignment_id: int
    latitude: Decimal
    longitude: Decimal
    accuracy: Decimal | None = None
    speed: Decimal | None = None
    heading: Decimal | None = None
    status: str


class DeliveryTrackingResponse(BaseModel):
    tracking_id: int
    assignment_id: int
    volunteer_id: int
    latitude: Decimal
    longitude: Decimal
    accuracy: Decimal | None = None
    speed: Decimal | None = None
    heading: Decimal | None = None
    status: str
    recorded_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)