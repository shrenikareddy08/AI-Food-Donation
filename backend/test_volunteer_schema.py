from decimal import Decimal

from app.schemas.volunteer import VolunteerCreate


volunteer = VolunteerCreate(
    user_id=4,
    availability="AVAILABLE",
    vehicle_type="Bike",
    vehicle_number="TS09AB1234",
    current_location="Hyderabad",
    latitude=Decimal("17.3850"),
    longitude=Decimal("78.4867")
)

print("Volunteer schema is working.")
print(volunteer)