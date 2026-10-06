from decimal import Decimal

from app.schemas.match import MatchCreate


match = MatchCreate(
    donation_id=1,
    ngo_id=1,
    location_score=Decimal("95.00"),
    quantity_score=Decimal("90.00"),
    expiry_score=Decimal("92.00"),
    capacity_score=Decimal("94.00"),
    requirement_score=Decimal("94.00"),
    total_score=Decimal("93.00")
)

print("Match schema is working.")
print(match)