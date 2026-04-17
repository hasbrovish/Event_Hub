from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    wid: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    source_id: Mapped[str | None] = mapped_column(String(20), unique=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(200), unique=True)
    job_title: Mapped[str | None] = mapped_column(String(200))
    job_role: Mapped[str | None] = mapped_column(String(100))
    department_name: Mapped[str | None] = mapped_column(String(200))
    unit_name: Mapped[str | None] = mapped_column(String(200))
    sub_department_name: Mapped[str | None] = mapped_column(String(200))
    region: Mapped[str | None] = mapped_column(String(100))
    current_location: Mapped[str | None] = mapped_column(String(100))
    base_location: Mapped[str | None] = mapped_column(String(100))
    is_manager: Mapped[bool] = mapped_column(Boolean, default=False)
    manager_wid: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.wid", ondelete="SET NULL")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    roles: Mapped[list[EmployeeRole]] = relationship(back_populates="employee", cascade="all, delete-orphan")


class EmployeeRole(Base):
    __tablename__ = "employee_roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_wid: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("employees.wid", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    employee: Mapped[Employee] = relationship(back_populates="roles")

    __table_args__ = (UniqueConstraint("employee_wid", "role", name="uq_employee_roles_employee_wid_role"),)
