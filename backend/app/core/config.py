from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "food_donation_db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "mini@2007"

    MONGO_URL: str = "mongodb://mealbridge-mongo:27017/mealbridge_auth"
    MONGO_DB: str = "mealbridge_auth"

    JWT_SECRET_KEY: str = "mealbridge-secret-key-change-this"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    OTP_HASH_SECRET: str = "mealbridge-otp-secret-change-this"

    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "no-reply@mealbridge.org"

    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=["backend/.env", ".env"],
        extra="ignore"
    )


settings = Settings()