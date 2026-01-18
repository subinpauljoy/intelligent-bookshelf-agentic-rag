from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.llm_service import llm_service
from app.services.rag_service import RAGService
from app.models.document import Document
from app.api import deps
from app.db.session import get_db

router = APIRouter()

@router.post("/generate-summary", response_model=dict)
async def generate_summary(
    book_id: Optional[int] = Body(None),
    text: Optional[str] = Body(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate a summary for a given book. 
    Prefers RAG if book_id and document are provided.
    """
    if book_id:
        # Check for ingested document
        result = await db.execute(
            select(Document).where(Document.book_id == book_id, Document.status == 'ready')
        )
        doc = result.scalars().first()
        
        if doc:
            rag_service = RAGService(db)
            # Use RAG to pull key chunks for a summary
            chunks = await rag_service.search_similar_chunks("Provide a comprehensive summary of this book", book_title=None, limit=5)
            context = "\n\n".join([c.content for c in chunks])
            
            prompt = f"Based on the following excerpts from the book, provide a concise summary:\n\n{context}"
            summary = await llm_service.llm.ainvoke(prompt)
            return {"summary": summary.content}
        else:
            return {"error": "Please upload and ingest the book document first to generate an accurate summary."}

    if text:
        # Fallback for manual text summary
        summary = await llm_service.generate_summary(text)
        return {"summary": summary}
        
    raise HTTPException(status_code=400, detail="Either book_id or text must be provided")