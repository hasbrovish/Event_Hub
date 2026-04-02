from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SessionCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    topic_brief: str | None = None
    start_datetime: datetime
    duration_minutes: int = Field(..., ge=1, le=24 * 60)
    speaker_name: str | None = Field(None, max_length=200)
    speaker_title: str | None = Field(None, max_length=200)


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    event_type: str = Field(..., description="Technology|Health|Fun|Domain|Product|Others")
    tags: list[str] = Field(default_factory=list)
    delivery_method: str = Field(default="Virtual")
    start_date: datetime
    end_date: datetime
    venue_name: str | None = None
    event_url: str | None = None
    slots: int | None = Field(None, ge=1)
    visibility: str = Field(default="org-wide")
    group_id: int | None = None
    sessions: list[SessionCreate] = Field(default_factory=list)


class EventUpdate(BaseModel):
    title: str | None = Field(None, max_length=300)
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


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_order: int
    topic: str
    topic_brief: str | None
    start_datetime: datetime
    duration_minutes: int
    speaker_name: str | None
    speaker_title: str | None
    speaker_headshot_url: str | None


class EventListItem(BaseModel):
    """Shape aligned with frontend EventCard / Dashboard (camelCase JSON)."""

    id: str
    title: str
    description: str
    date: str
    time: str
    duration: str
    category: str
    location: str
    speaker: dict
    attendees: int
    max_attendees: int
    status: str
    tags: list[str]
    is_registered: bool = False


class EventDetailOut(EventListItem):
    delivery_method: str
    visibility: str
    group_id: int | None
    created_by: str
    db_status: str
    sessions: list[SessionOut] = Field(default_factory=list)
    my_registration_status: str | None = None


class EventListResponse(BaseModel):
    items: list[EventListItem]
    total: int
    page: int
    page_size: int


class SubmitForApprovalBody(BaseModel):
    note: str | None = None
