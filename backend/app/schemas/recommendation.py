from pydantic import BaseModel

from app.schemas.event import EventListItem


class RecommendationsResponse(BaseModel):
    items: list[EventListItem]
    total: int
    page: int
    page_size: int
