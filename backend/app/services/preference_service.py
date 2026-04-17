from __future__ import annotations

from datetime import time as time_type

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Employee, Preference


async def get_or_create_preference(db: AsyncSession, user: Employee) -> Preference:
    pref = (
        await db.execute(select(Preference).where(Preference.employee_wid == user.wid))
    ).scalar_one_or_none()
    if pref is None:
        pref = Preference(employee_wid=user.wid)
        db.add(pref)
        await db.flush()
        await db.refresh(pref)
    return pref


def _parse_notification_times(raw: list[str] | None) -> list[time_type] | None:
    if raw is None:
        return None
    out: list[time_type] = []
    for s in raw:
        parts = s.strip().split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        sec = int(parts[2]) if len(parts) > 2 else 0
        out.append(time_type(hour=h, minute=m, second=sec))
    return out


async def update_preference(
    db: AsyncSession,
    user: Employee,
    *,
    event_types: list[str] | None = None,
    interests: list[str] | None = None,
    notification_frequency: str | None = None,
    notification_mechanisms: list[str] | None = None,
    notification_times: list[str] | None = None,
    notify_on_login: bool | None = None,
    followed_group_ids: list[int] | None = None,
) -> Preference:
    pref = await get_or_create_preference(db, user)
    if event_types is not None:
        pref.event_types = event_types
    if interests is not None:
        pref.interests = interests
    if notification_frequency is not None:
        pref.notification_frequency = notification_frequency
    if notification_mechanisms is not None:
        pref.notification_mechanisms = notification_mechanisms
    if notification_times is not None:
        pref.notification_times = _parse_notification_times(notification_times)
    if notify_on_login is not None:
        pref.notify_on_login = notify_on_login
    if followed_group_ids is not None:
        pref.followed_group_ids = followed_group_ids
    await db.flush()
    await db.refresh(pref)
    return pref
