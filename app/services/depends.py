import os
import sys
from functools import wraps
from fastapi import HTTPException, status

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.application.service import ApplicationService
from app.services.user.service import UserService


async def get_application_service() -> ApplicationService:
    return ApplicationService()


async def get_user_service() -> UserService:
    return UserService()


class BotNotifications:
    pass


def handle_errors(endpoint_name: str):
    """Обработка ошибок в ендпоинтах"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                    detail=f"{endpoint_name} error: {str(e)}"
                )
        return wrapper
    return decorator


