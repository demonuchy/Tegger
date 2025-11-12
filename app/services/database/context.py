from contextvars import ContextVar
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional


_db_session: ContextVar[Optional[AsyncSession]] = ContextVar('_db_session', default=None)


def get_session() -> AsyncSession:
    """Получение текущей сессии из контекста"""
    session = _db_session.get()
    if session is None:
        raise RuntimeError("Сессия не установлена в текущем контексте")
    return session


def set_session(session: AsyncSession):
    """Установка сессии в контекст"""
    return _db_session.set(session)


def reset_session(token):
    """Сброс сессии из контекста"""
    _db_session.reset(token)