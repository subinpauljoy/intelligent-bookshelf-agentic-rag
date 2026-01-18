from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, not_, desc
from app.models.book import Book
from app.models.review import Review
from app.models.document import DocumentChunk
from app.services.ingestion_service import embedding_service

class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recommendations(self, user_id: int, limit: int = 5) -> List[Book]:
        # 1. Get user's recent high-rated reviews with embeddings
        stmt = select(Review).where(
            Review.user_id == user_id,
            Review.embedding.isnot(None),
            Review.rating >= 4
        ).order_by(Review.id.desc()).limit(10)
        
        result = await self.db.execute(stmt)
        user_reviews = result.scalars().all()

        # Get IDs of books already reviewed
        reviewed_stmt = select(Review.book_id).where(Review.user_id == user_id)
        reviewed_ids_res = await self.db.execute(reviewed_stmt)
        reviewed_ids = reviewed_ids_res.scalars().all()

        if not user_reviews:
            # IMPROVED FALLBACK: Suggest top-rated books the user hasn't seen
            # Subquery to get average ratings
            avg_rating_stmt = (
                select(Review.book_id, func.avg(Review.rating).label("avg_score"))
                .group_by(Review.book_id)
                .subquery()
            )
            
            stmt = (
                select(Book)
                .outerjoin(avg_rating_stmt, Book.id == avg_rating_stmt.c.book_id)
                .where(not_(Book.id.in_(reviewed_ids)))
                .order_by(desc(avg_rating_stmt.c.avg_score), func.random()) # Popular + Random mix
                .limit(limit)
            )
            result = await self.db.execute(stmt)
            return result.scalars().all()

        # 2. Compute a "User Taste" vector (Semantic Logic)
        import numpy as np
        embeddings = [np.array(r.embedding) for r in user_reviews]
        user_taste_vector = np.mean(embeddings, axis=0).tolist()

        # 3. Use pgvector for semantic matching
        from app.models.document import Document
        
        stmt = (
            select(Book)
            .join(Document, Document.book_id == Book.id)
            .join(DocumentChunk, DocumentChunk.document_id == Document.id)
            .where(not_(Book.id.in_(reviewed_ids)))
            .order_by(DocumentChunk.embedding.l2_distance(user_taste_vector))
            .limit(limit * 3)
        )
        
        result = await self.db.execute(stmt)
        books = []
        seen_ids = set()
        for b in result.scalars().all():
            if b.id not in seen_ids:
                books.append(b)
                seen_ids.add(b.id)
            if len(books) >= limit:
                break
                
        return books
