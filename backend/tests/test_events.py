import pytest
from datetime import datetime, timezone, timedelta
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventLeftoverDeclare,
    EventConvertToDonationRequest,
    EventResponse,
)
from app.models.event import Event, EventStatus


def test_event_create_schema_validation():
    payload = {
        "event_name": "Sharma Wedding Reception",
        "event_type": "WEDDING",
        "event_date": datetime.now(timezone.utc) + timedelta(days=2),
        "location": "Banjara Hills, Hyderabad",
        "latitude": 17.4165,
        "longitude": 78.4482,
        "expected_attendees": 350,
        "food_type": "VEGETARIAN",
        "estimated_leftover_meals": 60,
    }
    event = EventCreate(**payload)
    assert event.event_name == "Sharma Wedding Reception"
    assert event.event_type == "WEDDING"
    assert event.expected_attendees == 350
    assert float(event.latitude) == pytest.approx(17.4165, 0.001)
    assert event.estimated_leftover_meals == 60


def test_event_leftover_declare_schema():
    payload = {
        "estimated_leftover_meals": 75,
        "food_type": "Cooked Food & Desserts",
        "notes": "Packed in food grade steel warmers, ready for immediate pickup."
    }
    declaration = EventLeftoverDeclare(**payload)
    assert declaration.estimated_leftover_meals == 75
    assert declaration.food_type == "Cooked Food & Desserts"
    assert "food grade" in declaration.notes


def test_event_convert_to_donation_request_schema():
    req = EventConvertToDonationRequest(
        food_name="Grand Reception Surplus Buffet",
        quantity=50.0,
        unit="kg",
        expiry_hours=6
    )
    assert req.food_name == "Grand Reception Surplus Buffet"
    assert float(req.quantity) == 50.0
    assert req.unit == "kg"
    assert req.expiry_hours == 6


def test_event_status_enumeration():
    assert EventStatus.PLANNING == "PLANNING"
    assert EventStatus.IN_PROGRESS == "IN_PROGRESS"
    assert EventStatus.COMPLETED == "COMPLETED"
    assert EventStatus.LEFTOVER_DECLARED == "LEFTOVER_DECLARED"
    assert EventStatus.CONVERTED_TO_DONATION == "CONVERTED_TO_DONATION"
    assert EventStatus.NO_LEFTOVERS == "NO_LEFTOVERS"


def test_event_model_repr():
    event = Event(
        event_id=101,
        event_name="Corporate Annual Gala",
        event_type="BANQUET",
        location="HICC Novotel, Hyderabad",
        status=EventStatus.LEFTOVER_DECLARED,
        estimated_leftover_meals=120
    )
    assert repr(event) == "<Event 101: Corporate Annual Gala [LEFTOVER_DECLARED]>"
