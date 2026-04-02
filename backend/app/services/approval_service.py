from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ApprovalRequest, Employee, Event
from app.schemas.approval import ApprovalOut, ApprovalPendingItem
from app.services.event_service import _is_privileged


async def list_pending_approvals(db: AsyncSession, viewer: Employee) -> list[ApprovalPendingItem]:
    if not _is_privileged(viewer):
        return []
    stmt = (
        select(ApprovalRequest, Event)
        .join(Event, ApprovalRequest.event_id == Event.id)
        .where(ApprovalRequest.status == "Pending", Event.status == "Pending Approval")
        .order_by(ApprovalRequest.requested_at.asc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).all()
    return [
        ApprovalPendingItem(
            approval_id=ar.id,
            event_id=ev.id,
            event_title=ev.title,
            status=ar.status,
            requested_at=ar.requested_at,
        )
        for ar, ev in rows
    ]


async def review_approval(
    db: AsyncSession,
    approval_id: int,
    reviewer: Employee,
    decision: str,
    review_comment: str | None,
) -> ApprovalOut | None:
    if not _is_privileged(reviewer):
        raise PermissionError("not_reviewer")
    decision_norm = decision.strip().lower().replace("-", "_")
    if decision_norm not in ("approve", "reject", "request_modification"):
        raise ValueError("invalid_decision")

    ar = (
        await db.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id))
    ).scalar_one_or_none()
    if ar is None:
        return None
    if ar.status != "Pending":
        raise ValueError("not_pending")
    ev = (await db.execute(select(Event).where(Event.id == ar.event_id))).scalar_one_or_none()
    if ev is None or ev.status != "Pending Approval":
        raise ValueError("event_not_pending_approval")

    now = datetime.now(timezone.utc)
    ar.reviewed_by = reviewer.wid
    ar.reviewed_at = now
    ar.review_comment = review_comment

    if decision_norm == "approve":
        ar.status = "Approved"
        ev.status = "Active"
    elif decision_norm == "reject":
        ar.status = "Rejected"
        ev.status = "Rejected"
    else:
        ar.status = "Modification Requested"
        ev.status = "Draft"

    await db.flush()
    await db.refresh(ar)
    return ApprovalOut.model_validate(ar)
