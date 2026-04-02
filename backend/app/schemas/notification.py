from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class NotificationOut(BaseModel):
    id: int
    type: str | None
    title: str | None
    body: str | None
    is_read: bool
    event_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationOut]
    total: int
    page: int
    page_size: int


class UnreadCountResponse(BaseModel):
    count: int


class PreferenceOut(BaseModel):
    event_types: list[str] | None = None
    interests: list[str] | None = None
    notification_frequency: str = "immediate"
    notification_mechanisms: list[str] | None = None
    notification_times: list[Any] = None
    notify_on_login: bool = True
    followed_group_ids: list[int] | None = None

    model_config = {"from_attributes": True}


class PreferenceUpdate(BaseModel):
    event_types: list[str] | None = None
    interests: list[str] | None = None
    notification_frequency: str | None = None
    notification_mechanisms: list[str] | None = None
    notification_times: list[str] | None = None
    notify_on_login: bool | None = None
    followed_group_ids: list[int] | None = None
