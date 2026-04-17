import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models import Employee
from app.schemas.admin import (
    AccessMatrixResponse,
    AdminConfigPatch,
    AdminConfigResponse,
    AdminLogsResponse,
    AdminRoleBody,
    AdminStatsOut,
    AdminUserListResponse,
    AuditLogItem,
    ConfigEntry,
    GroupOrganizerEntry,
    UserWithRolesOut,
)
from app.services import admin_service, audit_service

router = APIRouter(prefix="/admin", tags=["admin"])

AdminUser = Annotated[Employee, Depends(require_roles("admin", "platform_admin"))]
PlatformAdmin = Annotated[Employee, Depends(require_roles("platform_admin"))]


@router.get("/users", response_model=AdminUserListResponse)
async def admin_list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminUser,
    search: str | None = Query(None),
    role: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> AdminUserListResponse:
    _ = user
    rows, total = await admin_service.list_users(
        db, search=search, role=role, page=page, page_size=page_size
    )
    items = [
        UserWithRolesOut(
            wid=str(e.wid),
            email=e.email,
            first_name=e.first_name,
            last_name=e.last_name,
            roles=[r.role for r in e.roles],
        )
        for e in rows
    ]
    return AdminUserListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/users/{wid}/roles", status_code=status.HTTP_201_CREATED)
async def admin_add_role(
    wid: uuid.UUID,
    body: AdminRoleBody,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: PlatformAdmin,
) -> None:
    ok = await admin_service.add_user_role(db, wid, body.role)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    await audit_service.append(
        db,
        action="admin_add_role",
        detail=f"target_wid={wid} role={body.role!r}",
        actor_wid=user.wid,
    )


@router.delete("/users/{wid}/roles/{role}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_remove_role(
    wid: uuid.UUID,
    role: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: PlatformAdmin,
) -> None:
    ok = await admin_service.remove_user_role(db, wid, role)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    await audit_service.append(
        db,
        action="admin_remove_role",
        detail=f"target_wid={wid} role={role!r}",
        actor_wid=user.wid,
    )


@router.get("/access-matrix", response_model=AccessMatrixResponse)
async def access_matrix(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminUser,
) -> AccessMatrixResponse:
    _ = user
    rows = await admin_service.access_matrix(db)
    items = [
        GroupOrganizerEntry(
            group_id=g.id,
            group_name=g.name,
            organizer_wids=[str(w) for w in wids],
        )
        for g, wids in rows
    ]
    return AccessMatrixResponse(items=items)


@router.get("/logs", response_model=AdminLogsResponse)
async def admin_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminUser,
) -> AdminLogsResponse:
    _ = user
    rows = await audit_service.list_recent(db, limit=200)
    items = [
        AuditLogItem(
            id=r.id,
            action=r.action,
            detail=r.detail,
            actor_wid=str(r.actor_wid) if r.actor_wid else None,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return AdminLogsResponse(items=items)


@router.get("/config", response_model=AdminConfigResponse)
async def get_admin_config(user: AdminUser) -> AdminConfigResponse:
    _ = user
    cfg = await admin_service.get_config()
    return AdminConfigResponse(items=[ConfigEntry(key=k, value=v) for k, v in cfg.items()])


@router.patch("/config", response_model=AdminConfigResponse)
async def patch_admin_config(
    body: AdminConfigPatch,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: PlatformAdmin,
) -> AdminConfigResponse:
    merged = await admin_service.patch_config([(e.key, e.value) for e in body.entries])
    await audit_service.append(
        db,
        action="admin_config_patch",
        detail="; ".join(f"{e.key}={e.value!r}" for e in body.entries)[:2000],
        actor_wid=user.wid,
    )
    return AdminConfigResponse(items=[ConfigEntry(key=k, value=v) for k, v in merged.items()])


@router.get("/stats", response_model=AdminStatsOut)
async def admin_stats_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: AdminUser,
) -> AdminStatsOut:
    _ = user
    s = await admin_service.admin_stats(db)
    return AdminStatsOut(**s)
