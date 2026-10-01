from datetime import datetime
from decimal import Decimal

from app.schemas.donation import DonationCreate


donation = DonationCreate(
    donor_id=1,
    food_name="Cooked Rice",
    food_type="Cooked Food",
    quantity=Decimal("50.00"),
    unit="KG",
    expiry_time=datetime(2026, 9, 26, 18, 0),
    location="Hyderabad",
    latitude=Decimal("17.3850"),
    longitude=Decimal("78.4867")
)

print("Donation schema is working.")
print(donation)