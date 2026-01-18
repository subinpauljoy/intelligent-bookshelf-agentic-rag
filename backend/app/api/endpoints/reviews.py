from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_review import review as crud_review
from app.crud.crud_book import book as crud_book
from app.api import deps
from app.schemas.review import Review, ReviewCreate
from app.db.session import get_db

router = APIRouter()

@router.get("/{book_id}/reviews", response_model=List[Review])
async def read_reviews(
    *,
    db: AsyncSession = Depends(get_db),
    book_id: int,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve reviews for a book.
    """
    reviews = await crud_review.get_multi_by_book(db, book_id=book_id, skip=skip, limit=limit)
    return reviews

@router.post("/{book_id}/reviews", response_model=Review)
async def create_review(
    *,
    db: AsyncSession = Depends(get_db),
    book_id: int,
    review_in: ReviewCreate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new review for a book.
    """
    book = await crud_book.get(db, id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    review = await crud_review.create_with_user(
        db, obj_in=review_in, book_id=book_id, user_id=current_user.id
    )
    return review
