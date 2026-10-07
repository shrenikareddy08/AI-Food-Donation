import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.volunteer import Volunteer


async def test_volunteer_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Volunteer).limit(5)
        )

        volunteers = result.scalars().all()

        print("Volunteer model is working.")
        print("Volunteers found:", len(volunteers))

        for volunteer in volunteers:
            print(
                volunteer.volunteer_id,
                volunteer.user_id,
                volunteer.availability,
                volunteer.vehicle_type
            )


if __name__ == "__main__":
    asyncio.run(test_volunteer_model())
