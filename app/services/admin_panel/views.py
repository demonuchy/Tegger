import os
import sys
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.admin import Admins
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from app.cors.settings import settings
from app.cors.logger.logger import get_logger

logger = get_logger(__name__)


async def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.EXPAIR_ACCSES_TIME)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.TOKEN_ENCODE_ALGORITHM)
    return encoded_jwt


async def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.TOKEN_ENCODE_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("Токен истёк")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Неверный токен: {e}")
        return None


async def get_user_id_from_token(token: str) -> Optional[int]:
    payload = await verify_token(token)
    if not payload:
        return None
    return payload.get("user_id")


class MyAuthBackend(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        """Вызывается при входе в SQLAdmin"""
        
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        logger.info(f"Попытка входа {request.client.host} - {username} - {password}")
        if not username or not password:
            logger.warn("Неверные учетные данные")
            return False
        admin = await Admins.objects.get_by_field("user_name" , username)
        if not admin or admin.password != password:
            logger.warn("Неверные учетные данные")
            return False
        access_token = await create_access_token({"user_id" : admin.id})
        request.session["token"] = access_token
        logger.info("Успешно")
        return True

    async def authenticate(self, request: Request) -> bool:
        """Проверяет аутентификацию для каждого запроса"""
        logger.info("Проверяю авторизацию")
        token : Optional[dict] = request.session.get("token")
        if not token: return False
        user_id : Optional[int] = await get_user_id_from_token(token)
        if not user_id:
            logger.warn("Токен не валиден")
            return False
        try:
            user_id = int(user_id)
            admin = await Admins.objects.get(user_id)
            return admin is not None
        except (ValueError, TypeError):
            logger.warn("Пользователь не найден")
            return False

    async def logout(self, request: Request) -> bool:
        """Очистка сессии при выходе"""
        request.session.clear()
        logger.info(f"Выход с аккаунта {request.client.host}")
        return True