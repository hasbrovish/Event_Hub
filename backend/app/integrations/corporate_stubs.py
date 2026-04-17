"""
================================================================================
EVENT HUB — CORPORATE INTEGRATION STUBS (single maintenance map for Copilot)
================================================================================

WHY THIS FILE EXISTS
  Hackathon / dev machines cannot reach Infosys LEX, Zscaler-terminated APIs, or
  Microsoft Graph. All outbound corporate calls should either:
    (a) live here as mocks, or
    (b) be imported from a sibling module (e.g. lex_client.py) that THIS file
        delegates to when settings.integration_mode == "live".

WHERE TO REPLACE FOR PRODUCTION
  | Integration              | Replace function / region below      | Typical real module |
  |--------------------------|--------------------------------------|---------------------|
  | Units / sub-units (LEX)  | INTEGRATION_POINT_LEX_MASTER_DATA    | lex_client.py       |
  | Teams channel list       | INTEGRATION_POINT_GRAPH_TEAMS        | graph_teams.py      |
  | Viva Engage groups       | INTEGRATION_POINT_GRAPH_VIVA         | graph_viva.py      |
  | SSO session → employee   | INTEGRATION_POINT_INFOSYS_SSO        | sso_service.py     |
  | User profile / directory | INTEGRATION_POINT_INFOSYS_USER_VIEW  | infosys_directory  |
  | Campaign post Teams      | campaign_delivery.deliver_*          | campaign_delivery   |
  | Campaign post Viva       | campaign_delivery.deliver_*          | campaign_delivery   |
  | InfyMe banner            | campaign_delivery.deliver_*          | campaign_delivery   |
  | Outlook beyond .ics      | INTEGRATION_POINT_GRAPH_OUTLOOK      | graph_calendar.py   |
  | Schedule clash check     | INTEGRATION_POINT_GOVERNANCE_CALENDAR| room/calendar API   |
  | Zscaler TLS              | (future) httpx client factory        | http_client_corporate |

DOCUMENTATION
  planning/MASTER_FINAL_PLAN.md — phased closure to ~100% PS completion
  planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md — Zscaler + remote VM

================================================================================
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# INTEGRATION_POINT_LEX_MASTER_DATA
# Replace with: POST to lex.infosysapps.com (or current gateway) for units/sub-units.
# Cache: 1 hour TTL recommended (see MASTER plan §8).
# Session: service principal or forwarded user cookie per Infosys security review.
# -----------------------------------------------------------------------------


async def fetch_units_for_master_data() -> list[str]:
    """Mock unit list. REAL: call LEX unit API, return sorted display names."""
    logger.debug("LEX_MASTER_DATA (mock): returning static units")
    return [
        "Technology",
        "Domain",
        "Health",
        "Fun",
        "Product",
    ]


async def fetch_sub_units_for_master_data(*, unit: str | None) -> list[dict[str, str]]:
    """Mock sub-units. REAL: LEX sub_unit API with parent unit key."""
    base = unit or "Technology"
    logger.debug("LEX_MASTER_DATA (mock): sub-units for unit=%s", base)
    return [
        {"id": "1", "name": f"{base} — Chapter A", "unit": base},
        {"id": "2", "name": f"{base} — Chapter B", "unit": base},
    ]


# -----------------------------------------------------------------------------
# INTEGRATION_POINT_GRAPH_TEAMS
# Replace with: Microsoft Graph list channels (teamId) or internal proxy that returns
# channel_id + displayName for campaign picker UI.
# -----------------------------------------------------------------------------


async def fetch_teams_channels_mock() -> list[dict[str, str]]:
    logger.debug("GRAPH_TEAMS (mock): static channel list")
    return [
        {"id": "mock-general", "name": "General (mock)"},
        {"id": "mock-events", "name": "Events (mock)"},
    ]


# -----------------------------------------------------------------------------
# INTEGRATION_POINT_GRAPH_VIVA
# Replace with: Viva Engage / Yammer community list via approved API.
# -----------------------------------------------------------------------------


async def fetch_viva_groups_mock() -> list[dict[str, str]]:
    logger.debug("GRAPH_VIVA (mock): static Viva groups")
    return [
        {"id": "mock-viva-1", "name": "Org Events (mock)"},
        {"id": "mock-viva-2", "name": "Tech Community (mock)"},
    ]


# -----------------------------------------------------------------------------
# INTEGRATION_POINT_GOVERNANCE_CALENDAR
# Replace with: Exchange/Graph room lists + organizer calendar conflict check.
# Wire into: approval_service.review_approval before final approve (see MASTER_FINAL_PLAN F6).
# -----------------------------------------------------------------------------


async def check_schedule_conflicts_stub(
    db: Any,
    *,
    event_id: uuid.UUID,
    organizer_wid: uuid.UUID,
) -> list[str]:
    """
    Returns human-readable conflict messages. Empty = no conflict (mock always empty).

    REAL IMPLEMENTATION SKETCH:
      - Query active events overlapping [start_date, end_date] for same venue_code or
        same Teams bridge ID.
      - Optional: Graph getSchedule for organizer + speakers.
    """
    _ = (db, event_id, organizer_wid)
    logger.debug("GOVERNANCE_CALENDAR (mock): no conflicts")
    return []


# -----------------------------------------------------------------------------
# INTEGRATION_POINT_GRAPH_OUTLOOK
# Optional tier-2 beyond .ics — create event in user calendar via Graph.
# -----------------------------------------------------------------------------


async def mock_graph_create_calendar_event_placeholder(
    *,
    employee_wid: uuid.UUID,
    event_title: str,
    start_iso: str,
    end_iso: str,
) -> dict[str, str]:
    """
    MOCK: pretend Graph created an event. REAL: POST /me/events with timezone + body.

    Copilot: implement in graph_calendar.py; call from registration or event detail flow.
    """
    logger.info(
        "GRAPH_OUTLOOK (mock): would create calendar event wid=%s title=%r",
        employee_wid,
        event_title,
    )
    return {
        "status": "mock_created",
        "web_link": f"https://outlook.office.com/calendar/0/deeplink/compose/mock?path={event_title[:20]}",
        "start": start_iso,
        "end": end_iso,
    }


# -----------------------------------------------------------------------------
# INTEGRATION_POINT_INFOSYS_SSO
# Real flow: validate cookie / token from Infosys IdP; issue Event Hub JWT.
# Mock flow: see parse_mock_sso_bootstrap + settings.integration_mock_sso_login
# -----------------------------------------------------------------------------


@dataclass(frozen=True)
class MockSSOProfile:
    email: str
    roles: list[str]
    first_name: str
    last_name: str


def parse_mock_sso_bootstrap(session_cookie: str) -> MockSSOProfile | None:
    """
    Parse demo SSO cookie when INTEGRATION_MOCK_SSO_LOGIN=true.

    Format (pipe-separated):
        mock_sso|email@example.com|audience,speaker,governance|First|Last

    Roles must be subset allowed by auth_service (includes governance).
    """
    prefix = "mock_sso|"
    if not session_cookie.startswith(prefix):
        return None
    rest = session_cookie[len(prefix) :]
    parts = rest.split("|")
    # email | roles_csv | first_name | last_name  (last may contain '|' if joined below)
    if len(parts) < 4:
        logger.warning("MOCK_SSO: expected 4+ pipe segments after prefix, got %s", len(parts))
        return None
    email, roles_raw, first = parts[0], parts[1], parts[2]
    last = "|".join(parts[3:]) if len(parts) > 3 else "User"
    roles = [r.strip() for r in roles_raw.split(",") if r.strip()]
    if not roles:
        roles = ["audience"]
    return MockSSOProfile(
        email=email.strip().lower(),
        roles=roles,
        first_name=first.strip() or "Demo",
        last_name=last.strip() or "User",
    )


def get_integration_status_for_health() -> dict[str, Any]:
    """Surface in GET /health so admins see mock vs live intent."""
    return {
        "mode": settings.integration_mode,
        "mock_sso_login_enabled": settings.integration_mock_sso_login,
        "lex_master_data": "mock" if settings.integration_mode == "mock" else "live_pending",
        "microsoft_graph": "mock" if settings.integration_mode == "mock" else "live_pending",
        "zscaler_ca_configured": bool(settings.zscaler_ca_path),
    }
