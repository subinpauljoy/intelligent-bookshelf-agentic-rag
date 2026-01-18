import os
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document, DocumentChunk
from pypdf import PdfReader

# Initialize embedding model globally to load it once
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

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
            # Assume text file
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()

    def get_chunks(self, text: str) -> List[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        return text_splitter.split_text(text)

    def get_embedding(self, text: str) -> List[float]:
        return embedding_model.encode(text).tolist()

    async def ingest_document(self, document_id: int):
        doc = await self.db.get(Document, document_id)
        if not doc:
            raise ValueError("Document not found")
        
        doc.status = "processing"
        await self.db.commit()

        try:
            text = self.extract_text(doc.file_path, doc.filename)
            chunks = self.get_chunks(text)
            
            for i, chunk_text in enumerate(chunks):
                embedding = self.get_embedding(chunk_text)
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
