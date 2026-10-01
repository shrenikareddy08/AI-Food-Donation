import asyncio
from sqlalchemy import text
from app.db.postgres import engine


async def test_connection():
    async with engine.connect() as connection:
        result = await connection.execute(
            text("SELECT current_database()")
        )
        print("Connected database:", result.scalar())


asyncio.run(test_connection())