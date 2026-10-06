from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.postgres import get_session
from app.models.donation import Donation
from app.models.event import Event
from app.models.user import User
from app.schemas.event import (
    EventConvertToDonationRequest,
    EventCreate,
    EventLeftoverDeclare,
    EventResponse,
    EventUpdate,
)
from app.services.audit_service import create_audit_log
from app.services.email_service import email_service

router = APIRouter(
    prefix="/api/events",
    tags=["Event-Based Food Donations"]
)


@router.get("/", response_model=list[EventResponse])
async def list_events(
    status_filter: str | None = None,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    query = (
        select(Event, User.name.label("organizer_name"), User.phone.label("organizer_phone"))
        .join(User, Event.organizer_id == User.user_id)
        .order_by(Event.event_date.desc())
    )

    # Donors can only view their own events, admins and NGOs can view all public/available events
    if current_user["role"] == "DONOR":
        query = query.where(Event.organizer_id == current_user["user_id"])
    elif status_filter:
        query = query.where(Event.status == status_filter.upper())

    result = await session.execute(query)
    rows = result.all()

    events = []
    for event, org_name, org_phone in rows:
        event.organizer_name = org_name
        event.organizer_phone = org_phone
        events.append(event)

    return events


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    event = Event(
        organizer_id=current_user["user_id"],
        event_name=data.event_name,
        event_type=data.event_type.upper(),
        event_date=data.event_date.replace(tzinfo=None) if data.event_date.tzinfo else data.event_date,
        location=data.location,
        latitude=data.latitude,
        longitude=data.longitude,
        expected_attendees=data.expected_attendees,
        food_type=data.food_type.upper(),
        estimated_leftover_meals=data.estimated_leftover_meals,
        status="CREATED"
    )

    session.add(event)
    await session.flush()

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="EVENT_CREATED",
        entity_type="EVENT",
        entity_id=event.event_id,
        details=f"Created event '{event.event_name}' ({event.event_type}) with {event.expected_attendees} expected attendees"
    )

    await session.commit()
    await session.refresh(event)

    user_res = await session.execute(select(User).where(User.user_id == current_user["user_id"]))
    user = user_res.scalar_one_or_none()
    if user:
        event.organizer_name = user.name
        event.organizer_phone = user.phone

    return event


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(Event, User.name.label("organizer_name"), User.phone.label("organizer_phone"))
        .join(User, Event.organizer_id == User.user_id)
        .where(Event.event_id == event_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    event, org_name, org_phone = row
    if current_user["role"] == "DONOR" and event.organizer_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this event")

    event.organizer_name = org_name
    event.organizer_phone = org_phone
    return event


@router.post("/{event_id}/declare-leftovers", response_model=EventResponse)
async def declare_leftovers(
    event_id: int,
    data: EventLeftoverDeclare,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Event).where(Event.event_id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if event.organizer_id != current_user["user_id"] and current_user["role"] != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this event")

    event.estimated_leftover_meals = data.estimated_leftover_meals
    if data.food_type:
        event.food_type = data.food_type.upper()
    event.status = "FOOD_AVAILABLE"

    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="EVENT_LEFTOVERS_DECLARED",
        entity_type="EVENT",
        entity_id=event.event_id,
        details=f"Declared ~{data.estimated_leftover_meals} surplus meals for event '{event.event_name}'"
    )

    await session.commit()
    await session.refresh(event)
    return event


@router.post("/{event_id}/convert-to-donation")
async def convert_event_to_donation(
    event_id: int,
    data: EventConvertToDonationRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Seamlessly converts declared event leftover food into a live MealBridge donation.
    Follows exact event -> donation redistribution workflow.
    """
    result = await session.execute(select(Event).where(Event.event_id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if event.organizer_id != current_user["user_id"] and current_user["role"] != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to convert this event")

    if event.status == "CONVERTED_TO_DONATION":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Event has already been converted to Donation #{event.converted_donation_id}"
        )

    food_name = data.food_name or f"{event.event_name} Surplus ({event.food_type})"
    quantity = data.quantity or Decimal(str(event.estimated_leftover_meals or 25))
    unit = data.unit or "meals"
    now = datetime.now()
    expiry_time = now + timedelta(hours=data.expiry_hours)

    # 1. Create Donation Record
    donation = Donation(
        donor_id=current_user["user_id"],
        food_name=food_name,
        food_type=event.food_type,
        quantity=quantity,
        unit=unit,
        expiry_time=expiry_time,
        pickup_start=now,
        pickup_end=expiry_time,
        location=event.location,
        latitude=event.latitude,
        longitude=event.longitude,
        status="POSTED"
    )
    session.add(donation)
    await session.flush()

    # 2. Update Event Status & Reference
    event.status = "CONVERTED_TO_DONATION"
    event.converted_donation_id = donation.donation_id

    # 3. Create Audit Log
    await create_audit_log(
        session=session,
        user_id=current_user["user_id"],
        action="EVENT_CONVERTED_TO_DONATION",
        entity_type="EVENT",
        entity_id=event.event_id,
        details=f"Converted event #{event.event_id} surplus into live donation #{donation.donation_id} ({quantity} {unit})"
    )

    await session.commit()
    await session.refresh(donation)
    await session.refresh(event)

    # 4. Trigger Email Notification to Organizer
    user_res = await session.execute(select(User).where(User.user_id == current_user["user_id"]))
    user = user_res.scalar_one_or_none()
    if user:
        await email_service.send_donation_created(
            email=user.email,
            donor_name=user.name,
            food_name=donation.food_name,
            quantity=str(donation.quantity),
            unit=donation.unit or "meals"
        )

    return {
        "message": "Event surplus successfully converted into live food donation!",
        "event_id": event.event_id,
        "donation_id": donation.donation_id,
        "food_name": donation.food_name,
        "quantity": float(donation.quantity),
        "unit": donation.unit,
        "expiry_time": str(donation.expiry_time),
        "status": donation.status
    }
