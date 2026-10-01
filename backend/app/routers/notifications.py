from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import get_current_user
from app.db.postgres import AsyncSessionLocal
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationReadUpdate,
    NotificationResponse,
)


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)


@router.get(
    "/me",
    response_model=list[NotificationResponse]
)
async def get_my_notifications(
    current_user: dict = Depends(get_current_user)
):
    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Notification)
            .where(
                Notification.user_id == current_user["user_id"]
            )
            .order_by(
                Notification.notification_id.desc()
            )
        )

        return result.scalars().all()


@router.put(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
async def mark_notification_as_read(
    notification_id: int,
    data: NotificationReadUpdate,
    current_user: dict = Depends(get_current_user)
):
    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Notification).where(
                Notification.notification_id == notification_id
            )
        )

        notification = result.scalar_one_or_none()

        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )

        if notification.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot modify this notification"
            )

        notification.is_read = data.is_read

        await session.commit()
        await session.refresh(notification)

        return notification


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse
)
async def get_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    async with AsyncSessionLocal() as session:

        result = await session.execute(
            select(Notification).where(
                Notification.notification_id == notification_id
            )
        )

        notification = result.scalar_one_or_none()

        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )

        if notification.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot view this notification"
            )

        return notification