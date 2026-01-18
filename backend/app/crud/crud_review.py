from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewBase

class CRUDReview(CRUDBase[Review, ReviewCreate, ReviewBase]):
    async def get_multi_by_book(
        self, db: AsyncSession, *, book_id: int, skip: int = 0, limit: int = 100
    ) -> List[Review]:
        result = await db.execute(
            select(Review)
            .where(Review.book_id == book_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def create_with_user(
        self, db: AsyncSession, *, obj_in: ReviewCreate, book_id: int, user_id: int
    ) -> Review:
        db_obj = Review(
            **obj_in.model_dump(),
            book_id=book_id,
            user_id=user_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

review = CRUDReview(Review)
