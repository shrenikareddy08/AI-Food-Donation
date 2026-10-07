from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, ForeignKey
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

    email: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
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


class NGOEmailVerificationToken(Base):
    __tablename__ = "ngo_email_verification_tokens"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    ngo_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ngos.ngo_id", ondelete="CASCADE"),
        nullable=False
    )

    token: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    used_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )