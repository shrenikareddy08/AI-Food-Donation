from pydantic import BaseModel


# =========================================================
# NGO VERIFICATION UPDATE
# =========================================================

class NGOVerificationUpdate(BaseModel):
    verification_status: str


# =========================================================
# ADMIN DASHBOARD RESPONSE
# =========================================================

class AdminDashboardResponse(BaseModel):
    total_users: int
    total_donations: int
    posted_donations: int
    delivered_donations: int

    total_ngos: int
    verified_ngos: int

    total_volunteers: int
    available_volunteers: int

    total_matches: int
    pending_matches: int

    total_assignments: int
    active_assignments: int
    completed_assignments: int

    total_confirmations: int