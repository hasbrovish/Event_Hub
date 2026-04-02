from pydantic import BaseModel

from app.schemas.event import EventListItem


class RegistrationAttendee(BaseModel):
    wid: str
    email: str
    first_name: str
    last_name: str


class EventRegistrationRow(BaseModel):
    registration_id: int
    status: str
    employee: RegistrationAttendee


class EventRegistrationsListResponse(BaseModel):
    items: list[EventRegistrationRow]
    total: int
    page: int
    page_size: int


class RegistrationActionResponse(BaseModel):
    registration_id: int | None = None
    registration_status: str
    detail: str | None = None


class MyRegistrationEntry(BaseModel):
    registration_id: int
    registration_status: str
    event: EventListItem


class MyRegistrationsResponse(BaseModel):
    items: list[MyRegistrationEntry]
