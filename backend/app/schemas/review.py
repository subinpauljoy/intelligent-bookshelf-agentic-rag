from typing import Optional
from pydantic import BaseModel
from app.schemas.user import User

class ReviewBase(BaseModel):
    review_text: Optional[str] = None
    rating: int

class ReviewCreate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int
    book_id: int
    user_id: int
    user: Optional[User] = None

    class Config:
        from_attributes = True
