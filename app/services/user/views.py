import os
import sys
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.applications import  Users
from app.services.user.serializer import UserModelSerializer



user_router = APIRouter(prefix="/users")


@user_router.get("/check/{telegram_id}")
async def pre_check_user(telegram_id : str):
    user : Optional[Users] = await Users.objects.exists(telegram_id = telegram_id)
    if not user:
        return JSONResponse({"details" : "Пользователь ненайден", "is_user" : False}, status_code=404)
    return JSONResponse({"details" : "Пользователь найден", "is_user" : True}, status_code=200)


private_user_router = APIRouter(prefix="/users")


@private_user_router.get("/me")
async def pre_check_user(telegram_id : str):
    user : Optional[Users] = await Users.objects.get_by_field("telegram_id", telegram_id)
    if not user:
        return JSONResponse({"details" : "Пользователь ненайден"}, status_code=404)
    user_serializer = UserModelSerializer()
    user : dict = user_serializer.dump(user)
    return JSONResponse({"details" : "Пользователь найден", "user" : user}, status_code=200)




