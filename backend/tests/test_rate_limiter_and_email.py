import pytest
from app.core.rate_limiter import SlidingWindowRateLimiter
from app.services.email_service import email_service


def test_rate_limiter_allows_under_limit():
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=10)
    key = "user_test_1"
    
    # 3 requests allowed within 10 seconds
    allowed1, _ = limiter.is_allowed(key)
    allowed2, _ = limiter.is_allowed(key)
    allowed3, _ = limiter.is_allowed(key)
    assert allowed1 is True
    assert allowed2 is True
    assert allowed3 is True


def test_rate_limiter_blocks_when_exceeded():
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=10)
    key = "user_test_blocked"
    
    limiter.is_allowed(key)
    limiter.is_allowed(key)
    allowed, retry_after = limiter.is_allowed(key)
    assert allowed is False
    assert retry_after > 0


@pytest.mark.asyncio
async def test_email_service_fallback_dispatch():
    # In test environment without SMTP credentials, email_service safely falls back to console logging
    result = await email_service.send_otp_email(
        email="test_recipient@mealbridge.org",
        otp="654321",
        purpose="REGISTRATION"
    )
    assert result is True


@pytest.mark.asyncio
async def test_email_service_donation_created_template():
    result = await email_service.send_donation_created(
        email="donor@example.com",
        donor_name="Hotel Trident",
        food_name="Vegetable Biryani",
        quantity="40",
        unit="KG"
    )
    assert result is True


@pytest.mark.asyncio
async def test_email_service_ngo_match_template():
    result = await email_service.send_ngo_match_found(
        email="ngo@example.com",
        ngo_name="Helping Hands",
        food_name="Cooked Rice",
        quantity="50",
        unit="KG",
        match_score=92.5
    )
    assert result is True
