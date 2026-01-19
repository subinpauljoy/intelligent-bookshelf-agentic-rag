from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.crud_book import book as crud_book
from app.api import deps
from app.schemas.book import Book, BookCreate, BookUpdate
from app.db.session import get_db
from app.models.book import Book as BookModel
from app.models.review import Review
from app.services.llm_service import llm_service

from app.services.recommendation_service import RecommendationService

router = APIRouter()

@router.get("/recommendations", response_model=List[Book])
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get book recommendations based on user preferences.
    """
    rec_service = RecommendationService(db)
    return await rec_service.get_recommendations(user_id=current_user.id)

@router.get("/", response_model=List[Book])
async def read_books(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve books.
    """
    books = await crud_book.get_multi(db, skip=skip, limit=limit)
    return books

@router.post("/", response_model=Book)
async def create_book(
    *,
    db: AsyncSession = Depends(get_db),
    book_in: BookCreate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new book with duplicate check.
    """
    # Check if book already exists
    existing_book = await db.execute(
        select(BookModel).where(
            BookModel.title.ilike(book_in.title),
            BookModel.author.ilike(book_in.author)
        )
    )
    if existing_book.scalars().first():
        raise HTTPException(
            status_code=400,
            detail=f"The book '{book_in.title}' by {book_in.author} already exists in the system."
        )
    
    book = await crud_book.create(db, obj_in=book_in)
    return book

@router.get("/{id}/summary", response_model=dict)
async def get_book_summary_ai(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
) -> Any:
    """
    Get an AI-generated summary of reviews and aggregated rating for a book.
    """
    book = await crud_book.get(db, id=id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get reviews
    result = await db.execute(select(Review).where(Review.book_id == id))
    reviews = result.scalars().all()
    
    if not reviews:
        return {
            "summary": book.summary or "No summary available.",
            "review_summary": "No reviews yet.",
            "average_rating": 0
        }
    
    avg_rating = sum([r.rating for r in reviews]) / len(reviews)
    
    if book.ai_review_summary:
        review_summary = book.ai_review_summary
    else:
        review_texts = [r.review_text for r in reviews if r.review_text]
        review_summary = "No detailed reviews to summarize."
        if review_texts:
            review_summary = await llm_service.generate_review_summary(review_texts)
            # Cache the summary
            await crud_book.update(db, db_obj=book, obj_in={"ai_review_summary": review_summary})
        
    return {
        "summary": book.summary,
        "review_summary": review_summary,
        "average_rating": avg_rating
    }

@router.get("/{id}", response_model=Book)
async def read_book(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
) -> Any:
    """
    Get book by ID.
    """
    book = await crud_book.get(db, id=id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.put("/{id}", response_model=Book)
async def update_book(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    book_in: BookUpdate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a book.
    """
    book = await crud_book.get(db, id=id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    book = await crud_book.update(db, db_obj=book, obj_in=book_in)
    return book

@router.delete("/{id}", response_model=Book)
async def delete_book(
    *,
    db: AsyncSession = Depends(get_db),
    id: int,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a book.
    """
    book = await crud_book.get(db, id=id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    book = await crud_book.remove(db, id=id)
    return book
