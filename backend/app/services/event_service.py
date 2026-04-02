from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ApprovalRequest, Employee, Event, EventSession, Registration
from app.schemas.event import EventCreate, EventDetailOut, EventListItem, EventUpdate, SessionOut

EVENT_TYPE_TO_CATEGORY = {
    "Technology": "tech",
    "Domain": "domain",
    "Health": "health",
    "Fun": "fun",
    "Product": "product",
    "Others": "tech",
}


def _category(ev: Event) -> str:
    return EVENT_TYPE_TO_CATEGORY.get(ev.event_type, "tech")


def _ui_status(ev: Event) -> str:
    now = datetime.now(timezone.utc)
    if ev.status == "Active":
        if ev.start_date <= now <= ev.end_date:
            return "live"
        if ev.end_date < now:
            return "completed"
        return "upcoming"
    if ev.status == "Draft":
        return "draft"
    if ev.status == "Pending Approval":
        return "pending"
    if ev.status == "Cancelled":
        return "completed"
    if ev.status == "Rejected":
        return "draft"
    return "upcoming"


def _duration_str(sessions: Sequence[EventSession], ev: Event) -> str:
    if sessions:
        m = sessions[0].duration_minutes
        if m >= 60:
            h = m // 60
            rem = m % 60
            return f"{h}h {rem}m" if rem else f"{h} hour{'s' if h != 1 else ''}"
        return f"{m} mins"
    delta = ev.end_date - ev.start_date
    sec = int(delta.total_seconds())
    if sec >= 3600:
        return f"{sec // 3600} hours"
    return f"{max(1, sec // 60)} mins"


def _time_str(ev: Event) -> str:
    return ev.start_date.strftime("%I:%M %p").lstrip("0")


def _date_str(ev: Event) -> str:
    return ev.start_date.strftime("%Y-%m-%d")


def _speaker_dict(sessions: Sequence[EventSession]) -> dict:
    if not sessions:
        return {"name": "TBD", "title": "", "avatar": ""}
    s = sorted(sessions, key=lambda x: x.session_order)[0]
    return {
        "name": s.speaker_name or "TBD",
        "title": s.speaker_title or "",
        "avatar": s.speaker_headshot_url or "",
    }


def _location(ev: Event) -> str:
    return ev.venue_name or ev.event_url or "TBD"


def _max_attendees(ev: Event) -> int:
    return ev.slots if ev.slots is not None else 99999


async def _registration_counts(db: AsyncSession, event_ids: list[uuid.UUID]) -> dict[uuid.UUID, int]:
    if not event_ids:
        return {}
    stmt = (
        select(Registration.event_id, func.count(Registration.id))
        .where(
            Registration.event_id.in_(event_ids),
            Registration.status.in_(["registered", "waitlisted"]),
        )
        .group_by(Registration.event_id)
    )
    rows = (await db.execute(stmt)).all()
    return {row[0]: int(row[1]) for row in rows}


async def _my_registration_row_status(
    db: AsyncSession, event_id: uuid.UUID, employee_wid: uuid.UUID | None
) -> str | None:
    if employee_wid is None:
        return None
    stmt = select(Registration.status).where(
        Registration.event_id == event_id,
        Registration.employee_wid == employee_wid,
        Registration.status.in_(["registered", "waitlisted"]),
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def _my_registrations(db: AsyncSession, employee_wid: uuid.UUID | None) -> set[uuid.UUID]:
    if employee_wid is None:
        return set()
    stmt = select(Registration.event_id).where(
        Registration.employee_wid == employee_wid,
        Registration.status.in_(["registered", "waitlisted"]),
    )
    rows = (await db.execute(stmt)).scalars().all()
    return set(rows)


def _to_list_item(
    ev: Event,
    attendees: int,
    my_regs: set[uuid.UUID],
) -> EventListItem:
    sessions = list(ev.sessions or [])
    return EventListItem(
        id=str(ev.id),
        title=ev.title,
        description=ev.description or "",
        date=_date_str(ev),
        time=_time_str(ev),
        duration=_duration_str(sessions, ev),
        category=_category(ev),
        location=_location(ev),
        speaker=_speaker_dict(sessions),
        attendees=attendees,
        max_attendees=_max_attendees(ev),
        status=_ui_status(ev),
        tags=list(ev.tags or []),
        is_registered=ev.id in my_regs,
    )


async def list_events(
    db: AsyncSession,
    *,
    category: str | None,
    ui_status: str | None,
    page: int,
    page_size: int,
    current_user: Employee | None,
) -> tuple[list[EventListItem], int]:
    stmt = select(Event).options(selectinload(Event.sessions)).order_by(Event.start_date.desc())
    if category and category != "all":
        slug_to_db_type = {
            "tech": "Technology",
            "domain": "Domain",
            "health": "Health",
            "fun": "Fun",
            "product": "Product",
        }
        if category in slug_to_db_type:
            stmt = stmt.where(Event.event_type == slug_to_db_type[category])
    result = await db.execute(stmt)
    all_events = result.scalars().unique().all()
    filtered: list[Event] = []
    for ev in all_events:
        uis = _ui_status(ev)
        if ui_status and ui_status != "all" and uis != ui_status:
            continue
        filtered.append(ev)
    total = len(filtered)
    start = max(0, (page - 1) * page_size)
    page_rows = filtered[start : start + page_size]
    ids = [e.id for e in page_rows]
    counts = await _registration_counts(db, ids)
    my_regs = await _my_registrations(db, current_user.wid if current_user else None)
    items = [_to_list_item(ev, counts.get(ev.id, 0), my_regs) for ev in page_rows]
    return items, total


async def get_event_detail(
    db: AsyncSession,
    event_id: uuid.UUID,
    current_user: Employee | None,
) -> EventDetailOut | None:
    stmt = (
        select(Event)
        .options(selectinload(Event.sessions))
        .where(Event.id == event_id)
    )
    ev = (await db.execute(stmt)).scalar_one_or_none()
    if ev is None:
        return None
    counts = await _registration_counts(db, [ev.id])
    my_regs = await _my_registrations(db, current_user.wid if current_user else None)
    base = _to_list_item(ev, counts.get(ev.id, 0), my_regs)
    sessions = sorted(ev.sessions or [], key=lambda s: s.session_order)

    sess_out = [
        SessionOut(
            id=s.id,
            session_order=s.session_order,
            topic=s.topic,
            topic_brief=s.topic_brief,
            start_datetime=s.start_datetime,
            duration_minutes=s.duration_minutes,
            speaker_name=s.speaker_name,
            speaker_title=s.speaker_title,
            speaker_headshot_url=s.speaker_headshot_url,
        )
        for s in sessions
    ]
    my_reg_status = await _my_registration_row_status(db, ev.id, current_user.wid if current_user else None)
    return EventDetailOut(
        **base.model_dump(),
        delivery_method=ev.delivery_method,
        visibility=ev.visibility,
        group_id=ev.group_id,
        created_by=str(ev.created_by),
        db_status=ev.status,
        sessions=sess_out,
        my_registration_status=my_reg_status,
    )


async def create_event(db: AsyncSession, data: EventCreate, creator: Employee) -> Event:
    ev = Event(
        title=data.title,
        description=data.description,
        event_type=data.event_type,
        tags=data.tags,
        delivery_method=data.delivery_method,
        start_date=data.start_date,
        end_date=data.end_date,
        venue_name=data.venue_name,
        event_url=data.event_url,
        slots=data.slots,
        visibility=data.visibility,
        group_id=data.group_id,
        created_by=creator.wid,
        status="Draft",
    )
    db.add(ev)
    await db.flush()
    for i, s in enumerate(data.sessions, start=1):
        db.add(
            EventSession(
                event_id=ev.id,
                session_order=i,
                topic=s.topic,
                topic_brief=s.topic_brief,
                start_datetime=s.start_datetime,
                duration_minutes=s.duration_minutes,
                speaker_wid=creator.wid,
                speaker_name=s.speaker_name or creator.first_name + " " + creator.last_name,
                speaker_title=s.speaker_title,
            )
        )
    await db.refresh(ev, ["sessions"])
    return ev


async def update_event(db: AsyncSession, event_id: uuid.UUID, data: EventUpdate, actor: Employee) -> Event | None:
    ev = (
        await db.execute(
            select(Event).options(selectinload(Event.sessions)).where(Event.id == event_id),
        )
    ).scalar_one_or_none()
    if ev is None:
        return None
    if ev.created_by != actor.wid and not _is_privileged(actor):
        raise PermissionError("not_owner")
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(ev, k, v)
    await db.flush()
    await db.refresh(ev, ["sessions"])
    return ev


def _is_privileged(emp: Employee) -> bool:
    return bool({r.role for r in emp.roles} & {"admin", "platform_admin", "organizer"})


async def delete_event(db: AsyncSession, event_id: uuid.UUID, actor: Employee) -> bool:
    ev = (await db.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if ev is None:
        return False
    if ev.status != "Draft":
        raise ValueError("not_draft")
    if ev.created_by != actor.wid and not _is_privileged(actor):
        raise PermissionError("not_owner")
    await db.execute(delete(Event).where(Event.id == event_id))
    return True


async def submit_for_approval(db: AsyncSession, event_id: uuid.UUID, actor: Employee, note: str | None) -> Event | None:
    ev = (await db.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if ev is None:
        return None
    if ev.created_by != actor.wid:
        raise PermissionError("not_owner")
    if ev.status != "Draft":
        raise ValueError("invalid_status")
    ev.status = "Pending Approval"
    db.add(
        ApprovalRequest(
            event_id=ev.id,
            requested_by=actor.wid,
            status="Pending",
            request_note=note,
        )
    )
    await db.flush()
    return ev


async def list_item_for_viewer(db: AsyncSession, ev: Event, viewer: Employee | None) -> EventListItem:
    counts = await _registration_counts(db, [ev.id])
    my_regs = await _my_registrations(db, viewer.wid if viewer else None)
    return _to_list_item(ev, counts.get(ev.id, 0), my_regs)
