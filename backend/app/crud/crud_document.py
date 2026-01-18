from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentCreate, DocumentBase

class CRUDDocument(CRUDBase[Document, DocumentCreate, DocumentBase]):
    pass

document = CRUDDocument(Document)
