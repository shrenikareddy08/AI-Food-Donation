from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogCreate(BaseModel):
    user_id: int
    action: str
    entity_type: str | None = None
    entity_id: int | None = None
    details: str | None = None


class AuditLogResponse(BaseModel):
    audit_id: int
    user_id: int
    action: str
    entity_type: str | None = None
    entity_id: int | None = None
    details: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)