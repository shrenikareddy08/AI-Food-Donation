import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.delivery_tracking import DeliveryTracking


async def test_delivery_tracking_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(DeliveryTracking).limit(5)
        )

        tracking_records = result.scalars().all()

        print("Delivery tracking model is working.")
        print("Tracking records found:", len(tracking_records))

        for tracking in tracking_records:
            print(
                tracking.tracking_id,
                tracking.assignment_id,
                tracking.volunteer_id,
                tracking.latitude,
                tracking.longitude,
                tracking.status
            )


if __name__ == \"__main__\":
    asyncio.run(test_delivery_tracking_model())
