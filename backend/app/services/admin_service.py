from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import delete, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ApprovalRequest, Employee, EmployeeRole, Event, Group, GroupAdmin

_CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_CONFIG_FILE = _CONFIG_DIR / "admin_config.json"
_DEFAULT_CONFIG: dict[str, str] = {
    "app.display_name": "Event Hub",
    "maintenance_mode": "false",
}


def _read_config_file() -> dict[str, str]:
    if not _CONFIG_FILE.exists():
        return dict(_DEFAULT_CONFIG)
    try:
        raw = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
        merged = dict(_DEFAULT_CONFIG)
        merged.update({str(k): str(v) for k, v in raw.items()})
        return merged
    except Exception:
        return dict(_DEFAULT_CONFIG)


def _write_config_file(data: dict[str, str]) -> None:
    _CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    _CONFIG_FILE.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")


async def list_users(
    db: AsyncSession,
    *,
    search: str | None,
    role: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Employee], int]:
    search_clause = None
    if search:
        q = f"%{search.lower()}%"
        search_clause = or_(
            func.lower(Employee.email).like(q),
            func.lower(Employee.first_name).like(q),
            func.lower(Employee.last_name).like(q),
        )
    stmt = select(Employee).options(selectinload(Employee.roles)).where(Employee.is_active.is_(True))
    if search_clause is not None:
        stmt = stmt.where(search_clause)
    if role:
        stmt = stmt.join(EmployeeRole, EmployeeRole.employee_wid == Employee.wid).where(
            EmployeeRole.role == role
        )
    count_stmt = select(func.count(distinct(Employee.wid))).select_from(Employee)
    if role:
        count_stmt = count_stmt.join(EmployeeRole, EmployeeRole.employee_wid == Employee.wid).where(
            Employee.is_active.is_(True),
            EmployeeRole.role == role,
        )
    else:
        count_stmt = count_stmt.where(Employee.is_active.is_(True))
    if search_clause is not None:
        count_stmt = count_stmt.where(search_clause)
    total = int((await db.execute(count_stmt)).scalar_one() or 0)
    stmt = stmt.order_by(Employee.email.asc()).offset((page - 1) * page_size).limit(page_size)
    rows = list((await db.execute(stmt)).scalars().unique().all())
    return rows, total


async def add_user_role(db: AsyncSession, wid: uuid.UUID, role: str) -> bool:
    emp = (await db.execute(select(Employee).where(Employee.wid == wid))).scalar_one_or_none()
    if emp is None:
        return False
    exists = (
        await db.execute(
            select(EmployeeRole).where(EmployeeRole.employee_wid == wid, EmployeeRole.role == role)
        )
    ).scalar_one_or_none()
    if exists:
        return True
    db.add(EmployeeRole(employee_wid=wid, role=role))
    await db.flush()
    return True


async def remove_user_role(db: AsyncSession, wid: uuid.UUID, role: str) -> bool:
    res = await db.execute(
        delete(EmployeeRole).where(EmployeeRole.employee_wid == wid, EmployeeRole.role == role)
    )
    return res.rowcount > 0


async def access_matrix(db: AsyncSession) -> list[tuple[Group, list[uuid.UUID]]]:
    groups = list((await db.execute(select(Group).where(Group.is_active.is_(True)))).scalars().all())
    out: list[tuple[Group, list[uuid.UUID]]] = []
    for g in groups:
        admins = (
            await db.execute(
                select(GroupAdmin.employee_wid).where(GroupAdmin.group_id == g.id),
            )
        ).scalars().all()
        out.append((g, list(admins)))
    return out


async def get_config() -> dict[str, str]:
    return _read_config_file()


async def patch_config(entries: list[tuple[str, str]]) -> dict[str, str]:
    cur = _read_config_file()
    for k, v in entries:
        cur[k] = v
    _write_config_file(cur)
    return dict(cur)


async def admin_stats(db: AsyncSession) -> dict[str, int]:
    now = datetime.now(timezone.utc)
    start_m = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    if now.month == 12:
        end_m = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_m = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
    total_users = int(
        (await db.execute(select(func.count(Employee.wid)).where(Employee.is_active.is_(True)))).scalar_one()
        or 0
    )
    organizers = int(
        (
            await db.execute(
                select(func.count(distinct(EmployeeRole.employee_wid))).where(
                    EmployeeRole.role == "organizer"
                )
            )
        ).scalar_one()
        or 0
    )
    events_month = int(
        (
            await db.execute(
                select(func.count(Event.id)).where(
                    Event.created_at >= start_m,
                    Event.created_at < end_m,
                )
            )
        ).scalar_one()
        or 0
    )
    pending = int(
        (
            await db.execute(
                select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "Pending")
            )
        ).scalar_one()
        or 0
    )
    return {
        "total_users": total_users,
        "organizers": organizers,
        "events_this_month": events_month,
        "pending_approvals": pending,
    }
