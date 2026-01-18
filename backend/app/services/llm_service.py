from typing import Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.llm = ChatOpenAI(
            openai_api_key=settings.OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1",
            model_name="meta-llama/llama-3-8b-instruct:free",
            temperature=0.7
        )

    async def generate_summary(self, text: str) -> str:
        prompt_template = PromptTemplate(
            input_variables=["text"],
            template="Please provide a concise summary of the following book content:\n\n{text}"
        )
        chain = prompt_template | self.llm
        response = await chain.ainvoke({"text": text})
        return response.content

    async def generate_review_summary(self, reviews: list[str]) -> str:
        reviews_text = "\n".join([f"- {r}" for r in reviews])
        prompt_template = PromptTemplate(
            input_variables=["reviews"],
            template="Summarize the general sentiment and key points from the following book reviews:\n\n{reviews}"
        )
        chain = prompt_template | self.llm
        response = await chain.ainvoke({"reviews": reviews_text})
        return response.content

llm_service = LLMService()
