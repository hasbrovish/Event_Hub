from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models import Employee, EmployeeRole, Preference

DEV_EMAIL_NAMESPACE = uuid.UUID("6ba7b811-9dad-11d1-80b4-00c04fd430c8")
ALLOWED_ROLES = frozenset({"audience", "speaker", "organizer", "admin", "platform_admin"})


def stable_wid_for_email(email: str) -> uuid.UUID:
    return uuid.uuid5(DEV_EMAIL_NAMESPACE, email.strip().lower())


def create_access_token(*, subject_wid: uuid.UUID, roles: list[str]) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(subject_wid),
        "roles": roles,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def parse_bearer_sub(token: str) -> uuid.UUID | None:
    try:
        data = decode_token(token)
        sub = data.get("sub")
        if not sub:
            return None
        return uuid.UUID(str(sub))
    except (JWTError, ValueError):
        return None


async def get_employee_by_wid(db: AsyncSession, wid: uuid.UUID) -> Employee | None:
    stmt = (
        select(Employee)
        .options(selectinload(Employee.roles))
        .where(Employee.wid == wid, Employee.is_active.is_(True))
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def ensure_dev_employee(
    db: AsyncSession,
    *,
    email: str,
    first_name: str,
    last_name: str,
    roles: list[str],
) -> Employee:
    wid = stable_wid_for_email(email)
    normalized_roles = [r for r in dict.fromkeys(roles) if r in ALLOWED_ROLES]
    if not normalized_roles:
        normalized_roles = ["audience"]

    emp = await get_employee_by_wid(db, wid)
    if emp is None:
        emp = Employee(
            wid=wid,
            source_id=None,
            first_name=first_name,
            last_name=last_name,
            email=email.lower(),
        )
        db.add(emp)
        await db.flush()
        for r in normalized_roles:
            db.add(EmployeeRole(employee_wid=wid, role=r))
        db.add(Preference(employee_wid=wid))
    else:
        emp.first_name = first_name
        emp.last_name = last_name
        existing = {row.role for row in emp.roles}
        for r in normalized_roles:
            if r not in existing:
                db.add(EmployeeRole(employee_wid=wid, role=r))
        pref = (await db.execute(select(Preference).where(Preference.employee_wid == wid))).scalar_one_or_none()
        if pref is None:
            db.add(Preference(employee_wid=wid))
    await db.flush()
    await db.refresh(emp, ["roles"])
    return emp
