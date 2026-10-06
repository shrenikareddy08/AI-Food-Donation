from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(
    session: AsyncSession,
    user_id: int,
    message: str,
    notification_type: str
):
    notification = Notification(
        user_id=user_id,
        message=message,
        notification_type=notification_type,
        is_read=False
    )

    session.add(notification)

    return notification