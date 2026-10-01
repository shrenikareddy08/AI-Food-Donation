import asyncio
from getpass import getpass

from sqlalchemy import select, update

from app.core.security import hash_password
from app.db.postgres import AsyncSessionLocal
from app.models.user import User


async def migrate_passwords():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User.user_id, User.email)
            .order_by(User.user_id)
        )

        users = result.all()

        for user_id, email in users:
            print(f"\nUser: {email}")

            password = getpass("Enter new password: ")
            confirm_password = getpass("Confirm new password: ")

            if password != confirm_password:
                print("Passwords do not match. Try again.")
                continue

            if len(password) < 8:
                print("Password must contain at least 8 characters.")
                continue

            hashed_password = hash_password(password)

            await session.execute(
                update(User)
                .where(User.user_id == user_id)
                .values(password=hashed_password)
            )

        await session.commit()

    print("\nPassword migration completed.")


asyncio.run(migrate_passwords())