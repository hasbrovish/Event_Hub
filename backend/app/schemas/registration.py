from pydantic import BaseModel

from app.schemas.event import EventListItem


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
