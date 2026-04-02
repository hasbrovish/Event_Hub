import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_current_user_optional, require_roles
from app.models import Employee
from app.schemas.event import (
    EventCreate,
    EventDetailOut,
    EventListResponse,
    EventUpdate,
    SubmitForApprovalBody,
)
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])

SpeakerPlus = Annotated[Employee, Depends(require_roles("speaker", "organizer", "admin", "platform_admin"))]


@router.get("", response_model=EventListResponse)
async def list_events(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee | None, Depends(get_current_user_optional)],
    category: str | None = Query(None, description="all | tech | domain | health | fun | product"),
    event_status: str | None = Query(None, alias="status", description="UI status filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> EventListResponse:
    items, total = await event_service.list_events(
        db,
        category=category,
        ui_status=event_status,
        page=page,
        page_size=page_size,
        current_user=user,
    )
    return EventListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{event_id}", response_model=EventDetailOut)
async def get_event(
    event_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee | None, Depends(get_current_user_optional)],
) -> EventDetailOut:
    detail = await event_service.get_event_detail(db, event_id, user)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return detail


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EventDetailOut)
async def create_event(
    data: EventCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: SpeakerPlus,
) -> EventDetailOut:
    if not data.sessions:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least one session required")
    ev = await event_service.create_event(db, data, user)
    out = await event_service.get_event_detail(db, ev.id, user)
    assert out is not None
    return out


@router.patch("/{event_id}", response_model=EventDetailOut)
async def patch_event(
    event_id: uuid.UUID,
    data: EventUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee, Depends(get_current_user)],
) -> EventDetailOut:
    try:
        ev = await event_service.update_event(db, event_id, data, user)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if ev is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    out = await event_service.get_event_detail(db, event_id, user)
    assert out is not None
    return out


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_event(
    event_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee, Depends(get_current_user)],
) -> None:
    try:
        ok = await event_service.delete_event(db, event_id, user)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft events can be deleted")
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")


@router.post("/{event_id}/submit", response_model=EventDetailOut)
async def submit_event(
    event_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee, Depends(get_current_user)],
    body: SubmitForApprovalBody | None = None,
) -> EventDetailOut:
    try:
        ev = await event_service.submit_for_approval(
            db, event_id, user, body.note if body else None
        )
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event status")
    if ev is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    out = await event_service.get_event_detail(db, event_id, user)
    assert out is not None
    return out
