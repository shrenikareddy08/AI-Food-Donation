from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RAGLog(Base):
    __tablename__ = "rag_retrieval_logs"

    log_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )

    query: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    retrieved_chunks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    response: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    similarity_top_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )
