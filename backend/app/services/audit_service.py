from __future__ import annotations

import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


async def append(
    db: AsyncSession,
    *,
    action: str,
    detail: str | None = None,
    actor_wid: uuid.UUID | None = None,
) -> None:
    db.add(AuditLog(action=action, detail=detail, actor_wid=actor_wid))
    await db.flush()


async def list_recent(db: AsyncSession, *, limit: int = 100) -> list[AuditLog]:
    stmt = select(AuditLog).order_by(desc(AuditLog.id)).limit(limit)
    return list((await db.execute(stmt)).scalars().all())
