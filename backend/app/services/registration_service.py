from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Employee, Event, Registration
from app.schemas.event import EventListItem
from app.services import event_service


async def _registered_seated_count(db: AsyncSession, event_id: uuid.UUID) -> int:
    n = await db.scalar(
        select(func.count(Registration.id)).where(
            Registration.event_id == event_id,
            Registration.status == "registered",
        )
    )
    return int(n or 0)


async def _get_registration(
    db: AsyncSession, employee_wid: uuid.UUID, event_id: uuid.UUID
) -> Registration | None:
    return (
        await db.execute(
            select(Registration).where(
                Registration.employee_wid == employee_wid,
                Registration.event_id == event_id,
            )
        )
    ).scalar_one_or_none()


async def _promote_oldest_waitlist(db: AsyncSession, event_id: uuid.UUID) -> None:
    stmt = (
        select(Registration)
        .where(Registration.event_id == event_id, Registration.status == "waitlisted")
        .order_by(Registration.registered_at.asc())
        .limit(1)
    )
    w = (await db.execute(stmt)).scalar_one_or_none()
    if w is not None:
        w.status = "registered"


async def register_for_event(db: AsyncSession, event_id: uuid.UUID, user: Employee) -> tuple[str, int]:
    ev = (
        await db.execute(select(Event).options(selectinload(Event.sessions)).where(Event.id == event_id))
    ).scalar_one_or_none()
    if ev is None:
        raise LookupError("event_not_found")
    if ev.status != "Active":
        raise ValueError("event_not_active")

    existing = await _get_registration(db, user.wid, event_id)
    if existing is not None:
        if existing.status in ("registered", "waitlisted"):
            raise ValueError("already_registered")
        if existing.status != "cancelled":
            raise ValueError("invalid_state")

    seated = await _registered_seated_count(db, event_id)

    if ev.slots is None or seated < ev.slots:
        new_status = "registered"
    else:
        new_status = "waitlisted"

    if existing is None:
        reg = Registration(employee_wid=user.wid, event_id=event_id, status=new_status)
        db.add(reg)
    else:
        existing.status = new_status
        reg = existing

    await db.flush()
    await db.refresh(reg)
    return reg.status, reg.id


async def cancel_registration(db: AsyncSession, event_id: uuid.UUID, user: Employee) -> None:
    reg = await _get_registration(db, user.wid, event_id)
    if reg is None:
        raise LookupError("no_registration")
    if reg.status == "cancelled":
        raise ValueError("already_cancelled")
    prev = reg.status
    reg.status = "cancelled"
    await db.flush()
    if prev == "registered":
        await _promote_oldest_waitlist(db, event_id)


async def list_my_registrations(db: AsyncSession, user: Employee) -> list[tuple[int, str, EventListItem]]:
    stmt = (
        select(Registration, Event)
        .join(Event, Registration.event_id == Event.id)
        .options(selectinload(Event.sessions))
        .where(
            Registration.employee_wid == user.wid,
            Registration.status.in_(["registered", "waitlisted"]),
        )
        .order_by(Event.start_date.asc())
    )
    rows = (await db.execute(stmt)).all()
    out: list[tuple[int, str, EventListItem]] = []
    for reg, ev in rows:
        item = await event_service.list_item_for_viewer(db, ev, user)
        out.append((reg.id, reg.status, item))
    return out
