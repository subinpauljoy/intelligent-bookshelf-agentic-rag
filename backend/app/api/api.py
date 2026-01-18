from fastapi import APIRouter

from app.api.endpoints import login, users, books, reviews, ai, documents

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(reviews.router, prefix="/books", tags=["reviews"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
