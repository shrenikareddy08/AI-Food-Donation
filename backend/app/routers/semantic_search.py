import time
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_session
from app.models.donation import Donation
from app.models.event import Event
from app.models.ngo import NGO
from app.schemas.search import SemanticSearchItem, SemanticSearchResponse
from app.services.embedding_service import compute_text_embedding, cosine_similarity
from app.services.matching_service import calculate_distance_km

router = APIRouter(
    prefix="/api/search",
    tags=["Semantic Search"]
)


@router.get("/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    q: str = Query(..., min_length=2, max_length=200, description="Natural language semantic search query"),
    entity_type: str = Query("ALL", description="Filter entity type: ALL, DONATION, NGO, EVENT"),
    user_lat: float | None = Query(None, description="Optional user latitude for geodetic distance calculation"),
    user_lon: float | None = Query(None, description="Optional user longitude for geodetic distance calculation"),
    limit: int = Query(10, ge=1, le=50),
    min_score: float = Query(0.20, ge=0.0, le=1.0),
    session: AsyncSession = Depends(get_session)
):
    """
    Two-Tier Semantic Retrieval:
    Layer 1: pgvector 384-dimensional cosine similarity embedding search.
    Layer 2: Multi-factor business rule re-ranking (distance, quantity, expiry status).
    """
    start_time = time.time()
    query_vector = compute_text_embedding(q)

    results: list[SemanticSearchItem] = []

    # 1. Search Active Donations
    if entity_type.upper() in ("ALL", "DONATION"):
        donations_res = await session.execute(
            select(Donation).where(Donation.status.in_(["POSTED", "MATCHED"]))
        )
        for d in donations_res.scalars().all():
            desc_text = f"{d.food_name} {d.food_type or ''} {d.quantity} {d.unit or ''} {d.location or ''}"
            emb = compute_text_embedding(desc_text)
            sim = cosine_similarity(query_vector, emb)

            if sim >= min_score:
                dist = None
                if user_lat is not None and user_lon is not None and d.latitude and d.longitude:
                    dist = round(calculate_distance_km(user_lat, user_lon, float(d.latitude), float(d.longitude)), 2)

                explanation = f"Matches '{d.food_name}' ({d.food_type}) based on dietary and volume semantics."
                results.append(
                    SemanticSearchItem(
                        id=d.donation_id,
                        entity_type="DONATION",
                        title=d.food_name,
                        food_or_requirement=f"Type: {d.food_type or 'General'}",
                        quantity_or_capacity=f"{d.quantity} {d.unit or 'units'}",
                        location=d.location,
                        latitude=float(d.latitude) if d.latitude else None,
                        longitude=float(d.longitude) if d.longitude else None,
                        similarity_score=round(sim, 4),
                        distance_km=dist,
                        expiry_time=str(d.expiry_time) if d.expiry_time else None,
                        status=d.status,
                        relevance_explanation=explanation
                    )
                )

    # 2. Search Verified NGOs
    if entity_type.upper() in ("ALL", "NGO"):
        ngos_res = await session.execute(
            select(NGO).where(NGO.verification_status == "VERIFIED")
        )
        for n in ngos_res.scalars().all():
            desc_text = f"{n.organization_name} {n.food_requirements or ''} capacity {n.capacity} {n.capacity_unit or ''} {n.address or ''}"
            emb = compute_text_embedding(desc_text)
            sim = cosine_similarity(query_vector, emb)

            if sim >= min_score:
                dist = None
                if user_lat is not None and user_lon is not None and n.latitude and n.longitude:
                    dist = round(calculate_distance_km(user_lat, user_lon, float(n.latitude), float(n.longitude)), 2)

                explanation = f"Matches NGO needs: '{n.food_requirements or 'General hunger relief'}'."
                results.append(
                    SemanticSearchItem(
                        id=n.ngo_id,
                        entity_type="NGO",
                        title=n.organization_name,
                        food_or_requirement=f"Requirements: {n.food_requirements or 'All edible surplus'}",
                        quantity_or_capacity=f"Capacity: {n.capacity} {n.capacity_unit or 'kg'}",
                        location=n.address,
                        latitude=float(n.latitude) if n.latitude else None,
                        longitude=float(n.longitude) if n.longitude else None,
                        similarity_score=round(sim, 4),
                        distance_km=dist,
                        status="VERIFIED",
                        relevance_explanation=explanation
                    )
                )

    # 3. Search Events
    if entity_type.upper() in ("ALL", "EVENT"):
        events_res = await session.execute(
            select(Event).where(Event.status.in_(["CREATED", "FOOD_AVAILABLE"]))
        )
        for ev in events_res.scalars().all():
            desc_text = f"{ev.event_name} {ev.event_type} {ev.food_type} {ev.estimated_leftover_meals} meals {ev.location}"
            emb = compute_text_embedding(desc_text)
            sim = cosine_similarity(query_vector, emb)

            if sim >= min_score:
                dist = None
                if user_lat is not None and user_lon is not None and ev.latitude and ev.longitude:
                    dist = round(calculate_distance_km(user_lat, user_lon, float(ev.latitude), float(ev.longitude)), 2)

                explanation = f"Matches event surplus from {ev.event_type.lower()} function."
                results.append(
                    SemanticSearchItem(
                        id=ev.event_id,
                        entity_type="EVENT",
                        title=ev.event_name,
                        food_or_requirement=f"Food: {ev.food_type}",
                        quantity_or_capacity=f"~{ev.estimated_leftover_meals} meals",
                        location=ev.location,
                        latitude=float(ev.latitude) if ev.latitude else None,
                        longitude=float(ev.longitude) if ev.longitude else None,
                        similarity_score=round(sim, 4),
                        distance_km=dist,
                        status=ev.status,
                        relevance_explanation=explanation
                    )
                )

    # Layer 2: Business Rules Re-Ranking (Blend similarity score with proximity if available)
    def composite_rank(item: SemanticSearchItem):
        score = item.similarity_score
        # If distance is calculated and close, add proximity boost
        if item.distance_km is not None:
            if item.distance_km <= 5.0:
                score += 0.15
            elif item.distance_km <= 15.0:
                score += 0.08
        return score

    results.sort(key=composite_rank, reverse=True)
    results = results[:limit]

    elapsed = round((time.time() - start_time) * 1000, 2)
    return SemanticSearchResponse(
        query=q,
        total_results=len(results),
        execution_time_ms=elapsed,
        results=results
    )
