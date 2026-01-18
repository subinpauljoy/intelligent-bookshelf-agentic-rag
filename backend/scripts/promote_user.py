import asyncio
import sys
import os

# Add the parent directory (backend) to the python path to allow 'app' imports
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def promote(email: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user:
            user.is_superuser = True
            await db.commit()
            print(f"User {email} is now an ADMIN.")
        else:
            print(f"User {email} not found.")

if __name__ == "__main__":
    email = input("Enter email to promote to admin: ")
    asyncio.run(promote(email))