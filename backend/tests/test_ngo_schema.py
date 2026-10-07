from decimal import Decimal

from app.schemas.ngo import NGOCreate


ngo = NGOCreate(
    user_id=3,
    organization_name="Helping Hands NGO",
    address="Hyderabad",
    capacity=Decimal("100.00"),
    capacity_unit="KG",
    food_requirements="Cooked food, fruits",
    latitude=Decimal("17.3850"),
    longitude=Decimal("78.4867")
)

print("NGO schema is working.")
print(ngo)