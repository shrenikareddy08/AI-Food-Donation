import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.donation import Donation


async def test_donation_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Donation).limit(5)
        )

        donations = result.scalars().all()

        print("Donation model is working.")
        print("Donations found:", len(donations))

        for donation in donations:
            print(
                donation.donation_id,
                donation.food_name,
                donation.quantity,
                donation.status
            )


if __name__ == "__main__":
    asyncio.run(test_donation_model())
