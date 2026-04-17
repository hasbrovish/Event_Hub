from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Employee
from app.schemas.notification import NotificationListResponse, NotificationOut, UnreadCountResponse
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])

Authenticated = Annotated[Employee, Depends(get_current_user)]


def _to_out(n) -> NotificationOut:
    return NotificationOut(
        id=n.id,
        type=n.type,
        title=n.title,
        body=n.body,
        is_read=n.is_read,
        event_id=str(n.event_id) if n.event_id else None,
        created_at=n.created_at,
    )


@router.get("", response_model=NotificationListResponse)
async def list_notifications_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Authenticated,
    is_read: bool | None = Query(None),
    notif_type: str | None = Query(None, alias="type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
) -> NotificationListResponse:
    rows, total = await notification_service.list_notifications(
        db,
        user.wid,
        is_read=is_read,
        notif_type=notif_type,
        page=page,
        page_size=page_size,
    )
    return NotificationListResponse(
        items=[_to_out(n) for n in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Authenticated,
) -> UnreadCountResponse:
    n = await notification_service.unread_count(db, user.wid)
    return UnreadCountResponse(count=n)


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def read_all_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Authenticated,
) -> None:
    await notification_service.mark_all_read(db, user.wid)


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def read_one_route(
    notification_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Authenticated,
) -> None:
    ok = await notification_service.mark_read(db, notification_id, user.wid)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
