from fastapi import Request, Response
import functools
import os
import sys
from starlette.middleware.base import BaseHTTPMiddleware

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.config import async_session
from database.context import set_session, reset_session


async def db_session_middleware(request: Request, call_next):
    """Middleware для управления сессиями БД"""
    async with async_session() as session:
        token = set_session(session)
        try:
            response = await call_next(request)
            await session.commit()
            return response
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            reset_session(token)
            await session.close()


class DBSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print("🔍 1. DBSessionMiddleware: устанавливаю сессию")
        async with async_session() as session:
            token = set_session(session)
            try:
                response = await call_next(request)
                await session.commit()
                return response
            except Exception as e:
                await session.rollback()
                raise e
            finally:
                reset_session(token)
                await session.close()