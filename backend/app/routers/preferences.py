from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Employee, Preference
from app.schemas.notification import PreferenceOut, PreferenceUpdate
from app.services import preference_service

router = APIRouter(prefix="/preferences", tags=["preferences"])

Authenticated = Annotated[Employee, Depends(get_current_user)]


def _pref_to_out(p: Preference) -> PreferenceOut:
    times = None
    if p.notification_times:
        times = [t.isoformat(timespec="seconds") for t in p.notification_times]
    return PreferenceOut(
        event_types=p.event_types,
        interests=p.interests,
        notification_frequency=p.notification_frequency,
        notification_mechanisms=p.notification_mechanisms,
        notification_times=times,
        notify_on_login=p.notify_on_login,
        followed_group_ids=p.followed_group_ids,
    )


@router.get("", response_model=PreferenceOut)
async def get_preferences(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Authenticated,
) -> PreferenceOut:
    p = await preference_service.get_or_create_preference(db, user)
    return _pref_to_out(p)


@router.patch("", response_model=PreferenceOut)
async def patch_preferences(
    data: PreferenceUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Authenticated,
) -> PreferenceOut:
    p = await preference_service.update_preference(
        db,
        user,
        event_types=data.event_types,
        interests=data.interests,
        notification_frequency=data.notification_frequency,
        notification_mechanisms=data.notification_mechanisms,
        notification_times=data.notification_times,
        notify_on_login=data.notify_on_login,
        followed_group_ids=data.followed_group_ids,
    )
    return _pref_to_out(p)
