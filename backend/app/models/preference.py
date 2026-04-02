from __future__ import annotations

import uuid
from datetime import datetime, time as time_py

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Time, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Preference(Base):
    __tablename__ = "preferences"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_wid: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.wid", ondelete="CASCADE"), unique=True, nullable=False
    )
    event_types: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    notification_frequency: Mapped[str] = mapped_column(String(50), server_default="immediate")
    notification_mechanisms: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    notification_times: Mapped[list[time_py] | None] = mapped_column(ARRAY(Time))
    notify_on_login: Mapped[bool] = mapped_column(Boolean, server_default="true")
    followed_group_ids: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
