import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.db.mongo import otp_collection
from app.services.sms_service import normalize_phone


OTP_EXPIRY_MINUTES = 5
MAX_ATTEMPTS = 5


def generate_otp() -> str:
    """Generates a cryptographically secure 6-digit random numeric OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str) -> str:
    """Hashes the OTP using HMAC-SHA256 with the configured secret key."""
    return hmac.new(
        settings.OTP_HASH_SECRET.encode(),
        otp.encode(),
        hashlib.sha256
    ).hexdigest()


async def create_otp(
    email: str | None = None,
    phone: str | None = None,
    purpose: str = "REGISTER"
) -> str:
    """
    Creates a new secure OTP for the specified phone number and/or email.
    Invalidates any previous unverified OTP for the user (single active OTP).
    Stores only the HMAC-SHA256 hash in MongoDB with a 5-minute expiry.
    """
    otp = generate_otp()
    otp_hash = hash_otp(otp)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    norm_phone = normalize_phone(phone) if phone else None
    identifier = norm_phone or email

    delete_conditions = []
    if norm_phone:
        delete_conditions.append({"phone": norm_phone})
        ten_digit = norm_phone[-10:] if len(norm_phone) >= 10 else norm_phone
        delete_conditions.append({"phone": ten_digit})
    if email:
        delete_conditions.append({"email": email})
    if identifier:
        delete_conditions.append({"identifier": identifier})

    if delete_conditions:
        await otp_collection.delete_many({
            "$or": delete_conditions,
            "purpose": purpose,
            "verified": False,
        })

    doc = {
        "identifier": identifier,
        "phone": norm_phone,
        "email": email,
        "otp_hash": otp_hash,
        "purpose": purpose,
        "expires_at": expires_at,
        "attempts": 0,
        "verified": False,
        "created_at": now,
    }
    await otp_collection.insert_one(doc)

    return otp


async def verify_otp_detailed(
    phone: str | None = None,
    email: str | None = None,
    otp: str = "",
    purpose: str = "REGISTER",
) -> tuple[bool, str, int]:
    """
    Verifies the provided OTP against the securely stored hash.
    Enforces maximum attempts (5), 5-minute expiration, and timing-safe comparison.
    Returns: (is_valid, reason, http_status_code)
    Reasons:
      - "OK" (200)
      - "NOT_FOUND" (400)
      - "EXPIRED" (400)
      - "TOO_MANY_ATTEMPTS" (429)
      - "INVALID" (400)
    """
    norm_phone = normalize_phone(phone) if phone else None
    identifier = norm_phone or email

    query_conditions = []
    if norm_phone:
        query_conditions.append({"phone": norm_phone})
        ten_digit = norm_phone[-10:] if len(norm_phone) >= 10 else norm_phone
        query_conditions.append({"phone": ten_digit})
    if email:
        query_conditions.append({"email": email})
    if identifier:
        query_conditions.append({"identifier": identifier})

    if not query_conditions:
        return False, "NOT_FOUND", 400

    record = await otp_collection.find_one({
        "$or": query_conditions,
        "purpose": purpose,
        "verified": False,
    })

    if record is None:
        return False, "NOT_FOUND", 400

    now = datetime.now(timezone.utc)
    expires_at = record["expires_at"]

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if record.get("attempts", 0) >= MAX_ATTEMPTS:
        return False, "TOO_MANY_ATTEMPTS", 429

    if now > expires_at:
        return False, "EXPIRED", 400

    await otp_collection.update_one(
        {"_id": record["_id"]},
        {"$inc": {"attempts": 1}}
    )

    expected_hash = record["otp_hash"]
    received_hash = hash_otp(otp)

    if not hmac.compare_digest(expected_hash, received_hash):
        return False, "INVALID", 400

    await otp_collection.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "verified": True,
                "verified_at": now,
            }
        }
    )

    return True, "OK", 200


async def verify_otp(
    email: str | None = None,
    phone: str | None = None,
    otp: str = "",
    purpose: str = "REGISTER"
) -> bool:
    """
    Verifies the provided OTP against the securely stored hash.
    Enforces maximum attempts (5), 5-minute expiration, and timing-safe comparison.
    Maintained for full backward compatibility with existing auth routers.
    """
    is_valid, _, _ = await verify_otp_detailed(
        phone=phone,
        email=email,
        otp=otp,
        purpose=purpose,
    )
    return is_valid