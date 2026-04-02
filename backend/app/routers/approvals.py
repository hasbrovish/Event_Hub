from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Employee
from app.schemas.approval import ApprovalOut, ApprovalPendingResponse, ApprovalReviewBody
from app.services import approval_service

router = APIRouter(prefix="/approvals", tags=["approvals"])

ReviewerPlus = Annotated[Employee, Depends(require_roles("organizer", "admin", "platform_admin"))]


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
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to review")
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
