import os
import sys
from fastapi import APIRouter
from fastapi.responses import JSONResponse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth.schem import AplicationRequest, ApplicationScheme
from services.bot.bot_aiogram import send_application_notifications, send_message
from services.database.models.auth import Applications
from auth.sertalizer import ApplicationSerializer, ApplicationModelSerealizer

auth_router = APIRouter(prefix="/api/auth", tags=["Pub"])


@auth_router.post('/application')
async def login(data : AplicationRequest):
    """Хук для отправки заявки"""
    appication_serializer = ApplicationModelSerealizer()
    applications = await Applications.objects.filter(telegram_id = data.telegram_id)
    if applications and any(application.is_active or application.is_accepted for application in applications):
        applications = appication_serializer.dump_to_pydantic(applications, pydantic_model=ApplicationScheme, many=True)
        print(applications)
        await send_message(applications[0].telegram_id, "Вы уже отправили заявку")
        return JSONResponse(content={"details" : "Вы уже отправили заявку"}, status_code=400)
    application = await Applications.objects.create(**data.model_dump())
    application = appication_serializer.dump(application)
    await send_application_notifications(**application)
    await send_message(int(application.get('telegram_id')), "✅ Заявка отправлена\nВам придет уведомление когда заявка будет рассмотрена")
    return JSONResponse(content={"details" : "ваша заявка отправлена"}, status_code=200)
    