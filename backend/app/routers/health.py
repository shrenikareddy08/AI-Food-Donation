import time
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from sqlalchemy import text

from app.db.mongo import mongo_db
from app.db.postgres import AsyncSessionLocal

router = APIRouter(
    tags=["Observability & System Health"]
)

START_TIME = time.time()


@router.get("/health")
async def health_check():
    """System health check verifying PostgreSQL and MongoDB connectivity."""
    status_report = {
        "status": "UP",
        "service": "MealBridge AI Backend",
        "version": "2.0.0",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "databases": {}
    }

    # 1. Check PostgreSQL
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        status_report["databases"]["postgresql"] = "HEALTHY"
    except Exception as e:
        status_report["databases"]["postgresql"] = f"UNHEALTHY ({str(e)[:50]})"
        status_report["status"] = "DEGRADED"

    # 2. Check MongoDB
    try:
        await mongo_db.command("ping")
        status_report["databases"]["mongodb"] = "HEALTHY"
    except Exception as e:
        status_report["databases"]["mongodb"] = f"UNHEALTHY ({str(e)[:50]})"
        # Mongo is secondary, don't degrade completely if offline in local dev

    return status_report


@router.get("/metrics", response_class=PlainTextResponse)
def prometheus_metrics():
    """CO6 Observability: Basic Prometheus plain-text metrics exporter."""
    uptime = time.time() - START_TIME
    metrics = [
        "# HELP mealbridge_uptime_seconds Total runtime of MealBridge backend in seconds",
        "# TYPE mealbridge_uptime_seconds gauge",
        f"mealbridge_uptime_seconds {uptime:.2f}",
        "# HELP mealbridge_service_up Status of MealBridge service",
        "# TYPE mealbridge_service_up gauge",
        "mealbridge_service_up 1"
    ]
    return "\n".join(metrics) + "\n"
