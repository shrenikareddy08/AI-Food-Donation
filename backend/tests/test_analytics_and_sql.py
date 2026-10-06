import pytest
from app.routers.analytics_sql import (
    DONATION_RANKINGS_SQL,
    NGO_FULFILLMENT_SQL,
    AVAILABLE_DONATIONS_VIEW_SQL,
    NGO_CAPACITY_VIEW_SQL
)


def test_sql_cte_and_window_functions_in_queries():
    # Verify CO1 syllabus requirements in donation rankings
    assert "WITH ActiveDonationCTE AS" in DONATION_RANKINGS_SQL
    assert "DENSE_RANK() OVER (ORDER BY expiry_time ASC)" in DONATION_RANKINGS_SQL
    assert "ROW_NUMBER() OVER (PARTITION BY food_type ORDER BY quantity DESC)" in DONATION_RANKINGS_SQL
    assert "SUM(quantity) OVER (PARTITION BY food_type)" in DONATION_RANKINGS_SQL

    # Verify CO1 syllabus requirements in NGO fulfillment leaderboard
    assert "WITH NgoMetricsCTE AS" in NGO_FULFILLMENT_SQL
    assert "LEFT JOIN public.matches" in NGO_FULFILLMENT_SQL
    assert "LEFT JOIN public.assignments" in NGO_FULFILLMENT_SQL
    assert "COUNT(CASE WHEN" in NGO_FULFILLMENT_SQL
    assert "DENSE_RANK() OVER (ORDER BY completed_deliveries DESC" in NGO_FULFILLMENT_SQL

    # Verify database view query syntax
    assert "v_available_donations" in AVAILABLE_DONATIONS_VIEW_SQL
    assert "v_ngo_capacity_summary" in NGO_CAPACITY_VIEW_SQL
