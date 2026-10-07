import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.user import User
from app.models.notification import Notification
from app.services.notification_service import create_notification


async def test_notification_service():
    async with AsyncSessionLocal() as session:

        notification = await create_notification(
            session=session,
            user_id=1,
            message="Test notification from MealBridge",
            notification_type="TEST"
        )

        await session.commit()
        await session.refresh(notification)

        print("Notification service is working.")
        print("Notification ID:", notification.notification_id)

        result = await session.execute(
            select(Notification).where(
                Notification.notification_id
                == notification.notification_id
            )
        )

        saved_notification = result.scalar_one()

        print("User ID:", saved_notification.user_id)
        print("Message:", saved_notification.message)
        print("Type:", saved_notification.notification_type)
        print("Read:", saved_notification.is_read)


if __name__ == "__main__":
    asyncio.run(test_notification_service())
