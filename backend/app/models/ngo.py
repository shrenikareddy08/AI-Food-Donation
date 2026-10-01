from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class NGO(Base):
    __tablename__ = "ngos"

    ngo_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    organization_name: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    capacity: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    capacity_unit: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    food_requirements: Mapped[str | None] = mapped_column(
        Text,
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

    verification_status: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )