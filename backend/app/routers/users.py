from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import get_current_user, require_role
from app.db.postgres import AsyncSessionLocal
from app.models.user import User
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(
                User.user_id == current_user["user_id"]
            )
        )

        user = result.scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return user


@router.get(
    "/",
    response_model=list[UserResponse]
)
async def get_all_users(
    current_user: dict = Depends(require_role("ADMIN"))
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).order_by(User.user_id)
        )

        return result.scalars().all()