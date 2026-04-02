from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    org: Mapped[str] = mapped_column(String(100), server_default="Infosys")
    geo: Mapped[str | None] = mapped_column(String(100))
    unit: Mapped[str | None] = mapped_column(String(200))
    subunit: Mapped[str | None] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(100))
    dl_emails: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("employees.wid"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    admins: Mapped[list[GroupAdmin]] = relationship(back_populates="group", cascade="all, delete-orphan")


class GroupAdmin(Base):
    __tablename__ = "group_admins"

    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True)
    employee_wid: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.wid", ondelete="CASCADE"), primary_key=True
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    group: Mapped[Group] = relationship(back_populates="admins")
