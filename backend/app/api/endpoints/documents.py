import os
import shutil
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_document import document as crud_document
from app.api import deps
from app.schemas.document import Document, DocumentCreate, ChatQuery, ChatResponse
from app.db.session import get_db
from app.services.ingestion_service import IngestionService
from app.services.rag_service import RAGService

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload", response_model=Document)
async def upload_document(
    file: UploadFile = File(...),
    book_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a document and optionally link it to a book.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    doc_in = DocumentCreate(filename=file.filename, file_path=file_path)
    # Use a manual create or update crud to handle book_id since it's extra
    from app.models.document import Document as DocumentModel
    db_obj = DocumentModel(
        filename=file.filename,
        file_path=file_path,
        book_id=book_id
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.post("/{id}/ingest", response_model=Document)
async def ingest_document(
    id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Trigger ingestion for a document.
    """
    ingestion_service = IngestionService(db)
    await ingestion_service.ingest_document(id)
    
    from app.models.document import Document as DocumentModel
    doc = await db.get(DocumentModel, id)
    return doc

@router.post("/chat", response_model=ChatResponse)
async def chat(
    query: ChatQuery,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Ask a question to the RAG system.
    """
    rag_service_inst = RAGService(db)
    answer, sources = await rag_service_inst.answer_question(query.question)
    return {"answer": answer, "sources": sources}

@router.get("/", response_model=List[Document])
async def read_documents(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    documents = await crud_document.get_multi(db, skip=skip, limit=limit)
    return documents