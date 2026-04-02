from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.corporate_stubs import check_schedule_conflicts_stub
from app.models import ApprovalRequest, Employee, Event
from app.schemas.approval import ApprovalListItem, ApprovalOut, ApprovalPendingItem
from app.services import approval_access, audit_service
from app.services.event_service import _is_privileged


async def list_approval_requests(
    db: AsyncSession,
    viewer: Employee,
    *,
    approval_status: str | None,
    group_id: int | None,
    page: int,
    page_size: int,
) -> tuple[list[ApprovalListItem], int]:
    if not _is_privileged(viewer):
        return [], 0
    count_base = (
        select(func.count(ApprovalRequest.id))
        .select_from(ApprovalRequest)
        .join(Event, ApprovalRequest.event_id == Event.id)
    )
    if approval_status:
        count_base = count_base.where(ApprovalRequest.status == approval_status)
    if group_id is not None:
        count_base = count_base.where(Event.group_id == group_id)
    scope = approval_access.organizer_event_scope_clause(viewer)
    if scope is not None:
        count_base = count_base.where(scope)
    total = int((await db.execute(count_base)).scalar_one() or 0)

    stmt = select(ApprovalRequest, Event).join(Event, ApprovalRequest.event_id == Event.id)
    if approval_status:
        stmt = stmt.where(ApprovalRequest.status == approval_status)
    if group_id is not None:
        stmt = stmt.where(Event.group_id == group_id)
    if scope is not None:
        stmt = stmt.where(scope)
    stmt = (
        stmt.order_by(ApprovalRequest.requested_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(stmt)).all()
    items = [
        ApprovalListItem(
            approval_id=ar.id,
            event_id=ev.id,
            event_title=ev.title,
            status=ar.status,
            requested_at=ar.requested_at,
            requested_by=ar.requested_by,
            review_comment=ar.review_comment,
        )
        for ar, ev in rows
    ]
    return items, total


async def list_pending_approvals(db: AsyncSession, viewer: Employee) -> list[ApprovalPendingItem]:
    if not _is_privileged(viewer):
        return []
    scope = approval_access.organizer_event_scope_clause(viewer)
    stmt = (
        select(ApprovalRequest, Event)
        .join(Event, ApprovalRequest.event_id == Event.id)
        .where(ApprovalRequest.status == "Pending", Event.status == "Pending Approval")
        .order_by(ApprovalRequest.requested_at.asc())
        .limit(100)
    )
    if scope is not None:
        stmt = stmt.where(scope)
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


async def list_my_approval_requests(db: AsyncSession, user: Employee) -> list[ApprovalListItem]:
    stmt = (
        select(ApprovalRequest, Event)
        .join(Event, ApprovalRequest.event_id == Event.id)
        .where(ApprovalRequest.requested_by == user.wid)
        .order_by(ApprovalRequest.requested_at.desc())
        .limit(100)
    )
    rows = (await db.execute(stmt)).all()
    return [
        ApprovalListItem(
            approval_id=ar.id,
            event_id=ev.id,
            event_title=ev.title,
            status=ar.status,
            requested_at=ar.requested_at,
            requested_by=ar.requested_by,
            review_comment=ar.review_comment,
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
    if not await approval_access.can_review_event(db, reviewer, ev):
        raise PermissionError("not_group_reviewer")

    # INTEGRATION_POINT_GOVERNANCE_CALENDAR — LEX/Graph room & calendar clash (stub returns [])
    clashes = await check_schedule_conflicts_stub(db, event_id=ev.id, organizer_wid=reviewer.wid)
    if clashes:
        raise ValueError("schedule_conflict:" + "; ".join(clashes))

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

    from app.services import notification_service

    if decision_norm == "approve":
        await notification_service.notify_employee(
            db,
            employee_wid=ev.created_by,
            title="Event approved",
            body=f'Your event "{ev.title}" was approved and is now active.',
            notif_type="approved",
            event_id=ev.id,
        )
        await notification_service.notify_interested_users_new_active_event(db, ev)
    elif decision_norm == "reject":
        await notification_service.notify_employee(
            db,
            employee_wid=ev.created_by,
            title="Event rejected",
            body=f'Your event "{ev.title}" was rejected.',
            notif_type="rejected",
            event_id=ev.id,
        )
    else:
        await notification_service.notify_employee(
            db,
            employee_wid=ev.created_by,
            title="Changes requested",
            body=f'Modifications were requested for "{ev.title}".',
            notif_type="modification",
            event_id=ev.id,
        )

    await audit_service.append(
        db,
        action=f"approval_{decision_norm}",
        detail=f"event_id={ev.id} title={ev.title!r}",
        actor_wid=reviewer.wid,
    )

    return ApprovalOut.model_validate(ar)
