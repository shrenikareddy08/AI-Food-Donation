from datetime import datetime

from app.schemas.assignment import AssignmentCreate


assignment = AssignmentCreate(
    donation_id=1,
    ngo_id=1,
    volunteer_id=1,
    pickup_location="Restaurant, Hyderabad",
    delivery_location="Helping Hands NGO, Hyderabad",
    pickup_time=datetime(2026, 9, 26, 10, 0),
    delivery_time=datetime(2026, 9, 26, 11, 0)
)

print("Assignment schema is working.")
print(assignment)