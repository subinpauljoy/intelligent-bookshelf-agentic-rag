from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import hashlib
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Using bcrypt with a pre-hash to handle passwords longer than 72 characters
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = settings.ALGORITHM

def get_password_hash(password: str) -> str:
    """
    Hashes the password using SHA-256 first, then bcrypt.
    This bypasses bcrypt's 72-character limit.
    """
    # Pre-hash the password to handle any length
    pre_hashed = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(pre_hashed)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies the pre-hashed plain password against the hashed password.
    """
    pre_hashed = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(pre_hashed, hashed_password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt