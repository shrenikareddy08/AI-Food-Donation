from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_role
from app.db.postgres import get_session

from app.models.audit_log import AuditLog

from app.schemas.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/api/admin/audit-logs",
    tags=["Admin Audit Logs"]
)


# =========================================================
# GET ALL AUDIT LOGS
# =========================================================

@router.get(
    "/",
    response_model=list[AuditLogResponse]
)
async def get_audit_logs(
    current_user: dict = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# GET AUDIT LOG BY ID
# =========================================================

@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse
)
async def get_audit_log(
    audit_id: int,
    current_user: dict = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):

    result = await session.execute(
        select(AuditLog).where(
            AuditLog.audit_id == audit_id
        )
    )

    audit_log = result.scalar_one_or_none()

    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )

    return audit_log