from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Employee, Event, Registration


def _ics_escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )


def _utc_dtstamp(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y%m%dT%H%M%SZ")


def build_event_ics(*, event: Event) -> str:
    uid = f"{event.id}@eventhub.local"
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Event Hub//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{_utc_dtstamp(datetime.now(timezone.utc))}",
        f"DTSTART:{_utc_dtstamp(event.start_date)}",
        f"DTEND:{_utc_dtstamp(event.end_date)}",
        f"SUMMARY:{_ics_escape(event.title)}",
    ]
    if event.description:
        lines.append(f"DESCRIPTION:{_ics_escape(event.description)}")
    loc = event.venue_name or event.event_url or ""
    if loc:
        lines.append(f"LOCATION:{_ics_escape(loc)}")
    lines.extend(["END:VEVENT", "END:VCALENDAR"])
    return "\r\n".join(lines) + "\r\n"


def build_multi_event_ics(events: list[Event]) -> str:
    parts = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Event Hub//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]
    now = _utc_dtstamp(datetime.now(timezone.utc))
    for event in events:
        uid = f"{event.id}@eventhub.local"
        parts.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTAMP:{now}",
                f"DTSTART:{_utc_dtstamp(event.start_date)}",
                f"DTEND:{_utc_dtstamp(event.end_date)}",
                f"SUMMARY:{_ics_escape(event.title)}",
            ]
        )
        if event.description:
            parts.append(f"DESCRIPTION:{_ics_escape(event.description)}")
        loc = event.venue_name or event.event_url or ""
        if loc:
            parts.append(f"LOCATION:{_ics_escape(loc)}")
        parts.append("END:VEVENT")
    parts.append("END:VCALENDAR")
    return "\r\n".join(parts) + "\r\n"


async def get_event_for_ics(db: AsyncSession, event_id: uuid.UUID) -> Event | None:
    return (
        await db.execute(select(Event).where(Event.id == event_id, Event.status == "Active"))
    ).scalar_one_or_none()


async def list_registered_events_for_user(db: AsyncSession, user: Employee) -> list[Event]:
    stmt = (
        select(Event)
        .join(Registration, Registration.event_id == Event.id)
        .where(
            Registration.employee_wid == user.wid,
            Registration.status.in_(["registered", "waitlisted"]),
            Event.status == "Active",
        )
        .options(selectinload(Event.sessions))
        .order_by(Event.start_date.asc())
    )
    return list((await db.execute(stmt)).scalars().unique().all())
