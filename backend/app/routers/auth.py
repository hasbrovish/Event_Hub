from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Employee
from app.schemas.auth import (
    DevLoginRequest,
    EmployeeMeResponse,
    LoginResponse,
    RefreshTokenRequest,
    SSOLoginRequest,
    TokenResponse,
)
from app.integrations.corporate_stubs import parse_mock_sso_bootstrap
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
    refresh = auth_service.create_refresh_token(subject_wid=emp.wid, roles=roles)
    return LoginResponse(
        access_token=token,
        refresh_token=refresh,
        user=EmployeeMeResponse(
            wid=str(emp.wid),
            email=emp.email,
            first_name=emp.first_name,
            last_name=emp.last_name,
            roles=roles,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    body: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    wid = auth_service.parse_refresh_sub(body.refresh_token)
    if wid is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    emp = await auth_service.get_employee_by_wid(db, wid)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    roles = [r.role for r in emp.roles]
    access = auth_service.create_access_token(subject_wid=emp.wid, roles=roles)
    new_refresh = auth_service.create_refresh_token(subject_wid=emp.wid, roles=roles)
    return TokenResponse(access_token=access, refresh_token=new_refresh)


@router.post("/login/sso", response_model=LoginResponse)
async def login_sso(
    req: SSOLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """
    INTEGRATION_POINT_INFOSYS_SSO
    Production: validate Infosys session cookie / token → upsert Employee → JWT.

    Demo: set INTEGRATION_MOCK_SSO_LOGIN=true and pass session_cookie:
      mock_sso|user@example.com|audience,governance|First|Last
    See corporate_stubs.parse_mock_sso_bootstrap and planning/MASTER_FINAL_PLAN.md
    """
    if settings.integration_mock_sso_login:
        profile = parse_mock_sso_bootstrap(req.session_cookie)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mock SSO cookie (expected mock_sso|email|roles|first|last)",
            )
        emp = await auth_service.ensure_dev_employee(
            db,
            email=profile.email,
            first_name=profile.first_name,
            last_name=profile.last_name,
            roles=profile.roles,
        )
        roles = [r.role for r in emp.roles]
        token = auth_service.create_access_token(subject_wid=emp.wid, roles=roles)
        refresh = auth_service.create_refresh_token(subject_wid=emp.wid, roles=roles)
        return LoginResponse(
            access_token=token,
            refresh_token=refresh,
            user=EmployeeMeResponse(
                wid=str(emp.wid),
                email=emp.email,
                first_name=emp.first_name,
                last_name=emp.last_name,
                roles=roles,
            ),
        )
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Infosys SSO session exchange not implemented; enable INTEGRATION_MOCK_SSO_LOGIN for demo.",
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
