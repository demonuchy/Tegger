import os
import sys
from fastapi import HTTPException
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.schem import ExtendedApplicationRequest, ApplicationRequestV2
from app.services.database.models.applications import ApplicationsLatest
from app.services.database.models.user import UsersLatest
from app.services.application.serializer import ApplicationModelSerializetr, ExtendApplicationModelSerializetr, ApplicationToUserSerializer


class ApplicationService:

    def __init__(self, user_model : UsersLatest, application_model : ApplicationsLatest):
        self.user_model = user_model
        self.application_model = application_model

    async def submit_an_application(self, data : ApplicationRequestV2):
        user  : Optional[UsersLatest] = await self.user_model.objects.exists(telegram_id = data.telegram_id)
        if user:
            raise HTTPException(400, "Пользователь уже существует")
        applications = await self.application_model.objects.filter(telegram_id = data.telegram_id, status = 'active')
        if applications:
            raise HTTPException(400, "Вы уже отправили заявку")
        application : ApplicationsLatest = await self.application_model.objects.create(**data.model_dump())
        return application
    
    async def accept_application(self, application_id: int, application_serializer = ApplicationToUserSerializer()):
        application : Optional[ApplicationsLatest] = await self.application_model.objects.get(application_id)
        if not application:
            raise HTTPException(404, 'Заявка не найдена')
        if application.status != 'active':
            raise HTTPException(400, 'Заявка не активна')
        if await self.user_model.objects.exists(telegram_id=application.telegram_id):
            await application.reject()
            raise HTTPException(400, 'Пользователь уже зарегистрирован')
        application_serialize_data = application_serializer.dump(application)
        await self.user_model.objects.create(**application_serialize_data)
        await application.accept()
        return application
    
    async def reject_application(self, application_id: int):
        application : Optional[ApplicationsLatest] = await self.application_model.objects.get(application_id)
        if not application:
            raise HTTPException(404, 'Заявка не найдена')
        if application.status != 'active':
            raise HTTPException(400, 'Заявка не активна')
        await application.reject()
        return application
    
    async def get_applications_by_status(self, status : str, application_serializer = ExtendApplicationModelSerializetr()):
        applications = await self.application_model.objects.filter(status = status)
        if not applications:
            raise HTTPException(404, "Активных заявок пока нет")
        applications : dict = application_serializer.dump(applications, many=True)
        return applications
    

