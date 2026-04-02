from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    banner_url: Mapped[str | None] = mapped_column(String(500))
    event_type: Mapped[str] = mapped_column(String(50))
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    delivery_method: Mapped[str] = mapped_column(String(20), server_default="Virtual")
    instruction_medium: Mapped[str] = mapped_column(String(10), server_default="en")
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    timezone: Mapped[str] = mapped_column(String(100), server_default="Asia/Calcutta")
    venue_code: Mapped[str | None] = mapped_column(String(100))
    venue_name: Mapped[str | None] = mapped_column(String(200))
    event_url: Mapped[str | None] = mapped_column(String(500))
    slots: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), server_default="Draft")
    visibility: Mapped[str] = mapped_column(String(20), server_default="org-wide")
    group_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("groups.id"))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("employees.wid"))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("employees.wid"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    sessions: Mapped[list[EventSession]] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="EventSession.session_order",
    )


if TYPE_CHECKING:
    from app.models.event_session import EventSession
