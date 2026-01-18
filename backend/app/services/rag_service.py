from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import DocumentChunk
from app.services.ingestion_service import embedding_model
from app.services.llm_service import llm_service

class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_similar_chunks(self, query: str, limit: int = 3) -> List[DocumentChunk]:
        query_embedding = embedding_model.encode(query).tolist()
        
        # Using l2_distance or cosine_distance if configured
        # pgvector supports <-> (L2 distance), <=> (Cosine distance), <#> (Inner product)
        # SQLAlchemy pgvector syntax: DocumentChunk.embedding.l2_distance(query_embedding)
        
        stmt = select(DocumentChunk).order_by(
            DocumentChunk.embedding.l2_distance(query_embedding)
        ).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def answer_question(self, query: str) -> Tuple[str, List[str]]:
        chunks = await self.search_similar_chunks(query)
        
        context = "\n\n".join([chunk.content for chunk in chunks])
        sources = list(set([f"Chunk {c.id} from Doc {c.document_id}" for c in chunks])) # Simplify sources for now
        
        prompt = f"""Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {query}
Answer:"""
        
        # We can reuse the LLM service but pass the custom prompt
        # Extending LLMService slightly or just using the langchain instance directly if accessible
        # For now, let's assume we can call `generate_summary` style method but generic
        
        from langchain.prompts import PromptTemplate
        
        prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {question}
Answer:"""
        )
        
        chain = prompt_template | llm_service.llm
        response = await chain.ainvoke({"context": context, "question": query})
        
        return response.content, sources
