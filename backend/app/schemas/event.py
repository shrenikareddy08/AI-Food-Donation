from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    event_name: str = Field(..., max_length=150)
    event_type: str = Field(..., max_length=50)  # WEDDING, BIRTHDAY, CORPORATE, COMMUNITY, FESTIVAL, etc.
    event_date: datetime
    location: str = Field(..., max_length=255)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    expected_attendees: int = Field(0, ge=0)
    food_type: str = Field(..., max_length=50)  # VEGETARIAN, NON_VEGETARIAN, VEGAN, MIXED
    estimated_leftover_meals: int = Field(0, ge=0)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    event_name: str | None = None
    event_type: str | None = None
    event_date: datetime | None = None
    location: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    expected_attendees: int | None = None
    food_type: str | None = None
    estimated_leftover_meals: int | None = None
    status: str | None = None


class EventLeftoverDeclare(BaseModel):
    estimated_leftover_meals: int = Field(..., gt=0)
    food_type: str | None = None
    notes: str | None = None


class EventConvertToDonationRequest(BaseModel):
    food_name: str | None = None  # defaults to "<event_name> Leftover Surplus"
    quantity: Decimal | None = None  # defaults to estimated_leftover_meals in kg
    unit: str = "meals"
    expiry_hours: int = Field(6, ge=1, le=48)  # default 6 hours after conversion


class EventResponse(EventBase):
    event_id: int
    organizer_id: int
    status: str
    converted_donation_id: int | None = None
    created_at: datetime
    organizer_name: str | None = None
    organizer_phone: str | None = None

    model_config = ConfigDict(from_attributes=True)
