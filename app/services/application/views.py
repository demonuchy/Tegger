import os
import sys
from fastapi import APIRouter
from fastapi.responses import JSONResponse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.schem import AplicationRequest
from services.bot.bot_aiogram import send_application_notifications, send_message
from app.services.database.models.applications import Applications, Users


application_router = APIRouter(prefix="/api/application", tags=["application"])


@application_router.post('')
async def submit(data : AplicationRequest):
    """Хук для отправки заявки"""
    user = await Users.objects.exists(telegram_id = data.telegram_id)
    if user:
        await send_message(data.telegram_id, "Вы уже зарегестрированы")
        return JSONResponse(content={"details" : "Пользователь уже существует"}, status_code=400)
    applications = await Applications.objects.filter(telegram_id = data.telegram_id, status = 'active')
    if applications:
        await send_message(data.telegram_id, "Вы уже отправили заявку")
        return JSONResponse(content={"details" : "Вы уже отправили заявку"}, status_code=400)
    application : Applications = await Applications.objects.create(**data.model_dump())
    await send_application_notifications(
                                    id=application.id, 
                                    full_name=application.full_name, 
                                    phone_number=application.phone_number, 
                                    telegram_user_name=application.telegram_user_name
                                    )
    await send_message(application.telegram_id, "✅ Заявка отправлена\nВам придет уведомление когда заявка будет рассмотрена")
    return JSONResponse(content={"details" : "ваша заявка отправлена"}, status_code=200)
    
