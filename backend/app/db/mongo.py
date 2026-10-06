from pymongo import AsyncMongoClient
from app.core.config import settings


client = AsyncMongoClient(settings.MONGO_URL)

mongo_db = client[settings.MONGO_DB]

otp_collection = mongo_db["otp_records"]