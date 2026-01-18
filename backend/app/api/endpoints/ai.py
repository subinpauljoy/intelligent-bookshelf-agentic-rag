from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Body
from app.services.llm_service import llm_service
from app.api import deps

router = APIRouter()

@router.post("/generate-summary", response_model=dict)
async def generate_summary(
    text: str = Body(..., embed=True),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate a summary for a given book content.
    """
    summary = await llm_service.generate_summary(text)
    return {"summary": summary}
