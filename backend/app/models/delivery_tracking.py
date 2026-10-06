from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DeliveryTracking(Base):
    __tablename__ = "delivery_tracking"

    tracking_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    assignment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("assignments.assignment_id"),
        nullable=False
    )

    volunteer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("volunteers.volunteer_id"),
        nullable=False
    )

    latitude: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False
    )

    longitude: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False
    )

    accuracy: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    speed: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    heading: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    recorded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )