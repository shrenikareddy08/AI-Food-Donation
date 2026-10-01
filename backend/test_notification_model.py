import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.notification import Notification


async def test_notification_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Notification).limit(5)
        )

        notifications = result.scalars().all()

        print("Notification model is working.")
        print("Notifications found:", len(notifications))

        for notification in notifications:
            print(
                notification.notification_id,
                notification.user_id,
                notification.message,
                notification.notification_type,
                notification.is_read
            )


asyncio.run(test_notification_model())