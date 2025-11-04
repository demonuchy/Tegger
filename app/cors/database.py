import sys
import os
from sqlalchemy.ext.asyncio import  create_async_engine, async_sessionmaker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.base import Base
from cors.settings import settings


aioEngine = create_async_engine(
    url = settings.AsyncDataBaseUrl, 
    echo = False, 
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
    )

aioSession = async_sessionmaker(aioEngine, expire_on_commit=False)


async def get_db_session():
    async with aioSession() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_table():
    async with aioEngine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_table():
    async with aioEngine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

