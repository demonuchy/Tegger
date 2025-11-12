import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cors.settings import settings
from database.models.base import Base


engine = create_async_engine(settings.AsyncDataBaseUrl, echo = False, pool_size=10, max_overflow=20, pool_pre_ping=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def create_all_tables():
    """Создание всех таблиц из моделей"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        return {"status": "success", "message": "Все таблицы созданы"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def drop_all_tables():
    """Удаление всех таблиц"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        return {"status": "success", "message": "Все таблицы удалены"}
    except Exception as e:
        return {"status": "error", "message": str(e)}