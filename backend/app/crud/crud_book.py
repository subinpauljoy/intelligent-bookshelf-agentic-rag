from app.crud.base import CRUDBase
from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate

class CRUDBook(CRUDBase[Book, BookCreate, BookUpdate]):
    pass

book = CRUDBook(Book)
