import os
import shutil
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
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
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a document.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    doc_in = DocumentCreate(filename=file.filename, file_path=file_path)
    doc = await crud_document.create(db, obj_in=doc_in)
    return doc

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
    doc = await crud_document.get(db, id=id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    ingestion_service = IngestionService(db)
    # Note: In a real async bg task with DB, we need a separate session or careful handling
    # For simplicity, we'll await it here or use a dedicated worker. 
    # To avoid 'Session is closed' errors in background tasks, we should pass the ID and create a new session in the task.
    # However, to keep it simple for this prototype, we will run it await-ed (blocking) or semi-blocking.
    
    # Ideally:
    # background_tasks.add_task(ingestion_task, id)
    
    # We will just run it inline for now to ensure it completes for the demo or use a wrapper.
    await ingestion_service.ingest_document(id)
    
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
    rag_service = RAGService(db)
    answer, sources = await rag_service.answer_question(query.question)
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
