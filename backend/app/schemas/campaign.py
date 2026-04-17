import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CampaignOut(BaseModel):
    id: int
    event_id: uuid.UUID
    created_by: uuid.UUID
    message: str
    teams_channel_ids: list[str] | None
    viva_group_ids: list[str] | None
    infyme_banner: bool
    scheduled_at: datetime
    status: str
    posted_at: datetime | None
    failure_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CampaignListResponse(BaseModel):
    items: list[CampaignOut]
    total: int
    page: int
    page_size: int


class CampaignCreate(BaseModel):
    event_id: uuid.UUID
    message: str = Field(..., min_length=1)
    teams_channel_ids: list[str] = Field(default_factory=list)
    viva_group_ids: list[str] = Field(default_factory=list)
    infyme_banner: bool = False
    scheduled_at: datetime | None = None


class CampaignUpdate(BaseModel):
    message: str | None = None
    teams_channel_ids: list[str] | None = None
    viva_group_ids: list[str] | None = None
    infyme_banner: bool | None = None
    scheduled_at: datetime | None = None
    status: str | None = None
