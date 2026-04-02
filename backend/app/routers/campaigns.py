import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models import Employee
from app.schemas.campaign import CampaignCreate, CampaignListResponse, CampaignOut, CampaignUpdate
from app.services import campaign_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

# governance: PS "Governance team" — campaign surfaces (not necessarily approvals)
OrganizerPlus = Annotated[
    Employee,
    Depends(require_roles("organizer", "admin", "platform_admin", "governance")),
]


@router.get("", response_model=CampaignListResponse)
async def list_campaigns_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: OrganizerPlus,
    event_id: uuid.UUID | None = Query(None),
    campaign_status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> CampaignListResponse:
    rows, total = await campaign_service.list_campaigns(
        db, event_id=event_id, status=campaign_status, page=page, page_size=page_size
    )
    return CampaignListResponse(
        items=[CampaignOut.model_validate(c) for c in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=CampaignOut)
async def create_campaign_route(
    data: CampaignCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: OrganizerPlus,
) -> CampaignOut:
    try:
        c = await campaign_service.create_campaign(db, data, user)
    except LookupError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return CampaignOut.model_validate(c)


@router.patch("/{campaign_id}", response_model=CampaignOut)
async def patch_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: OrganizerPlus,
) -> CampaignOut:
    c = await campaign_service.update_campaign(db, campaign_id, data)
    if c is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return CampaignOut.model_validate(c)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign_route(
    campaign_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: OrganizerPlus,
) -> None:
    ok = await campaign_service.delete_campaign_draft(db, campaign_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign not found or not in Draft status",
        )


@router.post("/{campaign_id}/send-now", response_model=CampaignOut)
async def send_campaign_now_route(
    campaign_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: OrganizerPlus,
) -> CampaignOut:
    c = await campaign_service.send_campaign_now(db, campaign_id)
    if c is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return CampaignOut.model_validate(c)
