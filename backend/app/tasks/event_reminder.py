from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models import Event, Notification, Registration
from app.services import notification_service

logger = logging.getLogger(__name__)


def _window(now: datetime, hours: float, *, margin_min: int = 10) -> tuple[datetime, datetime]:
    center = now + timedelta(hours=hours)
    return center - timedelta(minutes=margin_min), center + timedelta(minutes=margin_min)


async def reminder_tick(db: AsyncSession) -> int:
    """Notify registered attendees once per (event, user, reminder tier). Returns rows inserted."""
    now = datetime.now(timezone.utc)
    sent = 0
    for hours, rtype, label in (
        (24, "reminder_24h", "24 hours"),
        (1, "reminder_1h", "1 hour"),
    ):
        lo, hi = _window(now, hours)
        evs = (
            await db.execute(
                select(Event).where(
                    Event.status == "Active",
                    Event.start_date >= lo,
                    Event.start_date <= hi,
                )
            )
        ).scalars().all()
        for ev in evs:
            regs = (
                await db.execute(
                    select(Registration).where(
                        Registration.event_id == ev.id,
                        Registration.status == "registered",
                    )
                )
            ).scalars().all()
            for reg in regs:
                n_existing = await db.scalar(
                    select(func.count(Notification.id)).where(
                        Notification.employee_wid == reg.employee_wid,
                        Notification.event_id == ev.id,
                        Notification.type == rtype,
                    )
                )
                if int(n_existing or 0) > 0:
                    continue
                await notification_service.notify_employee(
                    db,
                    employee_wid=reg.employee_wid,
                    title="Event reminder",
                    body=f'"{ev.title}" starts in about {label}.',
                    notif_type=rtype,
                    event_id=ev.id,
                )
                sent += 1
    return sent


async def event_reminder_loop() -> None:
    while True:
        try:
            async with AsyncSessionLocal() as db:
                try:
                    n = await reminder_tick(db)
                    await db.commit()
                    if n:
                        logger.info("Event reminder task sent %s notification(s)", n)
                except Exception:
                    await db.rollback()
                    raise
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Event reminder tick failed")
        await asyncio.sleep(300)
