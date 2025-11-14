import os
import sys
from typing import Any, Callable, Dict, Awaitable, Optional
from aiogram import F, BaseMiddleware, Router
from aiogram.types import  CallbackQuery, Update, Message, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from app.services.database.models.applications import Applications, Users


admin_router = Router()


class AdminMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Update, Dict[str, Any]], Awaitable[Any]],
        event: Update,
        data: Dict[str, Any]
    ) -> Any:
        user_id = event.from_user.id
        root_user: Optional[Users] = await Users.objects.get_by_field(field_name="telegram_id", value=str(user_id))
        if not root_user or not root_user.is_active or not root_user.is_admin:
            if isinstance(event, Message): await event.answer("❌ У вас нет прав администратора")
            elif isinstance(event, CallbackQuery): await event.message.answer("❌ У вас нет прав администратора", show_alert=True)
            return  
        return await handler(event, data)
    

admin_router.message.middleware(AdminMiddleware())
admin_router.callback_query.middleware(AdminMiddleware())


@admin_router.message(Command("application"))
async def get_active_application(message : Message):
    pass


@admin_router.message(Command('admin'))
async def admin_panel(message : Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Aдмин панель", url=f"https://bdapi.loca.lt/admin")]
            ])
    await message.answer("Нажмите кнопку чтобы открыть ссылку:", reply_markup=keyboard)



@admin_router.callback_query(F.data.startswith('accept_'))
async def application_accept_handler(callback : CallbackQuery, application_id : Optional[int] = None):
    """Принимаем заявку от пользователя"""
    application_id = int(callback.data.split("_")[1])
    application : Applications = await  Applications.objects.get(application_id)
    if not application or application.status != 'active':
        await callback.message.delete()
        return await callback.message.answer("Заявка не найдена или не активна")
    user = await Users.objects.exists(telegram_id =  application.telegram_id)
    if user:
        await callback.answer("Пользователь уже заригестрирован видимо заявка устарела")
        return
    await Users.objects.create(
                            full_name=application.full_name, 
                            phone_number=application.phone_number, 
                            telegram_id=application.telegram_id, 
                            telegram_user_name=application.telegram_user_name
                            )
    await callback.message.delete()
    await application.accept()
    await callback.bot.send_message(application.telegram_id, "✅ Ваша заявка на вступление принята")


@admin_router.callback_query(F.data.startswith('reject_'))
async def application_reject_handler(callback : CallbackQuery, application_id : Optional[int] = None):
    """Откланяем заявку пользователя"""
    application_id = int(callback.data.split("_")[1])
    application  : Applications = await Applications.objects.get(application_id)
    if not application or application.status != 'active':
        await callback.message.delete()
        return await callback.message.answer("Заявка не найдена или не активна")
    await callback.message.delete()
    await application.reject()
    await callback.bot.send_message(application.telegram_id, "❌ К сожалению ваша заявка отклонена")
