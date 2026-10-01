from app.schemas.delivery_confirmation import DeliveryConfirmationCreate


confirmation = DeliveryConfirmationCreate(
    donation_id=1,
    ngo_id=1,
    volunteer_id=1,
    verification_method="PHOTO",
    remarks="Food received successfully"
)

print("Delivery confirmation schema is working.")
print(confirmation)