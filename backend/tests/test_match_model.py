import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.match import Match


async def test_match_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Match).limit(5)
        )

        matches = result.scalars().all()

        print("Match model is working.")
        print("Matches found:", len(matches))

        for match in matches:
            print(
                match.match_id,
                match.donation_id,
                match.ngo_id,
                match.total_score,
                match.status
            )


if __name__ == "__main__":
    asyncio.run(test_match_model())
