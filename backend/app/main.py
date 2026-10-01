from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    users,
    donations,
    ngos,
    volunteers,
    matches,
    assignments,
    delivery_confirmations,
    delivery_tracking,
    notifications,
    admin,
    audit_logs
)


app = FastAPI(
    title="MealBridge API",
    version="0.1.0"
)


# =========================================================
# CORS
# =========================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "http://localhost:3000",
    "http://127.0.0.1:3000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(donations.router)
app.include_router(ngos.router)
app.include_router(volunteers.router)
app.include_router(matches.router)
app.include_router(assignments.router)
app.include_router(delivery_confirmations.router)
app.include_router(delivery_tracking.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(audit_logs.router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "MealBridge API is running"
    }