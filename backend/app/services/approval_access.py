"""Group-scoped approval visibility for organizers (MASTER plan + SYNTHESIS risk register)."""

from __future__ import annotations

from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Employee, Event, GroupAdmin


def _roles(emp: Employee) -> set[str]:
    return {r.role for r in emp.roles}


def is_full_approval_reviewer(emp: Employee) -> bool:
    return bool(_roles(emp) & {"admin", "platform_admin"})


def organizer_event_scope_clause(viewer: Employee):
    """Extra filter on `Event` for approval queues. None = no extra filter."""
    if is_full_approval_reviewer(viewer):
        return None
    if "organizer" not in _roles(viewer):
        return None
    return Event.group_id.is_(None) | exists(
        select(1).where(
            GroupAdmin.group_id == Event.group_id,
            GroupAdmin.employee_wid == viewer.wid,
        )
    )


async def can_review_event(db: AsyncSession, reviewer: Employee, ev: Event) -> bool:
    if is_full_approval_reviewer(reviewer):
        return True
    if "organizer" not in _roles(reviewer):
        return False
    if ev.group_id is None:
        return True
    n = await db.scalar(
        select(func.count(GroupAdmin.group_id)).where(
            GroupAdmin.group_id == ev.group_id,
            GroupAdmin.employee_wid == reviewer.wid,
        )
    )
    return int(n or 0) > 0


async def can_list_event_registrations(
    db: AsyncSession,
    viewer: Employee,
    ev: Event,
) -> bool:
    """Organizer+ may list registrations if they pass the same group scope as approvals."""
    from app.services.event_service import _is_privileged

    if not _is_privileged(viewer):
        return False
    if is_full_approval_reviewer(viewer):
        return True
    if ev.created_by == viewer.wid:
        return True
    if "organizer" not in _roles(viewer):
        return False
    if ev.group_id is None:
        return True
    return await can_review_event(db, viewer, ev)


async def can_mark_attendance(db: AsyncSession, viewer: Employee, ev: Event) -> bool:
    if ev.created_by == viewer.wid:
        return True
    if is_full_approval_reviewer(viewer):
        return True
    if "organizer" not in _roles(viewer):
        return False
    return await can_review_event(db, viewer, ev)
