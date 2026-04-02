"""
================================================================================
EVENT HUB — CAMPAIGN DELIVERY (Teams / Viva / InfyMe)
================================================================================

INTEGRATION_POINT_CAMPAIGN_POST
  All outbound posts for scheduled campaigns MUST go through this module so
  corporate engineers and Copilot can replace mocks with real APIs in one place.

REAL IMPLEMENTATION ORDER (suggested)
  1) Teams: incoming webhook URL per channel (simplest) OR Graph chatMessage
  2) Viva Engage: approved internal API or Graph beta endpoint per tenant policy
  3) InfyMe: banner API from reference_docs/apis.json (validate current path)

CALLERS
  campaign_service.send_campaign_now / scheduler_tick → deliver_campaign_channels

See: planning/MASTER_FINAL_PLAN.md Phase F3
================================================================================
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def deliver_campaign_channels(
    db: AsyncSession,
    campaign: Any,
    *,
    event_title: str,
) -> None:
    """
    Side effects only (HTTP to Microsoft / Infosys). On full failure, set
    campaign.failure_reason in the caller.

    MOCK: logs channel IDs. REAL: branch on teams_channel_ids, viva_group_ids,
    campaign.infyme_banner.
    """
    _ = db
    # --- INTEGRATION_POINT_TEAMS_POST ---
    if campaign.teams_channel_ids:
        for ch in campaign.teams_channel_ids:
            logger.info(
                "TEAMS_POST (mock): would post to channel_id=%r event=%r campaign_id=%s",
                ch,
                event_title,
                campaign.id,
            )
            # REAL: await teams_client.post_message(channel_id=ch, text=..., adaptive_card=...)

    # --- INTEGRATION_POINT_VIVA_POST ---
    if campaign.viva_group_ids:
        for gid in campaign.viva_group_ids:
            logger.info(
                "VIVA_POST (mock): would post to viva_group_id=%r event=%r campaign_id=%s",
                gid,
                event_title,
                campaign.id,
            )
            # REAL: await viva_client.create_story(community_id=gid, ...)

    # --- INTEGRATION_POINT_INFYME_BANNER ---
    if campaign.infyme_banner:
        logger.info(
            "INFYME_BANNER (mock): would request banner for campaign_id=%s event=%r",
            campaign.id,
            event_title,
        )
        # REAL: await infyme_client.schedule_banner(event_id=campaign.event_id, ...)

    if not (
        campaign.teams_channel_ids or campaign.viva_group_ids or campaign.infyme_banner
    ):
        logger.info(
            "CAMPAIGN_DELIVERY: no channels selected; campaign_id=%s marked posted (empty delivery)",
            campaign.id,
        )


async def build_campaign_message_body(campaign: Any, event_title: str) -> str:
    """Shared text / adaptive card payload; extend for rich formatting."""
    base = (campaign.message or "").strip()
    if not base:
        return f'Event: "{event_title}"'
    return base
