from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    volunteer_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    availability: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    vehicle_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    vehicle_number: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    current_location: Mapped[str | None] = mapped_column(
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

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )