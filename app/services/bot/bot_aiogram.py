import os
import sys
import asyncio
import logging
import json
from typing import Any, Callable, Dict, Awaitable
from aiogram import Bot, Dispatcher, types, F, BaseMiddleware
from aiogram.filters import Command
from aiogram.types import WebAppInfo, ContentType, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery, Message, Update
from aiogram.utils.keyboard import InlineKeyboardBuilder


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cors.settings import settings
from app.services.database.models.applications import Applications, Users
from app.shared.sertalizer import ApplicationSerializer, UserModelSerializetr
from bot.schem import AplicationRequest, ApplicationScheme, UserSheme
from bot.views import admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEBHOOK_PATH = f"/bot/{settings.TOKEN_BOT}"
WEBHOOK_URL = f"{settings.WEBHOOK_TUNNEL_URL}{WEBHOOK_PATH}"


bot = Bot(token=settings.TOKEN_BOT)
dp = Dispatcher()
dp.include_router(admin_router)


logger = logging.getLogger(__name__)


@dp.message(Command("start"))
async def cmd_start(message: Message):
    """Простая команда start с WebApp кнопкой"""
    builder = InlineKeyboardBuilder()
    builder.button(
        text="📱 Открыть приложение", 
        web_app=WebAppInfo(url=settings.WEB_APP_URL)
    )
    await message.answer(
        "👋 Привет!\n\n"
        "Открой приложение и стань частью нашего отряда",
        reply_markup=builder.as_markup()
    )
 
@dp.message(F.content_type == ContentType.WEB_APP_DATA)
async def parse_data(message: types.Message):
    """Обработка sendData"""
    data = AplicationRequest(**json.loads(message.web_app_data.data))
    applications = await Applications.objects.filter(telegram_id = data.telegram_id)
    if applications and any(application.is_active for application in applications):
        return await message.answer("Вы уже отправили заявку")
    application = await Applications.objects.create(**data.model_dump())
    appication_serializer = ApplicationSerializer()
    application = appication_serializer.dump(application)
    await send_application_notifications(**application)
    return await message.answer("Отлично заявка отправлена\nЖдем одобрения")


async def set_webhook():
    """Установка вебхука"""
    await bot.set_webhook(
        url=WEBHOOK_URL,
        secret_token=settings.SECRET_TOKEN,
        drop_pending_updates=True,
        allowed_updates=["message", "callback_query", "web_app_data"]
    )
    logger.info(f"✅ Вебхук установлен: {WEBHOOK_URL}")


async def delete_webhook():
    """Удаление вебхука"""
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("❌ Вебхук удален")


async def send_application_notifications(id, full_name, phone_number, telegram_user_name):
    """Отпрвляем уведомление админу о новой заявке"""
    inline_keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
                [
                    InlineKeyboardButton(text="✅ Принять", callback_data=f"accept_{id}"),
                    InlineKeyboardButton(text="❌ Отклонить", callback_data=f"reject_{id}")
                ]
            ]
        )                   
    await bot.send_message(
        7052499758, 
        f"Новая заявка\nФИО : {full_name}\nНомер телефона : {phone_number}\nTelegram : @{telegram_user_name}", 
        reply_markup=inline_keyboard
    )

async def send_message(chat_id, text):
    await bot.send_message(chat_id, text)