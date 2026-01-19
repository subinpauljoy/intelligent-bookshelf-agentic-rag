from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.crud_review import review as crud_review
from app.crud.crud_book import book as crud_book
from app.api import deps
from app.schemas.review import Review, ReviewCreate
from app.db.session import get_db
from app.models.review import Review as ReviewModel

router = APIRouter()

@router.get("/book/{book_id}", response_model=List[Review])
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

@router.post("/book/{book_id}", response_model=Review)
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
        
    # Check for duplicate review
    existing_review = await db.execute(
        select(ReviewModel).where(
            ReviewModel.book_id == book_id,
            ReviewModel.user_id == current_user.id
        )
    )
    if existing_review.scalars().first():
        raise HTTPException(status_code=400, detail="You have already reviewed this book.")

    review = await crud_review.create_with_user(
        db, obj_in=review_in, book_id=book_id, user_id=current_user.id
    )
    
    # Invalidate AI summary
    await crud_book.update(db, db_obj=book, obj_in={"ai_review_summary": None})
    
    return review

@router.delete("/{review_id}", response_model=Review)
async def delete_review(
    *,
    db: AsyncSession = Depends(get_db),
    review_id: int,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a review.
    """
    review = await crud_review.get(db, id=review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if not current_user.is_superuser and (review.user_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
        
    book = await crud_book.get(db, id=review.book_id)
    await crud_review.remove(db, id=review_id)
    
    # Invalidate AI summary
    if book:
         await crud_book.update(db, db_obj=book, obj_in={"ai_review_summary": None})
         
    return review
