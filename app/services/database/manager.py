import os
import sys
from sqlalchemy import select, func
from typing import List, Optional, Any, TypeVar

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.context import get_session

T = TypeVar("T")

class BaseManager:
    """Менеджер объектов в стиле Django"""
    
    def __init__(self, model_class):
        self.model_class = model_class
    
    async def create(self, **kwargs: Any):
        """Создание новой записи"""
        session = get_session()
        instance = self.model_class(**kwargs)
        session.add(instance)
        await session.commit()
        await session.refresh(instance)
        return instance
    
    async def get(self, id: int) -> Optional[Any]:
        """Получение записи по ID"""
        session = get_session()
        return await session.get(self.model_class, id)
    
    async def all(self, skip: int = 0, limit: int = 100) -> List[Any]:
        """Получение всех записей с пагинацией"""
        session = get_session()
        stmt = select(self.model_class).offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())
    
    async def filter(self, **filters: Any) -> List[Any]:
        """Фильтрация записей по параметрам"""
        session = get_session()
        stmt = select(self.model_class)
        for key, value in filters.items():
            if hasattr(self.model_class, key):
                stmt = stmt.where(getattr(self.model_class, key) == value)
        result = await session.execute(stmt)
        return list(result.scalars().all())
    
    async def update(self, id: int, **kwargs: Any) -> Optional[Any]:
        """Обновление записи по ID"""
        session = get_session()
        instance = await session.get(self.model_class, id)
        if instance:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            await session.commit()
            await session.refresh(instance)
        return instance
    
    async def delete(self, id: int) -> bool:
        """Удаление записи по ID"""
        session = get_session()
        instance = await session.get(self.model_class, id)
        if instance:
            await session.delete(instance)
            await session.commit()
            return True
        return False
    
    async def count(self) -> int:
        """Подсчет общего количества записей"""
        session = get_session()
        stmt = select(func.count(self.model_class.id))
        result = await session.execute(stmt)
        return result.scalar()
    
    async def get_by_field(self, field_name: str, value: Any) -> Optional[T]:
        """Получение одной записи по полю"""
        session = get_session()
        if hasattr(self.model_class, field_name):
            stmt = select(self.model_class).where(getattr(self.model_class, field_name) == value)
            result = await session.execute(stmt)
            return result.scalars().first()
        return None
    
    async def get_or_create(self, defaults: dict = None, **kwargs) -> Any:
        """Получить или создать запись"""
        instance = await self.get_by_field(**kwargs)
        if instance:
            return instance
        create_data = kwargs.copy()
        if defaults:
            create_data.update(defaults)
        return await self.create(**create_data)
    
    async def exists(self, **filters) -> bool:
        """Проверка существования записи"""
        session = get_session()
        stmt = select(self.model_class.id)
        for key, value in filters.items():
            if hasattr(self.model_class, key):
                stmt = stmt.where(getattr(self.model_class, key) == value)
        stmt = stmt.limit(1)
        result = await session.execute(stmt)
        return result.scalar() is not None