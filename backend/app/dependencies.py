from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Employee
from app.services import auth_service

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    db: Annotated[AsyncSession, Depends(get_db)],
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> Employee | None:
    if creds is None or creds.scheme.lower() != "bearer":
        return None
    wid = auth_service.parse_bearer_sub(creds.credentials)
    if wid is None:
        return None
    return await auth_service.get_employee_by_wid(db, wid)


async def get_current_user(
    user: Annotated[Employee | None, Depends(get_current_user_optional)],
) -> Employee:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def require_roles(*allowed: str):
    allowed_set = frozenset(allowed)

    async def _inner(user: Annotated[Employee, Depends(get_current_user)]) -> Employee:
        user_roles = {r.role for r in user.roles}
        if not user_roles & allowed_set:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return _inner
