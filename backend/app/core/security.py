from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings
try:
    from pwdlib import PasswordHash
    password_hash = PasswordHash.recommended()

    def hash_password(password: str) -> str:
        return password_hash.hash(password)

    def verify_password(password: str, hashed_password: str) -> bool:
        return password_hash.verify(password, hashed_password)
except ImportError:
    from argon2 import PasswordHasher
    _ph = PasswordHasher()

    def hash_password(password: str) -> str:
        return _ph.hash(password)

    def verify_password(password: str, hashed_password: str) -> bool:
        try:
            return _ph.verify(hashed_password, password)
        except Exception:
            return False


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )