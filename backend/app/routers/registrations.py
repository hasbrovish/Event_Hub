from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Employee, Event
from app.schemas.registration import MyRegistrationEntry, MyRegistrationsResponse
from app.services import approval_access, calendar_service, registration_service

router = APIRouter(prefix="/registrations", tags=["registrations"])

OrganizerPlus = Annotated[Employee, Depends(require_roles("organizer", "admin", "platform_admin"))]


@router.get("/me/calendar.ics", response_class=PlainTextResponse)
async def my_calendar_ics(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee, Depends(get_current_user)],
) -> PlainTextResponse:
    events = await calendar_service.list_registered_events_for_user(db, user)
    body = calendar_service.build_multi_event_ics(events)
    return PlainTextResponse(content=body, media_type="text/calendar; charset=utf-8")


@router.get("/me", response_model=MyRegistrationsResponse)
async def my_registrations(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee, Depends(get_current_user)],
    reg_status: str | None = Query(None, alias="status"),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
) -> MyRegistrationsResponse:
    rows = await registration_service.list_my_registrations(
        db, user, status_filter=reg_status, date_from=date_from, date_to=date_to
    )
    items = [
        MyRegistrationEntry(registration_id=rid, registration_status=st, event=item)
        for rid, st, item in rows
    ]
    return MyRegistrationsResponse(items=items)


@router.patch("/{registration_id}/attend", status_code=status.HTTP_204_NO_CONTENT)
async def mark_registration_attended(
    registration_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: OrganizerPlus,
) -> None:
    reg = await registration_service.get_registration_by_id(db, registration_id)
    if reg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
    ev = (await db.execute(select(Event).where(Event.id == reg.event_id))).scalar_one_or_none()
    if ev is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if not await approval_access.can_mark_attendance(db, user, ev):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed for this event")
    try:
        await registration_service.mark_attended(db, registration_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only seated registrations can be marked attended",
        )
