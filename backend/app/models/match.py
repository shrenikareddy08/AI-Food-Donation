from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Match(Base):
    __tablename__ = "matches"

    match_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    donation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("donations.donation_id"),
        nullable=False
    )

    ngo_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ngos.ngo_id"),
        nullable=False
    )

    location_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    quantity_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    expiry_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    capacity_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    requirement_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    total_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    matched_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )