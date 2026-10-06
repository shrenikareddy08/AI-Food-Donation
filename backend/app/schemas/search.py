from decimal import Decimal
from pydantic import BaseModel, Field


class SearchFilterParams(BaseModel):
    city: str | None = None
    food_type: str | None = None
    max_distance_km: float | None = None


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10
    similarity_threshold: float = 0.3
    filters: SearchFilterParams | None = None


class SemanticSearchItem(BaseModel):
    id: int
    entity_type: str  # 'DONATION' or 'NGO'
    title: str
    food_or_requirement: str
    quantity_or_capacity: str
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    similarity_score: float  # Cosine similarity [0.0 - 1.0]
    distance_km: float | None = None
    expiry_time: str | None = None
    status: str | None = None
    relevance_explanation: str | None = None


class SemanticSearchResponse(BaseModel):
    query: str
    total_results: int
    execution_time_ms: float
    results: list[SemanticSearchItem]
