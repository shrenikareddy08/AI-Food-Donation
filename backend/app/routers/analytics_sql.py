from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_session

router = APIRouter(
    prefix="/api/analytics",
    tags=["CO1 Advanced SQL Analytics"]
)

DONATION_RANKINGS_SQL = """
    WITH ActiveDonationCTE AS (
        SELECT 
            d.donation_id,
            d.food_name,
            d.food_type,
            d.quantity,
            d.unit,
            d.location,
            d.expiry_time,
            d.created_at,
            u.name AS donor_name
        FROM public.donations d
        INNER JOIN public.users u ON d.donor_id = u.user_id
        WHERE d.status IN ('POSTED', 'MATCHED')
    )
    SELECT 
        donation_id,
        food_name,
        food_type,
        quantity,
        unit,
        location,
        donor_name,
        expiry_time,
        DENSE_RANK() OVER (ORDER BY expiry_time ASC) AS urgency_rank,
        ROW_NUMBER() OVER (PARTITION BY food_type ORDER BY quantity DESC) AS type_quantity_rank,
        SUM(quantity) OVER (PARTITION BY food_type) AS total_quantity_by_type
    FROM ActiveDonationCTE
    ORDER BY urgency_rank ASC;
"""

NGO_FULFILLMENT_SQL = """
    WITH NgoMetricsCTE AS (
        SELECT 
            n.ngo_id,
            n.organization_name,
            n.capacity,
            n.capacity_unit,
            COUNT(m.match_id) AS total_matches,
            COUNT(CASE WHEN m.status = 'ACCEPTED' THEN 1 END) AS accepted_matches,
            COUNT(a.assignment_id) AS total_assignments,
            COUNT(CASE WHEN a.status = 'DELIVERED' THEN 1 END) AS completed_deliveries
        FROM public.ngos n
        LEFT JOIN public.matches m ON n.ngo_id = m.ngo_id
        LEFT JOIN public.assignments a ON n.ngo_id = a.ngo_id
        WHERE n.verification_status = 'VERIFIED'
        GROUP BY n.ngo_id, n.organization_name, n.capacity, n.capacity_unit
    )
    SELECT 
        ngo_id,
        organization_name,
        capacity,
        capacity_unit,
        total_matches,
        accepted_matches,
        total_assignments,
        completed_deliveries,
        ROUND(
            CASE WHEN total_matches > 0 
                 THEN (accepted_matches::NUMERIC / total_matches::NUMERIC) * 100 
                 ELSE 0.0 
            END, 2
        ) AS acceptance_rate_pct,
        DENSE_RANK() OVER (ORDER BY completed_deliveries DESC, capacity DESC) AS leaderboard_rank
    FROM NgoMetricsCTE
    ORDER BY leaderboard_rank ASC;
"""

AVAILABLE_DONATIONS_VIEW_SQL = "SELECT * FROM public.v_available_donations ORDER BY hours_until_expiry ASC;"
NGO_CAPACITY_VIEW_SQL = "SELECT * FROM public.v_ngo_capacity_summary ORDER BY completed_deliveries DESC;"


@router.get("/donation-rankings")
async def get_donation_rankings_with_window_functions(
    session: AsyncSession = Depends(get_session)
):
    """
    CO1 Demonstration: Common Table Expressions (CTEs) + Window Functions
    - Computes dense rank by expiry urgency
    - Partitions row number by food type
    """
    sql = text(DONATION_RANKINGS_SQL)

    result = await session.execute(sql)
    rows = result.mappings().all()
    return {
        "description": "CO1 SQL CTE & Window Functions: Urgency Ranking & Category Aggregates",
        "total_records": len(rows),
        "rankings": [dict(r) for r in rows]
    }


@router.get("/ngo-fulfillment-leaderboard")
async def get_ngo_fulfillment_leaderboard(
    session: AsyncSession = Depends(get_session)
):
    """
    CO1 Demonstration: Multi-table LEFT JOINs, Aggregates, GROUP BY, HAVING & CTE
    - Summarizes verified NGOs, calculates acceptance rates and completed deliveries.
    """
    sql = text(NGO_FULFILLMENT_SQL)

    result = await session.execute(sql)
    rows = result.mappings().all()
    return {
        "description": "CO1 SQL Aggregates, CTE & Window Functions: NGO Fulfillment Leaderboard",
        "total_records": len(rows),
        "leaderboard": [dict(r) for r in rows]
    }


@router.get("/views/available-donations")
async def get_available_donations_view(
    session: AsyncSession = Depends(get_session)
):
    """
    CO1 Demonstration: Querying PostgreSQL Database View (v_available_donations)
    """
    sql = text("SELECT * FROM public.v_available_donations ORDER BY hours_until_expiry ASC;")
    result = await session.execute(sql)
    rows = result.mappings().all()
    return {
        "view_name": "v_available_donations",
        "description": "Database view summarizing active surplus food with computed expiry windows",
        "count": len(rows),
        "data": [dict(r) for r in rows]
    }


@router.get("/views/ngo-summary")
async def get_ngo_capacity_summary_view(
    session: AsyncSession = Depends(get_session)
):
    """
    CO1 Demonstration: Querying PostgreSQL Database View (v_ngo_capacity_summary)
    """
    sql = text("SELECT * FROM public.v_ngo_capacity_summary ORDER BY completed_deliveries DESC;")
    result = await session.execute(sql)
    rows = result.mappings().all()
    return {
        "view_name": "v_ngo_capacity_summary",
        "description": "Database view aggregating NGO capacity and delivery operations",
        "count": len(rows),
        "data": [dict(r) for r in rows]
    }
