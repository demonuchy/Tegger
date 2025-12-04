import os 
import sys
from fastapi import Request
from typing import Optional
from  starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.schem import AplicationRequest, ApplicationScheme
from services.bot.bot_aiogram import send_application_notifications, send_message
from app.services.database.models.applications import Applications, Users

from services.database.context import set_session, reset_session
from services.database.config import async_session
from app.cors.logger.logger import get_logger

logger = get_logger(__name__)

class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info("🔍 2. AdminAuthMiddleware: проверяю права")
        if request.url.path == "/admin":
            user_id = request.query_params.get("user_id")
            if not user_id:
                return JSONResponse({"details": "user_id не передан"}, status_code=400)
            root: Optional[Users] = await Users.objects.get_by_field("telegram_id", user_id)
            if not root:
                return JSONResponse({"details": "root не передан"}, status_code=404)
            if not root.is_admin:
                return JSONResponse({"details": "не хватает прав"}, status_code=403)
            print(await request.body())
            print(request.session, request.url.path)
        response = await call_next(request)
        return response
    

async def admin_auth_middleware(request: Request, call_next):
    print("🔍 2. AdminAuthMiddleware: проверяю права")
    if request.url.path.startswith("/api/admin"):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return JSONResponse({"details": "user_id не передан"}, status_code=400)
        try:
            root: Optional[Users] = await Users.objects.get_by_field("telegram_id", user_id)
            if not root:
                return JSONResponse({"details": "root не передан"}, status_code=404)
            if not root.is_admin:
                return JSONResponse({"details": "не хватает прав"}, status_code=403)
        except Exception as e:
            return JSONResponse({"details": f"Ошибка сервера: {str(e)}"}, status_code=500)
    
    return await call_next(request)