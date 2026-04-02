from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Employee, Group, GroupAdmin
from app.schemas.group import GroupCreate, GroupUpdate


async def list_groups(
    db: AsyncSession,
    *,
    org: str | None,
    unit: str | None,
    location: str | None,
    search: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Group], int]:
    stmt = select(Group).where(Group.is_active.is_(True))
    if org:
        stmt = stmt.where(Group.org == org)
    if unit:
        stmt = stmt.where(Group.unit == unit)
    if location:
        stmt = stmt.where(Group.location == location)
    if search:
        q = f"%{search}%"
        stmt = stmt.where(Group.name.ilike(q))
    count_stmt = select(func.count(Group.id)).where(Group.is_active.is_(True))
    if org:
        count_stmt = count_stmt.where(Group.org == org)
    if unit:
        count_stmt = count_stmt.where(Group.unit == unit)
    if location:
        count_stmt = count_stmt.where(Group.location == location)
    if search:
        count_stmt = count_stmt.where(Group.name.ilike(q))
    total = int((await db.execute(count_stmt)).scalar_one() or 0)
    stmt = stmt.order_by(Group.name.asc()).offset((page - 1) * page_size).limit(page_size)
    rows = list((await db.execute(stmt)).scalars().all())
    return rows, total


async def create_group(db: AsyncSession, data: GroupCreate, creator: Employee) -> Group:
    g = Group(
        name=data.name,
        description=data.description,
        org=data.org,
        geo=data.geo,
        unit=data.unit,
        subunit=data.subunit,
        location=data.location,
        dl_emails=[str(e) for e in data.dl_emails] if data.dl_emails else None,
        created_by=creator.wid,
    )
    db.add(g)
    await db.flush()
    await db.refresh(g)
    return g


async def update_group(db: AsyncSession, group_id: int, data: GroupUpdate) -> Group | None:
    g = (await db.execute(select(Group).where(Group.id == group_id))).scalar_one_or_none()
    if g is None:
        return None
    payload = data.model_dump(exclude_unset=True)
    if "dl_emails" in payload and payload["dl_emails"] is not None:
        payload["dl_emails"] = [str(e) for e in payload["dl_emails"]]
    for k, v in payload.items():
        setattr(g, k, v)
    await db.flush()
    await db.refresh(g)
    return g


async def add_group_admin(db: AsyncSession, group_id: int, employee_wid: uuid.UUID) -> bool:
    g = (await db.execute(select(Group).where(Group.id == group_id))).scalar_one_or_none()
    if g is None:
        return False
    emp = (await db.execute(select(Employee).where(Employee.wid == employee_wid))).scalar_one_or_none()
    if emp is None:
        return False
    existing = (
        await db.execute(
            select(GroupAdmin).where(
                GroupAdmin.group_id == group_id,
                GroupAdmin.employee_wid == employee_wid,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return True
    db.add(GroupAdmin(group_id=group_id, employee_wid=employee_wid))
    await db.flush()
    return True


async def remove_group_admin(db: AsyncSession, group_id: int, employee_wid: uuid.UUID) -> bool:
    res = await db.execute(
        delete(GroupAdmin).where(
            GroupAdmin.group_id == group_id,
            GroupAdmin.employee_wid == employee_wid,
        )
    )
    return res.rowcount > 0
