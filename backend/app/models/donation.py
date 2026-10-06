from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Donation(Base):
    __tablename__ = "donations"

    donation_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    donor_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    food_name: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    food_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False
    )

    unit: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    expiry_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    pickup_start: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    pickup_end: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    location: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    image_url: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        server_default=text("'POSTED'")
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP")
    )