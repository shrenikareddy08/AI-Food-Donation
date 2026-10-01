import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.delivery_confirmation import DeliveryConfirmation


async def test_delivery_confirmation_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(DeliveryConfirmation).limit(5)
        )

        confirmations = result.scalars().all()

        print("Delivery confirmation model is working.")
        print("Confirmations found:", len(confirmations))

        for confirmation in confirmations:
            print(
                confirmation.confirmation_id,
                confirmation.donation_id,
                confirmation.ngo_id,
                confirmation.volunteer_id,
                confirmation.verification_method
            )


asyncio.run(test_delivery_confirmation_model())