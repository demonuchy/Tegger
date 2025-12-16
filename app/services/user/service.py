import os
import sys
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.user import UsersLatest
from app.services.user.serializer import UserModelSerializer, ExtendUserModelSerializer, ManyUserSerializer



class UserService:

    def __init__(self, user_model  : UsersLatest):
        self.user_model = user_model

    async def get_me(self, user, user_serializer = ExtendUserModelSerializer()):
        if not user:
            raise HTTPException(404, "Пользователь ненайден")
        user : dict = user_serializer.dump(user)
        return user
    
    async def get_users(self, user_serializer = ManyUserSerializer()):
        users = self.user_model.objects.filter()
        if not users:
            raise HTTPException(detail="Пользователи не найдены", status_code=404)
        users = user_serializer.dump(users, many=True)
        return users

    async def update_fields(self, user_id, **filds):
        self.user_model.objects.update(id = user_id, **filds)