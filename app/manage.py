import os
import sys
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cors.settings import settings
from app.cors.logger.logger import get_logger
from services.database.config import create_all_tables, drop_all_tables

logger = get_logger(__name__)

async def migrate():
    logger.info("Cоздаем таблицы...")
    await create_all_tables()

async def drop():
    logger.info("Удаляем таблицы...")
    await drop_all_tables()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.info("Использование: python файл.py <имя_функции>")
        sys.exit(1)
    func_name = sys.argv[1]
    if func_name == "migrate":
        asyncio.run(migrate())
    elif func_name == "drop":
        asyncio.run(drop())
    else:
        logger.info(f"Неизвестная функция: {func_name}")
        sys.exit(1)