from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Campaign, Employee, Event
from app.schemas.campaign import CampaignCreate, CampaignUpdate
from app.services import campaign_delivery

logger = logging.getLogger(__name__)


async def list_campaigns(
    db: AsyncSession,
    *,
    event_id: uuid.UUID | None,
    status: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Campaign], int]:
    stmt = select(Campaign)
    count_stmt = select(func.count(Campaign.id))
    if event_id is not None:
        stmt = stmt.where(Campaign.event_id == event_id)
        count_stmt = count_stmt.where(Campaign.event_id == event_id)
    if status:
        stmt = stmt.where(Campaign.status == status)
        count_stmt = count_stmt.where(Campaign.status == status)
    total = int((await db.execute(count_stmt)).scalar_one() or 0)
    stmt = stmt.order_by(Campaign.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = list((await db.execute(stmt)).scalars().all())
    return rows, total


async def create_campaign(db: AsyncSession, data: CampaignCreate, creator: Employee) -> Campaign:
    ev = (await db.execute(select(Event).where(Event.id == data.event_id))).scalar_one_or_none()
    if ev is None:
        raise LookupError("event_not_found")
    now = datetime.now(timezone.utc)
    when = data.scheduled_at or (now + timedelta(days=7))
    camp_status = "Scheduled" if when > now + timedelta(minutes=1) else "Draft"
    c = Campaign(
        event_id=data.event_id,
        created_by=creator.wid,
        message=data.message,
        teams_channel_ids=data.teams_channel_ids or None,
        viva_group_ids=data.viva_group_ids or None,
        infyme_banner=data.infyme_banner,
        scheduled_at=when,
        status=camp_status,
    )
    db.add(c)
    await db.flush()
    await db.refresh(c)
    return c


async def get_campaign(db: AsyncSession, campaign_id: int) -> Campaign | None:
    return (await db.execute(select(Campaign).where(Campaign.id == campaign_id))).scalar_one_or_none()


async def update_campaign(db: AsyncSession, campaign_id: int, data: CampaignUpdate) -> Campaign | None:
    c = await get_campaign(db, campaign_id)
    if c is None:
        return None
    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(c, k, v)
    await db.flush()
    await db.refresh(c)
    return c


async def delete_campaign_draft(db: AsyncSession, campaign_id: int) -> bool:
    c = await get_campaign(db, campaign_id)
    if c is None or c.status != "Draft":
        return False
    await db.execute(delete(Campaign).where(Campaign.id == c.id))
    await db.flush()
    return True


async def send_campaign_now(db: AsyncSession, campaign_id: int) -> Campaign | None:
    c = await get_campaign(db, campaign_id)
    if c is None:
        return None
    ev = (await db.execute(select(Event).where(Event.id == c.event_id))).scalar_one_or_none()
    event_title = ev.title if ev else ""
    # INTEGRATION_POINT_CAMPAIGN_POST — real HTTP in campaign_delivery.deliver_campaign_channels
    await campaign_delivery.deliver_campaign_channels(db, c, event_title=event_title)
    now = datetime.now(timezone.utc)
    c.status = "Posted"
    c.posted_at = now
    c.failure_reason = None
    await db.flush()
    await db.refresh(c)
    return c


async def scheduler_tick(db: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    stmt = select(Campaign).where(
        Campaign.status == "Scheduled",
        Campaign.scheduled_at <= now,
    )
    rows = list((await db.execute(stmt)).scalars().all())
    n = 0
    for c in rows:
        await send_campaign_now(db, c.id)
        n += 1
    return n
