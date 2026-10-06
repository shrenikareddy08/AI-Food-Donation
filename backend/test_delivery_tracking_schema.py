from decimal import Decimal

from app.schemas.delivery_tracking import DeliveryTrackingCreate


tracking = DeliveryTrackingCreate(
    assignment_id=1,
    volunteer_id=1,
    latitude=Decimal("17.3850"),
    longitude=Decimal("78.4867"),
    accuracy=Decimal("5.00"),
    speed=Decimal("20.00"),
    heading=Decimal("90.00"),
    status="IN_TRANSIT"
)

print("Delivery tracking schema is working.")
print(tracking)