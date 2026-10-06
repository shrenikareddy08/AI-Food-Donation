import asyncio

from sqlalchemy import select

from app.db.postgres import AsyncSessionLocal
from app.models.audit_log import AuditLog


async def test_audit_log_model():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(AuditLog).limit(5)
        )

        logs = result.scalars().all()

        print("Audit log model is working.")
        print("Audit logs found:", len(logs))

        for log in logs:
            print(
                log.audit_id,
                log.user_id,
                log.action,
                log.entity_type,
                log.entity_id
            )


if __name__ == \"__main__\":
    asyncio.run(test_audit_log_model())
