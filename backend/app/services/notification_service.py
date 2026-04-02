from __future__ import annotations

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, Notification, Preference


async def notify_employee(
    db: AsyncSession,
    *,
    employee_wid: uuid.UUID,
    title: str,
    body: str,
    notif_type: str,
    event_id: uuid.UUID | None = None,
) -> None:
    db.add(
        Notification(
            employee_wid=employee_wid,
            event_id=event_id,
            type=notif_type,
            title=title,
            body=body,
            is_read=False,
        )
    )
    await db.flush()


async def list_notifications(
    db: AsyncSession,
    user_wid: uuid.UUID,
    *,
    is_read: bool | None,
    notif_type: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Notification], int]:
    stmt = select(Notification).where(Notification.employee_wid == user_wid)
    count_stmt = select(func.count(Notification.id)).where(Notification.employee_wid == user_wid)
    if is_read is not None:
        stmt = stmt.where(Notification.is_read.is_(is_read))
        count_stmt = count_stmt.where(Notification.is_read.is_(is_read))
    if notif_type:
        stmt = stmt.where(Notification.type == notif_type)
        count_stmt = count_stmt.where(Notification.type == notif_type)
    total = int((await db.execute(count_stmt)).scalar_one() or 0)
    stmt = (
        stmt.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = list((await db.execute(stmt)).scalars().all())
    return rows, total


async def unread_count(db: AsyncSession, user_wid: uuid.UUID) -> int:
    n = await db.scalar(
        select(func.count(Notification.id)).where(
            Notification.employee_wid == user_wid,
            Notification.is_read.is_(False),
        )
    )
    return int(n or 0)


async def mark_read(db: AsyncSession, notif_id: int, user_wid: uuid.UUID) -> bool:
    res = await db.execute(
        update(Notification)
        .where(Notification.id == notif_id, Notification.employee_wid == user_wid)
        .values(is_read=True)
    )
    return res.rowcount > 0


async def notify_interested_users_new_active_event(db: AsyncSession, ev: Event) -> None:
    """Users with matching event_types or followed_group_ids get an in-app notification (immediate only)."""
    prefs = (await db.execute(select(Preference))).scalars().all()
    for p in prefs:
        if p.employee_wid == ev.created_by:
            continue
        if (p.notification_frequency or "immediate") != "immediate":
            continue
        match_type = bool(p.event_types and ev.event_type in p.event_types)
        match_group = bool(
            ev.group_id is not None
            and p.followed_group_ids
            and ev.group_id in p.followed_group_ids
        )
        if not (match_type or match_group):
            continue
        await notify_employee(
            db,
            employee_wid=p.employee_wid,
            title="New event you may like",
            body=f'"{ev.title}" is now live.',
            notif_type="new_event",
            event_id=ev.id,
        )


async def mark_all_read(db: AsyncSession, user_wid: uuid.UUID) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.employee_wid == user_wid, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await db.flush()
