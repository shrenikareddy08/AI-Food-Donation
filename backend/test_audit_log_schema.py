from app.schemas.audit_log import AuditLogCreate


log = AuditLogCreate(
    user_id=1,
    action="DELIVERY_CONFIRMED",
    entity_type="DONATION",
    entity_id=1,
    details="Donation delivery was confirmed successfully"
)

print("Audit log schema is working.")
print(log)