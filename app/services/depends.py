import os
import sys
from functools import wraps
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from app.cors.logger.logger import get_logger

logger = get_logger(__name__)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def handle_errors_wrraper():
    """Обработка ошибок в ендпоинтах"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException as e:
                logger.warn(f"Ошибка обработки запроса {e}")
                return JSONResponse({"details" : e.detail}, status_code=e.status_code)
            except Exception as e:
                logger.warn(f"Ошибка обработки запроса {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                    detail=f"error: {str(e)}"
                )
        return wrapper
    return decorator


