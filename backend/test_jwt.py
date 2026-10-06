from app.core.security import create_access_token, decode_access_token


token = create_access_token(
    user_id=1,
    role="DONOR"
)

print("JWT creation is working.")
print("Token created successfully.")

payload = decode_access_token(token)

print("JWT decoding is working.")
print("User ID:", payload["sub"])
print("Role:", payload["role"])