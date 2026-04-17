"""Insert sample events if the database is empty. Run from `backend/`:

    python -m scripts.seed_demo_events

Requires PostgreSQL, migrations applied, and dependencies installed.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.database import AsyncSessionLocal
from app.models import Event, EventSession
from app.services.auth_service import ensure_dev_employee


async def main() -> None:
    async with AsyncSessionLocal() as db:
        emp = await ensure_dev_employee(
            db,
            email="demo.seed@example.com",
            first_name="Demo",
            last_name="Seed",
            roles=["speaker", "organizer", "audience", "admin"],
        )
        n = await db.scalar(select(func.count()).select_from(Event))
        if n and n > 0:
            await db.commit()
            print("Events already present; skipped seed.")
            return

        now = datetime.now(timezone.utc)
        ev1_id = uuid.uuid4()
        start1 = now + timedelta(days=5)
        end1 = start1 + timedelta(hours=2)
        db.add(
            Event(
                id=ev1_id,
                title="AI & Machine Learning Workshop",
                description="Hands-on ML patterns and deployment basics.",
                event_type="Technology",
                tags=["AI", "ML", "Workshop"],
                delivery_method="Virtual",
                start_date=start1,
                end_date=end1,
                venue_name="MS Teams",
                slots=150,
                status="Active",
                visibility="org-wide",
                created_by=emp.wid,
            )
        )
        db.add(
            EventSession(
                event_id=ev1_id,
                session_order=1,
                topic="Introduction to practical ML",
                topic_brief="End-to-end model lifecycle",
                start_datetime=start1,
                duration_minutes=120,
                speaker_wid=emp.wid,
                speaker_name=f"{emp.first_name} {emp.last_name}",
                speaker_title="Demo Speaker",
            )
        )

        ev2_id = uuid.uuid4()
        start2 = now + timedelta(days=9)
        end2 = start2 + timedelta(hours=1)
        db.add(
            Event(
                id=ev2_id,
                title="Wellness: Yoga & Mindfulness",
                description="A short session for focus and stress relief.",
                event_type="Health",
                tags=["Wellness", "Yoga"],
                delivery_method="Physical",
                start_date=start2,
                end_date=end2,
                venue_name="Wellness Center",
                slots=40,
                status="Active",
                visibility="org-wide",
                created_by=emp.wid,
            )
        )
        db.add(
            EventSession(
                event_id=ev2_id,
                session_order=1,
                topic="Mindful breathing",
                topic_brief=None,
                start_datetime=start2,
                duration_minutes=45,
                speaker_wid=emp.wid,
                speaker_name="Guest Instructor",
                speaker_title="Wellness Coach",
            )
        )

        await db.commit()
        print("Seeded demo employee demo.seed@example.com and 2 active events.")


if __name__ == "__main__":
    asyncio.run(main())
