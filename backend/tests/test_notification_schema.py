from app.schemas.notification import NotificationCreate


notification = NotificationCreate(
    user_id=1,
    message="Your food donation has been successfully delivered.",
    notification_type="DELIVERY_COMPLETED"
)

print("Notification schema is working.")
print(notification)