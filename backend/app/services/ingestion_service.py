import os
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document, DocumentChunk
from app.core.config import settings
from pypdf import PdfReader

# Validate API Key early
if not settings.OPENROUTER_API_KEY:
    # If not found in settings, try direct env look up as fallback
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        print("WARNING: OPENROUTER_API_KEY not found in settings or environment!")
    else:
        settings.OPENROUTER_API_KEY = key

# Initialize embedding API
embedding_service = OpenAIEmbeddings(
    openai_api_key=settings.OPENROUTER_API_KEY or "dummy_key_to_avoid_validation_error",
    openai_api_base="https://openrouter.ai/api/v1",
    model="openai/text-embedding-3-small"
)

# Alias for backward compatibility with recommendation_service.py
embedding_model = embedding_service

class IngestionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def extract_text(self, file_path: str, filename: str) -> str:
        if filename.endswith('.pdf'):
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()

    def get_chunks(self, text: str) -> List[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        return text_splitter.split_text(text)

    async def ingest_document(self, document_id: int):
        doc = await self.db.get(Document, document_id)
        if not doc:
            raise ValueError("Document not found")
        
        doc.status = "processing"
        await self.db.commit()

        try:
            text = self.extract_text(doc.file_path, doc.filename)
            chunks = self.get_chunks(text)
            
            # Batch generate embeddings via API
            embeddings = await embedding_service.aembed_documents(chunks)
            
            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                db_chunk = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=chunk_text,
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
