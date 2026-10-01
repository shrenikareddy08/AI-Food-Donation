import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.assignment import Assignment


async def test_assignment_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Assignment).limit(5)
        )

        assignments = result.scalars().all()

        print("Assignment model is working.")
        print("Assignments found:", len(assignments))

        for assignment in assignments:
            print(
                assignment.assignment_id,
                assignment.donation_id,
                assignment.ngo_id,
                assignment.volunteer_id,
                assignment.status
            )


asyncio.run(test_assignment_model())