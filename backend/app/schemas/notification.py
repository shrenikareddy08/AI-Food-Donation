from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    user_id: int
    message: str
    notification_type: str | None = None


class NotificationResponse(BaseModel):
    notification_id: int
    user_id: int
    message: str
    notification_type: str | None = None
    is_read: bool | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class NotificationReadUpdate(BaseModel):
    is_read: bool = True