import asyncio
import asyncpg
from app.core.config import settings

async def init_db():
    print(f"Connecting to {settings.POSTGRES_SERVER}...")
    try:
        # Connect to the default 'postgres' database to check/create the target db if needed
        # But our docker setup creates 'book_db' automatically. We connect to 'book_db'.
        conn = await asyncpg.connect(
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            database=settings.POSTGRES_DB,
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT
        )
        
        print("Creating 'vector' extension if not exists...")
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        print("Extension 'vector' enabled.")
        
        await conn.close()
    except Exception as e:
        print(f"Error initializing DB: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
