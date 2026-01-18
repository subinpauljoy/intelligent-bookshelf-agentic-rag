from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_book import book as crud_book
from app.api import deps
from app.schemas.book import Book, BookCreate, BookUpdate
from app.db.session import get_db

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
    Create new book.
    """
    book = await crud_book.create(db, obj_in=book_in)
    return book

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
