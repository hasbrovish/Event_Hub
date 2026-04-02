import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ApprovalReviewBody(BaseModel):
    decision: str = Field(description="approve | reject | request_modification")
    review_comment: str | None = None


class ApprovalOut(BaseModel):
    id: int
    event_id: uuid.UUID
    status: str
    request_note: str | None
    review_comment: str | None
    requested_at: datetime
    reviewed_at: datetime | None
    requested_by: uuid.UUID
    reviewed_by: uuid.UUID | None

    model_config = {"from_attributes": True}


class ApprovalPendingItem(BaseModel):
    approval_id: int
    event_id: uuid.UUID
    event_title: str
    status: str
    requested_at: datetime


class ApprovalPendingResponse(BaseModel):
    items: list[ApprovalPendingItem]
