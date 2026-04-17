import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Employee
from app.schemas.group import GroupAdminBody, GroupCreate, GroupListResponse, GroupOut, GroupUpdate
from app.services import group_service

router = APIRouter(prefix="/groups", tags=["groups"])

AdminOnly = Annotated[Employee, Depends(require_roles("admin", "platform_admin"))]
Authenticated = Annotated[Employee, Depends(get_current_user)]


@router.get("", response_model=GroupListResponse)
async def list_groups_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Authenticated,
    org: str | None = Query(None),
    unit: str | None = Query(None),
    location: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> GroupListResponse:
    rows, total = await group_service.list_groups(
        db, org=org, unit=unit, location=location, search=search, page=page, page_size=page_size
    )
    return GroupListResponse(
        items=[GroupOut.model_validate(g) for g in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GroupOut)
async def create_group_route(
    data: GroupCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminOnly,
) -> GroupOut:
    g = await group_service.create_group(db, data, user)
    return GroupOut.model_validate(g)


@router.patch("/{group_id}", response_model=GroupOut)
async def patch_group(
    group_id: int,
    data: GroupUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminOnly,
) -> GroupOut:
    g = await group_service.update_group(db, group_id, data)
    if g is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return GroupOut.model_validate(g)


@router.post("/{group_id}/admins", status_code=status.HTTP_201_CREATED)
async def add_group_admin_route(
    group_id: int,
    body: GroupAdminBody,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminOnly,
) -> None:
    try:
        wid = uuid.UUID(body.employee_wid)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid employee_wid")
    ok = await group_service.add_group_admin(db, group_id, wid)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group or employee not found")


@router.delete("/{group_id}/admins/{wid}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_group_admin_route(
    group_id: int,
    wid: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminOnly,
) -> None:
    ok = await group_service.remove_group_admin(db, group_id, wid)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mapping not found")
