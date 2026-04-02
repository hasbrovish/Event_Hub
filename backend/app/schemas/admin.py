import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class UserWithRolesOut(BaseModel):
    wid: str
    email: str
    first_name: str
    last_name: str
    roles: list[str]


class AdminUserListResponse(BaseModel):
    items: list[UserWithRolesOut]
    total: int
    page: int
    page_size: int


class AdminRoleBody(BaseModel):
    role: str = Field(..., min_length=1, max_length=50)


class GroupOrganizerEntry(BaseModel):
    group_id: int
    group_name: str
    organizer_wids: list[str]


class AccessMatrixResponse(BaseModel):
    items: list[GroupOrganizerEntry]


class AuditLogItem(BaseModel):
    id: int
    action: str
    detail: str | None
    actor_wid: str | None
    created_at: datetime


class AdminLogsResponse(BaseModel):
    items: list[AuditLogItem]


class ConfigEntry(BaseModel):
    key: str
    value: str


class AdminConfigResponse(BaseModel):
    items: list[ConfigEntry]


class AdminConfigPatch(BaseModel):
    entries: list[ConfigEntry]


class AdminStatsOut(BaseModel):
    total_users: int
    organizers: int
    events_this_month: int
    pending_approvals: int
