import os
import sys
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select, update, delete, func
from typing import List, Optional, Any
from typing import List, Optional, Any, Callable
from functools import wraps

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.manager import BaseManager
from database.context import get_session

from sqlalchemy import TypeDecorator, String



class EncryptedString(TypeDecorator):
    """encrypt поле type string"""
    impl = String  # В БД хранится как String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Запись поля"""

    def process_result_value(self, value, dialect):
        """Чтение поля"""


class HashMetaMapped(DeclarativeMeta):
    """ Отвечает за создание хешей для encrypt полей"""
    def __init__(self, name, base, dict_):
        super().__init__(name, base, dict_)
        searchable_fields = []




class Base(DeclarativeBase):
    """Базовый класс с менеджером подобие Django ORM"""
    objects: BaseManager = None
    
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.objects = BaseManager(cls)
    
    async def save(self) -> None:
        """Сохранение текущего экземпляра"""
        session = get_session()
        session.add(self)
        await session.commit()
        await session.refresh(self)




