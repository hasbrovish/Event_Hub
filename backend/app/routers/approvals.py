from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Employee
from app.schemas.approval import (
    ApprovalListResponse,
    ApprovalOut,
    ApprovalPendingResponse,
    ApprovalReviewBody,
    MyApprovalRequestsResponse,
)
from app.services import approval_service

router = APIRouter(prefix="/approvals", tags=["approvals"])

ReviewerPlus = Annotated[Employee, Depends(require_roles("organizer", "admin", "platform_admin"))]
SpeakerPlus = Annotated[Employee, Depends(require_roles("speaker", "organizer", "admin", "platform_admin"))]


@router.get("", response_model=ApprovalListResponse)
async def list_approvals(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: ReviewerPlus,
    approval_status: str | None = Query(None, alias="status"),
    group_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ApprovalListResponse:
    items, total = await approval_service.list_approval_requests(
        db,
        user,
        approval_status=approval_status,
        group_id=group_id,
        page=page,
        page_size=page_size,
    )
    return ApprovalListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/my-requests", response_model=MyApprovalRequestsResponse)
async def my_approval_requests(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: SpeakerPlus,
) -> MyApprovalRequestsResponse:
    items = await approval_service.list_my_approval_requests(db, user)
    return MyApprovalRequestsResponse(items=items)


@router.get("/pending", response_model=ApprovalPendingResponse)
async def list_pending(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: ReviewerPlus,
) -> ApprovalPendingResponse:
    items = await approval_service.list_pending_approvals(db, user)
    return ApprovalPendingResponse(items=items)


@router.patch("/{approval_id}", response_model=ApprovalOut)
async def review(
    approval_id: int,
    body: ApprovalReviewBody,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: ReviewerPlus,
) -> ApprovalOut:
    try:
        out = await approval_service.review_approval(
            db, approval_id, user, body.decision, body.review_comment
        )
    except PermissionError as e:
        key = str(e) if e.args else ""
        detail = (
            "You are not an organizer for this event's group"
            if key == "not_group_reviewer"
            else "Not allowed to review"
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    except ValueError as e:
        msg = str(e)
        if msg == "not_pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Approval is not pending",
            )
        if msg == "event_not_pending_approval":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Event is not awaiting approval",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    if out is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")
    return out
