from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, computed_field
from typing import Optional, List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Book Management"
    API_V1_STR: str = "/api/v1"
    
    # Origins that are allowed to make requests to the backend
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000"
    ]

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "book_db"
    POSTGRES_PORT: int = 5432
    
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    USERS_OPEN_REGISTRATION: bool = True
    
    OPENROUTER_API_KEY: Optional[str] = None
    
    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return str(PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        ))

    model_config = {
        "case_sensitive": True,
        # Try both current and parent directory for .env
        "env_file": [".env", "../.env"],
        "extra": "ignore"
    }

settings = Settings()
