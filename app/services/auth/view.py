import os
import sys
from fastapi import APIRouter
from fastapi.responses import JSONResponse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth.schem import AplicationRequest
from services.bot.bot_aiogram import send_application_notifications, send_message
from services.database.models.auth import Applications
from auth.sertalizer import ApplicationSerializer

router = APIRouter(prefix="/api/auth", tags=["Pub"])


@router.post('/application')
async def login(data : AplicationRequest):
    """Хук для отправки заявки"""
    applications = await Applications.objects.filter(telegram_id = data.telegram_id)
    if applications and any(application.is_active or application.is_accepted for application in applications):
        return JSONResponse(content={"details" : "Вы уже отправили заявку"}, status_code=400)
    application = await Applications.objects.create(**data.model_dump())
    appication_serializer = ApplicationSerializer()
    application = appication_serializer.dump(application)
    print(application)
    await send_application_notifications(**application)
    await send_message(int(application.get('telegram_id')), "✅ Заявка отправлена\nВам придет уведомление когда заявка будет рассмотрена")
    return JSONResponse(content={"details" : "ваша заявка отправлена"}, status_code=200)
    

@router.post('/login')
async def login():
    pass


@router.post('auth')
async def auth():
    pass