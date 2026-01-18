import os
import json
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document, DocumentChunk
from app.models.book import Book
from app.core.config import settings
from app.services.llm_service import llm_service
from pypdf import PdfReader

embedding_service = OpenAIEmbeddings(
    openai_api_key=settings.OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1",
    model="openai/text-embedding-3-small"
)

class IngestionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def extract_text(self, file_path: str, filename: str) -> str:
        if filename.endswith('.pdf'):
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
            return text
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()

    def get_chunks(self, text: str) -> List[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )
        return text_splitter.split_text(text)

    async def ingest_document(self, document_id: int):
        # Fetch document with its linked book
        result = await self.db.execute(
            select(Document).where(Document.id == document_id)
        )
        doc = result.scalars().first()
        if not doc:
            raise ValueError("Document not found")
        
        doc.status = "processing"
        await self.db.commit()

        try:
            text = self.extract_text(doc.file_path, doc.filename)
            
            # 1. Update Book Summary if linked
            if doc.book_id:
                book_result = await self.db.execute(select(Book).where(Book.id == doc.book_id))
                book = book_result.scalars().first()
                if book:
                    # Generate a high-quality summary from the full text (or a large sample)
                    summary = await llm_service.generate_summary(text[:10000]) # Sample first 10k chars for summary
                    book.summary = summary
                    await self.db.commit()

            # 2. Process Chunks
            chunks = self.get_chunks(text)
            embeddings = await embedding_service.aembed_documents(chunks)
            
            # Prepare metadata
            metadata = {}
            if doc.book_id and book:
                metadata = {
                    "book_id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "genre": book.genre
                }

            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                db_chunk = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=chunk_text,
                    metadata_json=json.dumps(metadata),
                    embedding=embedding
                )
                self.db.add(db_chunk)
            
            doc.status = "ready"
            await self.db.commit()
        except Exception as e:
            doc.status = "failed"
            await self.db.commit()
            print(f"Error ingesting document: {e}")
            raise e