import os
import sys

from typing import Any, Callable, Dict, Awaitable
from aiogram import F, BaseMiddleware, Router
from aiogram.types import  CallbackQuery, Update



sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cors.settings import settings
from app.services.database.models.applications import Applications, Users
from bot.sertalizer import ApplicationSerializer, ApplicationModelSerealizer, UserModelSerializetr
from bot.schem import AplicationRequest, ApplicationScheme, UserSheme


admin_router = Router()


class MyMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Update, Dict[str, Any]], Awaitable[Any]],
        event: Update,
        data: Dict[str, Any]
    ) -> Any:
        root_user  = await  Users.objects.get_by_field(field_name="telegram_id", value=str(event.from_user.id))
        if root_user is None:
            await event.answer("Вы не зарегестрированы в приложении действие отклонено")
            return
        root_user_serializer = UserModelSerializetr()
        root_user : UserSheme = root_user_serializer.dump_to_pydantic(root_user, pydantic_model=UserSheme)
        if not (root_user.is_active or root_user.is_admin):
            await event.answer("Вы не имеете прав администратора действие отклонено")
            return
        result = await handler(event, data)
        return result


@admin_router.callback_query(F.data.startswith('accept_'))
async def application_accept_handler(callback : CallbackQuery):
    """Принимаем заявку от пользователя"""
    application_id = int(callback.data.split("_")[1])
    application : Applications = await  Applications.objects.get(application_id)
    if not application or not (hasattr(application, 'is_active') and application.is_active):
        await callback.answer("Заявка не найдена")
        return 
    application_schema : ApplicationScheme = ApplicationModelSerealizer().dump_to_pydantic(application, pydantic_model=ApplicationScheme)
    user = await Users.objects.exists(telegram_id =  application_schema.telegram_id)
    if user:
        await callback.answer("Пользователь уже заригестрирован видимо заявка устарела")
        return
    await Users.objects.create(**application_schema.model_dump())
    await callback.message.delete()
    await application.accept()
    await callback.bot.send_message(application_schema.telegram_id, "✅ Ваша заявка на вступление принята")


@admin_router.callback_query(F.data.startswith('reject_'))
async def application_reject_handler(callback : CallbackQuery):
    """Откланяем заявку пользователя"""
    application_id = int(callback.data.split("_")[1])
    application  : Applications = await Applications.objects.get(application_id)
    application_schema: ApplicationScheme = ApplicationModelSerealizer().dump_to_pydantic(application, pydantic_model=ApplicationScheme)
    await callback.message.delete()
    await application.reject()
    await callback.bot.send_message(application_schema.telegram_id, "❌ К сожалению ваша заявка отклонена")
