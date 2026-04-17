from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_current_user_optional
from app.models import Employee
from app.schemas.event import EventListResponse
from app.schemas.recommendation import RecommendationsResponse
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=RecommendationsResponse)
async def recommendations(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> RecommendationsResponse:
    items, total = await recommendation_service.list_recommendations(
        db, user, page=page, page_size=page_size
    )
    return RecommendationsResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/trending", response_model=EventListResponse)
async def trending(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee | None, Depends(get_current_user_optional)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
) -> EventListResponse:
    items, total = await recommendation_service.list_trending(
        db, user, page=page, page_size=page_size
    )
    return EventListResponse(items=items, total=total, page=page, page_size=page_size)
