from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.book import Book
from app.models.review import Review
from app.models.document import DocumentChunk
from app.services.ingestion_service import embedding_model

class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recommendations(self, user_id: int, limit: int = 5) -> List[Book]:
        # 1. Get user's favorite genres based on high ratings (4 or 5)
        stmt = select(Book.genre).join(Review).where(
            Review.user_id == user_id,
            Review.rating >= 4
        ).group_by(Book.genre)
        
        result = await self.db.execute(stmt)
        favorite_genres = result.scalars().all()

        if not favorite_genres:
            # Fallback: Just return top rated books
            stmt = select(Book).limit(limit)
            result = await self.db.execute(stmt)
            return result.scalars().all()

        # 2. Find books in those genres that the user hasn't reviewed yet
        # First, get IDs of books already reviewed by user
        reviewed_stmt = select(Review.book_id).where(Review.user_id == user_id)
        reviewed_ids_result = await self.db.execute(reviewed_stmt)
        reviewed_ids = reviewed_ids_result.scalars().all()

        stmt = select(Book).where(
            Book.genre.in_(favorite_genres),
            Book.id.not_in(reviewed_ids) if reviewed_ids else True
        ).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

recommendation_service = RecommendationService
