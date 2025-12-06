import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cors.settings import settings
from database.models.base import Base
from app.cors.logger.logger import get_logger



logger = get_logger(__name__)

engine = create_async_engine(settings.AsyncDataBaseUrl, echo = False, pool_size=10, max_overflow=20, pool_pre_ping=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def create_all_tables():
    """Создание всех таблиц из моделей"""
    logger.info(f'до очищения кеша {len(Base.metadata.tables)}')
    Base.metadata.clear()
    logger.info(f'после очищения {len(Base.metadata.tables)}')
    try:
        from database.models.applications import Applications, Users, ApplicationsLatest
        from database.models.user import UsersLatest
        from database.models.admin import Admins
        logger.info(f'после импорта {len(Base.metadata.tables)}')
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Таблицы созданы")
        return {"status": "success", "message": "Все таблицы созданы"}
    except Exception as e:
        logger.warn(f"ошибка при создании таблиц {e}")
        raise e

async def drop_all_tables():
    """Удаление всех таблиц"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("Таблицы удалены")
        return {"status": "success", "message": "Все таблицы удалены"}
    except Exception as e:
        logger.warn(f"ошибка при удалении таблиц {e}")
        raise e