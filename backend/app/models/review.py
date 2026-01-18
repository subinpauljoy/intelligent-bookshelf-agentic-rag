from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.db.base import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_text = Column(Text, nullable=True)
    rating = Column(Integer, nullable=False)
    embedding = Column(Vector(1536), nullable=True) # For semantic recommendation

    book = relationship("Book", back_populates="reviews")
    user = relationship("User")
