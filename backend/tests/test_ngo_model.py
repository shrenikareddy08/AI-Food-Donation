import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.ngo import NGO


async def test_ngo_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(NGO).limit(5)
        )

        ngos = result.scalars().all()

        print("NGO model is working.")
        print("NGOs found:", len(ngos))

        for ngo in ngos:
            print(
                ngo.ngo_id,
                ngo.organization_name,
                ngo.capacity,
                ngo.verification_status
            )


if __name__ == "__main__":
    asyncio.run(test_ngo_model())
