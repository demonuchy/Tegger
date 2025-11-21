import os
import sys
from fastapi import HTTPException
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.schem import ExtendedApplicationRequest
from app.services.database.models.applications import ApplicationsLatest
from app.services.database.models.user import UsersLatest
from app.services.application.serializer import ApplicationModelSerializetr, ExtendApplicationModelSerializetr


class ApplicationService:

    @staticmethod
    async def submit_an_application(data : ExtendedApplicationRequest):
        user  : Optional[UsersLatest] = await UsersLatest.objects.exists(telegram_id = data.telegram_id)
        if user:
            raise HTTPException(400, "Пользователь уже существует")
        applications = await ApplicationsLatest.objects.filter(telegram_id = data.telegram_id, status = 'active')
        if applications:
            raise HTTPException(400, "Вы уже отправили заявку")
        application : ApplicationsLatest = await ApplicationsLatest.objects.create(**data.model_dump())
        return application
    
    @staticmethod
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
            # паспортные данные
            full_name = application.full_name, 
            passport_series = application.passport_series,
            passport_number = application.passport_number,
            actual_address = application.actual_address,
            address_registered = application.address_registered,
            # доп данные
            educational_group = application.educational_group,
            educational_faculty = application.educational_faculty,
            creative_skills = application.creative_skills,
            phone_number = application.phone_number,
            # meta data
            telegram_id = application.telegram_id,
            telegram_user_name = application.telegram_user_name
            )
        await application.accept()
        application.telegram_id
    
    @staticmethod
    async def reject_application(application_id: int):
        application : Optional[ApplicationsLatest] = await ApplicationsLatest.objects.get(application_id)
        if not application:
            raise HTTPException(404, 'Заявка не найдена')
        if application.status != 'active':
            raise HTTPException(400, 'Заявка не активна')
        await application.reject()
        return application.telegram_id

    @staticmethod
    async def get_applications_by_status(status : str):
        applications = await ApplicationsLatest.objects.filter(status = status)
        if not applications:
            raise HTTPException(404, "Активных заявок пока нет")
        application_serializer = ExtendApplicationModelSerializetr()
        applications : dict = application_serializer.dump(applications, many=True)
        return applications
    

