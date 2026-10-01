import asyncio
from app.db.mongo import client, mongo_db


async def test_connection():
    result = await client.admin.command("ping")
    print("MongoDB connection:", result)
    print("MongoDB database:", mongo_db.name)

    await client.close()


asyncio.run(test_connection())