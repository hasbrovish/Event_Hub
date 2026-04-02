import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.integrations.corporate_stubs import get_integration_status_for_health

router = APIRouter(tags=["health"])

_START_MONO = time.monotonic()


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)) -> dict:
    db_status = "error"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "unreachable"
    return {
        "status": "ok",
        "db": db_status,
        "version": "0.1.0",
        "uptime_seconds": round(time.monotonic() - _START_MONO, 3),
        "integrations": get_integration_status_for_health(),
        "admin_metrics_stub": {
            "note": "INTEGRATION_POINT_ADMIN_METRICS — replace with Prometheus/AppInsights export",
            "requests_sample": None,
            "allow_dev_login": settings.allow_dev_login,
        },
    }
