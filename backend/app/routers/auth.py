from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Employee
from app.schemas.auth import DevLoginRequest, EmployeeMeResponse, LoginResponse, SSOLoginRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login_dev(
    req: DevLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """Local / hackathon login. Production will add Infosys SSO on `/auth/login/sso`."""
    if not settings.allow_dev_login:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Dev login disabled")
    emp = await auth_service.ensure_dev_employee(
        db,
        email=str(req.email),
        first_name=req.first_name,
        last_name=req.last_name,
        roles=req.roles,
    )
    roles = [r.role for r in emp.roles]
    token = auth_service.create_access_token(subject_wid=emp.wid, roles=roles)
    return LoginResponse(
        access_token=token,
        user=EmployeeMeResponse(
            wid=str(emp.wid),
            email=emp.email,
            first_name=emp.first_name,
            last_name=emp.last_name,
            roles=roles,
        ),
    )


@router.post("/login/sso")
async def login_sso(_: SSOLoginRequest) -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Infosys SSO session exchange not implemented yet.",
    )


@router.get("/me", response_model=EmployeeMeResponse)
async def me(user: Annotated[Employee, Depends(get_current_user)]) -> EmployeeMeResponse:
    return EmployeeMeResponse(
        wid=str(user.wid),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        roles=[r.role for r in user.roles],
    )
