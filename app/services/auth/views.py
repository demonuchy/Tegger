import os
import sys
import hashlib
import hmac
import urllib.parse
from typing import Dict, Optional
from fastapi import APIRouter, Request, Depends, HTTPException


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.user.views import user_router, private_user_router, private_user_router_v2
from app.services.application.views import application_router, admin_application_router, admin_application_router_v2, public_application_router_v2
from app.cors.settings import settings
from app.services.database.models.applications import Users


def verify_telegram_init_data(init_data: str, bot_token: str) -> bool:
    """Верификация подписи Telegram Web App initData"""
    try:
        parsed_data = urllib.parse.parse_qs(init_data)
        received_hash = parsed_data.get('hash', [''])[0]
        if not received_hash:
            return False
        data_check_string_parts = []
        for key in sorted(parsed_data.keys()):
            if key != 'hash':
                value = parsed_data[key][0]
                data_check_string_parts.append(f"{key}={value}")
        
        data_check_string = "\n".join(data_check_string_parts)
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        computed_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        return computed_hash == received_hash
    except Exception:
        return False

def parse_telegram_init_data(init_data: str) -> Dict:
    """Парсинг initData и извлечение пользовательских данных"""
    parsed_data = {}
    try:
        params = urllib.parse.parse_qs(init_data) 
        for key, value in params.items():
            if key in ['user', 'receiver', 'chat']:
                import json
                parsed_data[key] = json.loads(value[0])
            else:
                parsed_data[key] = value[0] if len(value) == 1 else value
    except Exception as e:
        print(f"Error parsing initData: {e}")
        
    return parsed_data

def get_user_id_from_init_data(init_data: str, bot_token: str) -> Optional[int]:
    """Получение user_id из initData с верификацией"""
    if not verify_telegram_init_data(init_data, bot_token):
        return None
    data = parse_telegram_init_data(init_data)
    user_data = data.get('user')
    if user_data and 'id' in user_data:
        return user_data['id']
    
    return None


class CheckTelegramMiddleware:
    async def __call__(self, request : Request):
        """Проверяем отправлен ли запрос с телеграм web app"""
        print("1 Проверяю пришел ли запрос с телеграм Web App")
        init_data : str | None = request.headers.get("X-Telegram-Init-Data")
        if not init_data:
            raise HTTPException(detail="init data не передан", status_code=401)
        user_id = get_user_id_from_init_data(init_data, settings.TOKEN_BOT)
        return str(user_id)


class AuthMiddleware:
    async def __call__(self, request : Request, user_id : str = Depends(CheckTelegramMiddleware())):
        """проверяем пользователя"""
        print("2 Аунтификация пользователя", request)
        user = await Users.objects.get_by_field("telegram_id", user_id)
        if not user:
            raise HTTPException(detail="Вы не зарегестрированны", status_code=401)
        return user


class AdminPermissionMiddleware:
    async def __call__(self, request : Request, user : Users = Depends(AuthMiddleware())):
        """Проверяем права доступа"""
        print("3 Поверка прав пользователя", request, user)
        if not user.is_admin:
            raise HTTPException(detail="Недостаточно прав", status_code=403)
        return request


puplic_router = APIRouter(prefix="/api", tags=["puplic"], dependencies=[Depends(CheckTelegramMiddleware())])
private_router = APIRouter(prefix="/api", tags=["private"], dependencies=[Depends(AuthMiddleware())])
admin_router  = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(AdminPermissionMiddleware())])


puplic_router.include_router(user_router)
puplic_router.include_router(application_router)
puplic_router.include_router(public_application_router_v2)


private_router.include_router(private_user_router)
private_router.include_router(private_user_router_v2)


admin_router.include_router(admin_application_router)
admin_router.include_router(admin_application_router_v2)
