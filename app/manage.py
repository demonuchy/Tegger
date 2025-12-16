import os
import sys
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cors.settings import settings
from app.cors.logger.logger import get_logger
from services.database.config import create_all_tables, drop_all_tables, create_root
from services.database.models.base import Base

logger = get_logger(__name__)

async def create_admin():
    logger.info("Cоздаем Root пользователя")
    await create_root()

async def migrate():
    logger.info("Cоздаем таблицы...")
    await create_all_tables()
    await asyncio.sleep(1)

async def drop():
    logger.info("Удаляем таблицы...")
    await drop_all_tables()
    Base.metadata.clear()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.info("Использование: python файл.py <имя_функции>")
        sys.exit(1)
    func_name = sys.argv[1]
    if func_name == "migrate":
        asyncio.run(migrate())
    elif func_name == "drop":
        asyncio.run(drop())
    elif func_name == "createadmin":
        asyncio.run(create_admin())
    else:
        logger.info(f"Неизвестная функция: {func_name}")
        sys.exit(1)