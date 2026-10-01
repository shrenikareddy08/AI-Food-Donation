from urllib.parse import quote_plus

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)

from app.core.config import settings


# ---------------------------------------------------------
# GET DATABASE URL
# ---------------------------------------------------------

database_url = getattr(settings, "DATABASE_URL", None)

if not database_url:
    database_url = getattr(settings, "POSTGRES_DATABASE_URL", None)

if not database_url:

    postgres_user = getattr(settings, "POSTGRES_USER", "postgres")
    postgres_password = getattr(settings, "POSTGRES_PASSWORD", "")
    postgres_host = getattr(settings, "POSTGRES_HOST", "localhost")
    postgres_port = getattr(settings, "POSTGRES_PORT", 5432)
    postgres_db = getattr(
        settings,
        "POSTGRES_DB",
        "food_donation_db"
    )

    encoded_password = quote_plus(str(postgres_password))

    database_url = (
        f"postgresql+asyncpg://"
        f"{postgres_user}:{encoded_password}@"
        f"{postgres_host}:{postgres_port}/"
        f"{postgres_db}"
    )


# ---------------------------------------------------------
# DATABASE ENGINE
# ---------------------------------------------------------

engine = create_async_engine(
    database_url,
    echo=False,
    pool_pre_ping=True
)


# ---------------------------------------------------------
# ASYNC SESSION
# ---------------------------------------------------------

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# ---------------------------------------------------------
# DATABASE SESSION DEPENDENCY
# ---------------------------------------------------------

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session