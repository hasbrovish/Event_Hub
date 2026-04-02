from __future__ import annotations

import uuid
from datetime import datetime

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


async def get_registration_by_id(db: AsyncSession, registration_id: int) -> Registration | None:
    return (
        await db.execute(select(Registration).where(Registration.id == registration_id))
    ).scalar_one_or_none()


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


async def _promote_oldest_waitlist(db: AsyncSession, event_id: uuid.UUID) -> Registration | None:
    stmt = (
        select(Registration)
        .where(Registration.event_id == event_id, Registration.status == "waitlisted")
        .order_by(Registration.registered_at.asc())
        .limit(1)
    )
    w = (await db.execute(stmt)).scalar_one_or_none()
    if w is not None:
        w.status = "registered"
        await db.flush()
        await db.refresh(w)
        return w
    return None


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

    from app.services import notification_service

    await notification_service.notify_employee(
        db,
        employee_wid=user.wid,
        title="Registration update",
        body=f'You are {new_status} for "{ev.title}".',
        notif_type="registration",
        event_id=event_id,
    )

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
        promoted = await _promote_oldest_waitlist(db, event_id)
        if promoted is not None:
            ev = (
                await db.execute(select(Event).where(Event.id == event_id))
            ).scalar_one_or_none()
            if ev is not None:
                from app.services import notification_service

                await notification_service.notify_employee(
                    db,
                    employee_wid=promoted.employee_wid,
                    title="Moved off waitlist",
                    body=f'A seat opened — you are now registered for "{ev.title}".',
                    notif_type="registration",
                    event_id=event_id,
                )


async def list_my_registrations(
    db: AsyncSession,
    user: Employee,
    *,
    status_filter: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[tuple[int, str, EventListItem]]:
    allowed = ["registered", "waitlisted", "cancelled", "attended"]
    statuses = (
        [status_filter]
        if status_filter and status_filter in allowed
        else ["registered", "waitlisted"]
    )
    stmt = (
        select(Registration, Event)
        .join(Event, Registration.event_id == Event.id)
        .options(selectinload(Event.sessions))
        .where(
            Registration.employee_wid == user.wid,
            Registration.status.in_(statuses),
        )
        .order_by(Event.start_date.asc())
    )
    rows = (await db.execute(stmt)).all()
    out: list[tuple[int, str, EventListItem]] = []
    for reg, ev in rows:
        if date_from is not None and ev.end_date < date_from:
            continue
        if date_to is not None and ev.start_date > date_to:
            continue
        item = await event_service.list_item_for_viewer(db, ev, user)
        out.append((reg.id, reg.status, item))
    return out


async def list_event_registrations(
    db: AsyncSession,
    event_id: uuid.UUID,
    *,
    status_filter: str | None,
    page: int,
    page_size: int,
) -> tuple[list[tuple[Registration, Employee]], int]:
    count_stmt = select(func.count(Registration.id)).where(Registration.event_id == event_id)
    if status_filter:
        count_stmt = count_stmt.where(Registration.status == status_filter)
    total = int((await db.execute(count_stmt)).scalar_one() or 0)
    stmt = (
        select(Registration, Employee)
        .join(Employee, Registration.employee_wid == Employee.wid)
        .where(Registration.event_id == event_id)
    )
    if status_filter:
        stmt = stmt.where(Registration.status == status_filter)
    stmt = stmt.order_by(Registration.registered_at.asc()).offset((page - 1) * page_size).limit(page_size)
    rows = list((await db.execute(stmt)).all())
    return rows, total


async def mark_attended(db: AsyncSession, registration_id: int) -> Registration | None:
    reg = (await db.execute(select(Registration).where(Registration.id == registration_id))).scalar_one_or_none()
    if reg is None:
        return None
    if reg.status != "registered":
        raise ValueError("not_registered_seated")
    reg.status = "attended"
    await db.flush()
    await db.refresh(reg)
    return reg
