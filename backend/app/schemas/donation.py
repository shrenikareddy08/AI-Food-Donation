from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


# =========================================================
# CREATE DONATION
# =========================================================

class DonationCreate(BaseModel):

    food_name: str

    food_type: str | None = None

    quantity: Decimal

    unit: str | None = None

    expiry_time: datetime

    pickup_start: datetime | None = None

    pickup_end: datetime | None = None

    location: str | None = None

    latitude: Decimal | None = None

    longitude: Decimal | None = None

    image_url: str | None = None


# =========================================================
# UPDATE DONATION
# =========================================================

class DonationUpdate(BaseModel):

    food_name: str | None = None

    food_type: str | None = None

    quantity: Decimal | None = None

    unit: str | None = None

    expiry_time: datetime | None = None

    pickup_start: datetime | None = None

    pickup_end: datetime | None = None

    location: str | None = None

    latitude: Decimal | None = None

    longitude: Decimal | None = None

    image_url: str | None = None


# =========================================================
# DONATION RESPONSE
# =========================================================

class DonationResponse(BaseModel):

    donation_id: int

    donor_id: int

    # Donor information
    donor_name: str | None = None

    donor_phone: str | None = None

    food_name: str

    food_type: str | None = None

    quantity: Decimal

    unit: str | None = None

    expiry_time: datetime

    pickup_start: datetime | None = None

    pickup_end: datetime | None = None

    location: str | None = None

    latitude: Decimal | None = None

    longitude: Decimal | None = None

    image_url: str | None = None

    status: str | None = None

    created_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )