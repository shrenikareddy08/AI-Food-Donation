from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    action: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    entity_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    entity_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP")
    )