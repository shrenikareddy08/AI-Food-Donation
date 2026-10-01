from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Assignment(Base):
    __tablename__ = "assignments"

    assignment_id: Mapped[int] = mapped_column(
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

    volunteer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("volunteers.volunteer_id"),
        nullable=False
    )

    pickup_location: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    delivery_location: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    pickup_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    delivery_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )