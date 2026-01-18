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

from app.db.session import get_db, AsyncSessionLocal

async def run_ingestion(document_id: int):
    async with AsyncSessionLocal() as session:
        ingestion_service = IngestionService(session)
        await ingestion_service.ingest_document(document_id)

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
    from app.models.document import Document as DocumentModel
    doc = await db.get(DocumentModel, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "processing"
    await db.commit()
    
    background_tasks.add_task(run_ingestion, id)
    
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

@router.delete("/{id}", response_model=Document)
async def delete_document(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a document and its file.
    """
    from app.models.document import Document as DocumentModel
    doc = await db.get(DocumentModel, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove file from filesystem
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    await db.delete(doc)
    await db.commit()
    return doc