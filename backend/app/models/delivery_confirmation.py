from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DeliveryConfirmation(Base):
    __tablename__ = "delivery_confirmations"

    confirmation_id: Mapped[int] = mapped_column(
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

    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP")
    )

    verification_method: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )