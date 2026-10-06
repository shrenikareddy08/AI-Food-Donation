from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EventStatus:
    CREATED = "CREATED"
    PLANNING = "PLANNING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    LEFTOVER_DECLARED = "LEFTOVER_DECLARED"
    CONVERTED_TO_DONATION = "CONVERTED_TO_DONATION"
    NO_LEFTOVERS = "NO_LEFTOVERS"


class Event(Base):
    __tablename__ = "events"

    event_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    organizer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )

    event_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    event_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    location: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7),
        nullable=True
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7),
        nullable=True
    )

    expected_attendees: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    food_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    estimated_leftover_meals: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="CREATED",
        nullable=False
    )

    converted_donation_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("donations.donation_id", ondelete="SET NULL"),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Event {self.event_id}: {self.event_name} [{self.status}]>"
