import os
import sys
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.schem import AplicationRequest
from services.bot.bot_aiogram import send_application_notifications, send_message
from app.services.database.models.applications import ApplicationsLatest
from app.services.database.models.user import UsersLatest
from app.services.application.serializer import ApplicationModelSerializetr


class ApplicationService:
    
    async def submit_an_application(data : AplicationRequest):
        user  : Optional[UsersLatest] = await UsersLatest.objects.exists(telegram_id = data.telegram_id)
        if user:
            raise HTTPException(400, "Пользователь уже существует")
        applications = await ApplicationsLatest.objects.filter(telegram_id = data.telegram_id, status = 'active')
        if applications:
            raise HTTPException(400, "Вы уже отправили заявку")
        application : ApplicationsLatest = await ApplicationsLatest.objects.create(**data.model_dump())
        return application
    
    async def accept_application(application_id: int):
        application : Optional[ApplicationsLatest] = await ApplicationsLatest.objects.get(application_id)
        if not application:
            raise HTTPException(404, 'Заявка не найдена')
        if application.status != 'active':
            raise HTTPException(400, 'Заявка не активна')
        if await UsersLatest.objects.exists(telegram_id=application.telegram_id):
            await application.reject()
            raise HTTPException(400, 'Пользователь уже зарегистрирован')
        await UsersLatest.objects.create(
            full_name=application.full_name, 
            phone_number=application.phone_number, 
            telegram_id=application.telegram_id, 
            telegram_user_name=application.telegram_user_name,
            # Дописать поля
            )
        await application.accept()
        application.telegram_id
    
    async def reject_application(application_id: int):
        application : Optional[ApplicationsLatest] = await ApplicationsLatest.objects.get(application_id)
        if not application:
            raise HTTPException(404, 'Заявка не найдена')
        if application.status != 'active':
            raise HTTPException(400, 'Заявка не активна')
        await application.reject()
        return application.telegram_id

    async def get_applications_by_status(status : str):
        applications = await ApplicationsLatest.objects.filter(status = status)
        if not applications:
            raise HTTPException(404, "Активных заявок пока нет")
        application_serializer = ApplicationModelSerializetr()
        applications : dict = application_serializer.dump(applications, many=True)
        return applications
    

