from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def create_audit_log(
    session: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: str | None = None
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )

    session.add(audit_log)

    return audit_log