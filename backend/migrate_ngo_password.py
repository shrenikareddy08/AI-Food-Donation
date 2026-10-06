import asyncio
from getpass import getpass

from sqlalchemy import update

from app.core.security import hash_password
from app.db.postgres import AsyncSessionLocal
from app.models.user import User


async def migrate_ngo_password():
    password = getpass("Enter new password for helpinghands@gmail.com: ")
    confirm_password = getpass("Confirm new password: ")

    if password != confirm_password:
        print("Passwords do not match.")
        return

    if len(password) < 8:
        print("Password must contain at least 8 characters.")
        return

    hashed_password = hash_password(password)

    async with AsyncSessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.email == "helpinghands@gmail.com")
            .values(password=hashed_password)
        )

        await session.commit()

    print("NGO password migration completed.")


asyncio.run(migrate_ngo_password())