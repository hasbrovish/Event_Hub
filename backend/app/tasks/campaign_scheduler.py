import asyncio
import logging

from app.database import AsyncSessionLocal
from app.services import campaign_service

logger = logging.getLogger(__name__)


async def campaign_scheduler_loop() -> None:
    while True:
        try:
            async with AsyncSessionLocal() as db:
                try:
                    n = await campaign_service.scheduler_tick(db)
                    await db.commit()
                    if n:
                        logger.info("Campaign scheduler processed %s campaign(s)", n)
                except Exception:
                    await db.rollback()
                    raise
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Campaign scheduler tick failed")
        await asyncio.sleep(60)
