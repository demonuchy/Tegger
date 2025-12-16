import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cors.settings import settings
from database.models.base import Base
from database.models.admin import Admins
from app.cors.logger.logger import get_logger




logger = get_logger(__name__)

engine = create_async_engine(settings.AsyncDataBaseUrl, echo = False, pool_size=10, max_overflow=20, pool_pre_ping=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)

async def create_root(instanse : Base = Admins):
    logger.info("СОЗДАЕМ АДМИНА...")
    async with async_session() as session:
        try:
            admin = instanse(
                user_name="admin",
                password="admin",
                is_active=True
            )
            session.add(admin)
            await session.commit()
            await session.refresh(admin)
        except Exception as e:
            await session.rollback()
            logger.warn(f"Error : {str(e)}")
        finally:
            stmt = select(instanse).where(instanse.user_name == "admin")
            admin : Base = (await session.execute(stmt)).scalar_one_or_none()
            if admin is None:
                logger.warn("Admin not found ...")
            else:
                logger.info(f"Admin : {admin.user_name}-{admin.password}")
            await session.close()




async def create_all_tables():
    """Создание всех таблиц из моделей"""
    logger.info(f'Таблицы : {len(Base.metadata.tables)}')
    try:
        from database.models.admin import Admins
        from database.models.applications import ApplicationsLatest
        from database.models.user import UsersLatest
        logger.info(f'после импорта {Base.metadata.tables.keys()}')
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
        from database.models.applications import Applications, Users, ApplicationsLatest
        from database.models.user import UsersLatest
        from database.models.admin import Admins
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("Таблицы удалены")
        return {"status": "success", "message": "Все таблицы удалены"}
    except Exception as e:
        logger.warn(f"ошибка при удалении таблиц {e}")
        raise e