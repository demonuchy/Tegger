import os
import sys
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from typing import Optional, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.schem import AplicationRequest, ApplicationScheme
from services.bot.bot_aiogram import send_application_notifications, send_message
from app.services.database.models.applications import Applications, Users
from app.services.database.models.admin import Admins
from app.shared.sertalizer import ApplicationSerializer, ApplicationModelSerealizer
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request


class MyAuthBackend(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        """Вызывается при попытке входа в SQLAdmin"""
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        print(f"Login attempt: {username}")
        admin = await Admins.objects.get_by_field("user_name", username)
        if not admin:
            print("Admin not found")
            return False
        if admin.password != password:
            print("Invalid password")
            return False
        request.session.update({
            "user_id": str(admin.id),
            })
        print(f"Login successful for {request.session}")
        return True

    async def logout(self, request: Request) -> bool:
        """Вызывается при выходе из SQLAdmin"""
        request.session.clear()
        print("Logout completed")
        return True

    async def authenticate(self, request: Request) -> bool:
        """Проверяет аутентификацию для каждого запроса SQLAdmin"""
        print(f"Authenticate called for: {request.url.path}")
        print(f"Все ключи в request.session: {list(request.session.keys())}")
        print(f"Session data: {request.session}")
        if "user_id" in request.session.keys():
            root_id : Optional[int] = int(request.session.get("user_id"))
            if not root_id:
                return False
            root : Optional[Admins] = await Admins.objects.get(root_id)
            if not root:
                return False
            return True
        return False