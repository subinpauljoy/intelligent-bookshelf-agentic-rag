from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class DocumentBase(BaseModel):
    filename: str

class DocumentCreate(DocumentBase):
    file_path: str
    status: str = "uploaded"

class Document(DocumentBase):
    id: int
    upload_date: datetime
    status: str

    class Config:
        from_attributes = True

class ChatQuery(BaseModel):
    question: str
    
class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
