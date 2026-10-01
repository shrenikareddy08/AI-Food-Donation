from app.schemas.user import UserCreate


user = UserCreate(
    name="Test User",
    email="test@example.com",
    password="test123",
    role="DONOR",
    location="Hyderabad"
)

print("User schema is working.")
print(user)