import json
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.document import DocumentChunk
from app.models.book import Book
from app.services.ingestion_service import embedding_service
from app.services.llm_service import llm_service

class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_book_metadata(self, query_params: dict) -> str:
        """Tool to fetch book metadata from the SQL database."""
        stmt = select(Book)
        if "genre" in query_params:
            stmt = stmt.where(Book.genre.ilike(f"%{query_params['genre']}"))
        if "author" in query_params:
            stmt = stmt.where(Book.author.ilike(f"%{query_params['author']}"))
        
        limit = query_params.get("limit", 5)
        stmt = stmt.limit(limit)
        
        result = await self.db.execute(stmt)
        books = result.scalars().all()
        
        if not books:
            return "No books found matching those criteria."
        
        return "\n".join([f"- {b.title} by {b.author} (Genre: {b.genre}, Year: {b.year_published})" for b in books])

    async def search_similar_chunks(self, query: str, book_title: Optional[str] = None, limit: int = 3) -> List[DocumentChunk]:
        """Tool to perform semantic search in the vector database."""
        query_embedding = await embedding_service.aembed_query(query)
        
        stmt = select(DocumentChunk)
        
        # If a specific book title is mentioned, filter chunks by metadata
        if book_title:
            stmt = stmt.where(DocumentChunk.metadata_json.ilike(f"%{book_title}%"))
            
        stmt = stmt.order_by(
            DocumentChunk.embedding.l2_distance(query_embedding)
        ).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def answer_question(self, query: str, history: List[dict] = []) -> Tuple[str, List[str]]:
        # 1. Routing & Intent Detection (The "Router Agent" logic)
        routing_prompt = f"""Analyze the user query and decide the intent. 
        
        Query: {query}
        History: {history[-2:] if history else "None"}

        Rules:
        1. If it's a general question not about books, reply with "NON_BOOK".
        2. If it asks to list, count, or find books by metadata (genre, author, year), reply with "METADATA".
        3. If it asks about the content/details of a specific book or books in general, reply with "CONTENT".
        4. If it's a follow-up question, use history to decide.

        Reply with only the category word.
        """
        
        intent = await llm_service.llm.ainvoke(routing_prompt)
        intent = intent.content.strip().upper()

        sources = []
        
        if "NON_BOOK" in intent:
            answer = "I am a specialized Book Assistant. I can only help you with queries related to books in our library, such as listing books by genre, summarizing content, or answering specific questions about their text. Try asking 'List some fantasy books' or 'Tell me about the main character in [Book Title]'."
            return answer, []

        elif "METADATA" in intent:
            # Extract basic params (in a real app, use a proper NER or LLM call to extract json)
            # Simulating extraction for now
            extraction_prompt = f"Extract search criteria from this query: '{query}'. Return JSON with 'genre', 'author', or 'limit'. Return empty JSON if none found."
            params_raw = await llm_service.llm.ainvoke(extraction_prompt)
            try:
                params = json.loads(params_raw.content)
            except:
                params = {}
            
            answer = await self.get_book_metadata(params)
            return f"Here are the books I found:\n{answer}", ["Database Query"]

        else: # CONTENT
            # Detect if a book title is mentioned
            title_prompt = f"Extract the book title from this query if present: '{query}'. If not, reply 'None'."
            title_res = await llm_service.llm.ainvoke(title_prompt)
            title = title_res.content.strip() if "None" not in title_res.content else None
            
            chunks = await self.search_similar_chunks(query, book_title=title)
            context = "\n\n".join([c.content for c in chunks])
            sources = [f"Found in {json.loads(c.metadata_json).get('title', 'Unknown Book')}" for c in chunks]

            qa_prompt = f"""You are a helpful book assistant. Use the context below to answer the user's question.
            If the context is empty, say you don't have information about that specific book yet.
            
            Context: {context}
            Question: {query}
            History: {history}
            
            Answer:"""
            
            response = await llm_service.llm.ainvoke(qa_prompt)
            return response.content, list(set(sources))

rag_service = RAGService
