import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.user import User


async def test_user_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).limit(5)
        )

        users = result.scalars().all()

        print("User model is working.")
        print("Users found:", len(users))

        for user in users:
            print(
                user.user_id,
                user.name,
                user.email,
                user.role
            )


asyncio.run(test_user_model())