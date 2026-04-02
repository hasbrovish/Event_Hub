from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Employee
from app.schemas.event import EventListItem
from app.services import event_service, preference_service
from app.services.event_service import EVENT_TYPE_TO_CATEGORY


async def list_recommendations(
    db: AsyncSession,
    user: Employee,
    *,
    page: int,
    page_size: int,
) -> tuple[list[EventListItem], int]:
    pref = await preference_service.get_or_create_preference(db, user)
    preferred_slugs: set[str] = set()
    for et in pref.event_types or []:
        preferred_slugs.add(EVENT_TYPE_TO_CATEGORY.get(et, "tech"))
    items, _total = await event_service.list_events(
        db,
        category=None,
        ui_status="upcoming",
        page=1,
        page_size=500,
        current_user=user,
    )

    def rank_key(it: EventListItem) -> tuple[int, int, str, str]:
        type_match = 1 if it.category in preferred_slugs or not preferred_slugs else 0
        reg_boost = 1 if it.is_registered else 0
        return (-(type_match + reg_boost), -it.attendees, it.date, it.id)

    ranked = sorted(items, key=rank_key)
    start = (page - 1) * page_size
    page_items = ranked[start : start + page_size]
    return page_items, len(ranked)


async def list_trending(
    db: AsyncSession,
    user: Employee | None,
    *,
    page: int,
    page_size: int,
) -> tuple[list[EventListItem], int]:
    items, _ = await event_service.list_events(
        db,
        category=None,
        ui_status="live",
        page=1,
        page_size=100,
        current_user=user,
    )
    by_attendees = sorted(items, key=lambda x: -x.attendees)
    start = (page - 1) * page_size
    return by_attendees[start : start + page_size], len(by_attendees)
