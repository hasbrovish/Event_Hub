from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.integrations.corporate_stubs import fetch_sub_units_for_master_data, fetch_units_for_master_data
from app.models import Employee

router = APIRouter(prefix="/master-data", tags=["master-data"])

Authenticated = Annotated[Employee, Depends(get_current_user)]

# INTEGRATION_POINT_LEX_MASTER_DATA — data from corporate_stubs (mock) or LEX client (live).


class UnitsResponse(BaseModel):
    units: list[str]


class SubUnit(BaseModel):
    id: str
    name: str
    unit: str


class SubUnitsResponse(BaseModel):
    sub_units: list[SubUnit]


@router.get("/units", response_model=UnitsResponse)
async def master_units(user: Authenticated) -> UnitsResponse:
    _ = user
    units = await fetch_units_for_master_data()
    return UnitsResponse(units=units)


@router.get("/sub-units", response_model=SubUnitsResponse)
async def master_sub_units(
    user: Authenticated,
    unit: str | None = None,
) -> SubUnitsResponse:
    _ = user
    rows = await fetch_sub_units_for_master_data(unit=unit)
    return SubUnitsResponse(sub_units=[SubUnit(**r) for r in rows])
