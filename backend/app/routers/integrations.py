from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import require_roles
from app.integrations.corporate_stubs import fetch_teams_channels_mock, fetch_viva_groups_mock
from app.models import Employee

router = APIRouter(prefix="/integrations", tags=["integrations"])

OrganizerPlus = Annotated[
    Employee,
    Depends(require_roles("organizer", "admin", "platform_admin", "governance")),
]


class Channel(BaseModel):
    id: str
    name: str


class TeamsChannelsResponse(BaseModel):
    channels: list[Channel]


class VivaGroup(BaseModel):
    id: str
    name: str


class VivaGroupsResponse(BaseModel):
    groups: list[VivaGroup]


@router.get("/teams-channels", response_model=TeamsChannelsResponse)
async def teams_channels(user: OrganizerPlus) -> TeamsChannelsResponse:
    _ = user
    # INTEGRATION_POINT_GRAPH_TEAMS — replace fetch_teams_channels_mock with Graph/proxy
    rows = await fetch_teams_channels_mock()
    return TeamsChannelsResponse(channels=[Channel(**r) for r in rows])


@router.get("/viva-groups", response_model=VivaGroupsResponse)
async def viva_groups(user: OrganizerPlus) -> VivaGroupsResponse:
    _ = user
    # INTEGRATION_POINT_GRAPH_VIVA — replace with Viva/Engage API client
    rows = await fetch_viva_groups_mock()
    return VivaGroupsResponse(groups=[VivaGroup(**r) for r in rows])
