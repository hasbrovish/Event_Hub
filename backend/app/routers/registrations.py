from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Employee
from app.schemas.registration import MyRegistrationEntry, MyRegistrationsResponse
from app.services import registration_service

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.get("/me", response_model=MyRegistrationsResponse)
async def my_registrations(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Employee, Depends(get_current_user)],
) -> MyRegistrationsResponse:
    rows = await registration_service.list_my_registrations(db, user)
    items = [
        MyRegistrationEntry(registration_id=rid, registration_status=st, event=item)
        for rid, st, item in rows
    ]
    return MyRegistrationsResponse(items=items)
