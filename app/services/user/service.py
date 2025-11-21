import os
import sys
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.user import UsersLatest
from app.services.user.serializer import UserModelSerializer, ExtendUserModelSerializer



class UserService:

    @staticmethod
    async def get_me(telegram_id : str):
        user : Optional[UsersLatest] = await UsersLatest.objects.get_by_field("telegram_id", telegram_id)
        if not user:
            raise HTTPException(404, "Пользователь ненайден")
        user_serializer = ExtendUserModelSerializer()
        user : dict = user_serializer.dump(user)
        return user