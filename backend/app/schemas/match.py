from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# CREATE MATCH
# =========================================================

class MatchCreate(BaseModel):
    donation_id: int
    ngo_id: int


# =========================================================
# UPDATE MATCH STATUS
# =========================================================

class MatchStatusUpdate(BaseModel):
    status: str


# =========================================================
# MATCH RESPONSE
# =========================================================

class MatchResponse(BaseModel):
    match_id: int
    donation_id: int
    ngo_id: int

    location_score: float | None = None
    quantity_score: float | None = None
    expiry_score: float | None = None
    capacity_score: float | None = None
    requirement_score: float | None = None
    total_score: float | None = None

    status: str | None = None
    matched_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )