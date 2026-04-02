import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    topic_brief: str | None = None
    start_datetime: datetime
    duration_minutes: int = Field(..., ge=1, le=24 * 60)
    speaker_name: str | None = None
    speaker_title: str | None = None


class SessionOut(BaseModel):
    id: int
    session_order: int
    topic: str
    topic_brief: str | None
    start_datetime: datetime
    duration_minutes: int
    speaker_name: str | None
    speaker_title: str | None
    speaker_headshot_url: str | None


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    event_type: str = Field(..., max_length=50)
    tags: list[str] = Field(default_factory=list)
    delivery_method: str = Field(default="Virtual", max_length=50)
    start_date: datetime
    end_date: datetime
    venue_name: str | None = None
    event_url: str | None = None
    slots: int | None = Field(None, ge=1)
    visibility: str = Field(default="internal", max_length=50)
    group_id: int | None = None
    sessions: list[SessionCreate] = Field(default_factory=list)


class EventUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None
    event_type: str | None = None
    tags: list[str] | None = None
    delivery_method: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    venue_name: str | None = None
    event_url: str | None = None
    slots: int | None = None
    visibility: str | None = None
    group_id: int | None = None


class SpeakerBlock(BaseModel):
    name: str
    title: str
    avatar: str


class EventListItem(BaseModel):
    id: str
    title: str
    description: str
    date: str
    time: str
    duration: str
    category: str
    location: str
    speaker: SpeakerBlock
    attendees: int
    max_attendees: int
    status: str
    tags: list[str]
    is_registered: bool


class EventDetailOut(EventListItem):
    delivery_method: str
    visibility: str
    group_id: int | None
    created_by: str
    db_status: str
    sessions: list[SessionOut]
    my_registration_status: str | None


class EventListResponse(BaseModel):
    items: list[EventListItem]
    total: int
    page: int
    page_size: int


class EventStatsOut(BaseModel):
    upcoming: int
    live: int
    registered_by_me: int
    total_active: int


class SubmitForApprovalBody(BaseModel):
    note: str | None = None
