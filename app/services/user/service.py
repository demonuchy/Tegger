import os
import sys
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.user import UsersLatest
from app.services.user.serializer import UserModelSerializer, ExtendUserModelSerializer



class UserService:

    def __init__(self, user_model  : UsersLatest):
        self.user_model = user_model

    async def get_me(self, user_id : int, user_serializer = ExtendUserModelSerializer()):
        user : Optional[UsersLatest] = await self.user_model.objects.get(user_id)
        if not user:
            raise HTTPException(404, "Пользователь ненайден")
        user : dict = user_serializer.dump(user)
        return user
    
    async def update_fields(self, user_id, **filds):
        self.user_model.objects.update(id = user_id, **filds)