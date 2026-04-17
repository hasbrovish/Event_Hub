"""
Corporate / Infosys / Microsoft integration package.

All *mock* implementations and *INTEGRATION_POINT* comments for replacement live in
`corporate_stubs.py`. Copilot / human maintainers: start there, then this package's
callers in routers and `campaign_delivery`.

See: planning/MASTER_FINAL_PLAN.md
"""

from app.integrations.corporate_stubs import (
    check_schedule_conflicts_stub,
    fetch_sub_units_for_master_data,
    fetch_teams_channels_mock,
    fetch_units_for_master_data,
    fetch_viva_groups_mock,
    get_integration_status_for_health,
    parse_mock_sso_bootstrap,
)

__all__ = [
    "check_schedule_conflicts_stub",
    "fetch_sub_units_for_master_data",
    "fetch_teams_channels_mock",
    "fetch_units_for_master_data",
    "fetch_viva_groups_mock",
    "get_integration_status_for_health",
    "parse_mock_sso_bootstrap",
]
