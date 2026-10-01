import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.db.mongo import otp_collection


OTP_EXPIRY_MINUTES = 5
MAX_ATTEMPTS = 5


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str) -> str:
    return hmac.new(
        settings.OTP_HASH_SECRET.encode(),
        otp.encode(),
        hashlib.sha256
    ).hexdigest()


async def create_otp(email: str, purpose: str = "REGISTER") -> str:
    otp = generate_otp()
    otp_hash = hash_otp(otp)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    await otp_collection.delete_many({
        "email": email,
        "purpose": purpose,
        "verified": False
    })

    await otp_collection.insert_one({
        "email": email,
        "otp_hash": otp_hash,
        "purpose": purpose,
        "expires_at": expires_at,
        "attempts": 0,
        "verified": False,
        "created_at": now
    })

    return otp


async def verify_otp(
    email: str,
    otp: str,
    purpose: str = "REGISTER"
) -> bool:

    record = await otp_collection.find_one({
        "email": email,
        "purpose": purpose,
        "verified": False
    })

    if record is None:
        return False

    now = datetime.now(timezone.utc)

    expires_at = record["expires_at"]

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        return False

    if record["attempts"] >= MAX_ATTEMPTS:
        return False

    await otp_collection.update_one(
        {"_id": record["_id"]},
        {"$inc": {"attempts": 1}}
    )

    expected_hash = record["otp_hash"]
    received_hash = hash_otp(otp)

    if not hmac.compare_digest(
        expected_hash,
        received_hash
    ):
        return False

    await otp_collection.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "verified": True,
                "verified_at": now
            }
        }
    )

    return True