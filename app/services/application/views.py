import os
import sys
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from application.schem import AplicationRequest, ExtendedApplicationRequest
from services.bot.bot_aiogram import send_application_notifications, send_message
from app.services.database.models.applications import Applications, Users
from app.services.application.serializer import ApplicationModelSerializetr
from app.services.depends import handle_errors
from app.services.depends import get_application_service
from app.services.application.service import ApplicationService

application_router = APIRouter(prefix="/application")


@application_router.post('')
async def submit_application(data : AplicationRequest):
    """Хук для отправки заявки"""
    user  : Optional[Users] = await Users.objects.exists(telegram_id = data.telegram_id)
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
    

admin_application_router = APIRouter(prefix="/application")



@admin_application_router.get('')
async def view_active_application(status : str):
    """получаем все заявки по статусу"""
    applications = await Applications.objects.filter(status = status)
    if not applications:
        return JSONResponse({"details" : "Активных заявок пока нет"}, status_code=404)
    application_serializer = ApplicationModelSerializetr()
    applications : dict = application_serializer.dump(applications, many=True)
    return JSONResponse({"details" : "ok", "applications" : applications}, status_code=200)


@admin_application_router.patch('/{application_id}')
async def change_status_application(application_id : int, status : str):
    """Меняем статус заявк принимаем либо откланяем"""
    application : Optional[Applications] = await Applications.objects.get(application_id)
    if not application:
        return JSONResponse({'details':'заявка не найдена'}, status_code=404)
    if application.status != 'active':
        print('заявка не активна')
        return JSONResponse({'details':'заявка не активна'}, status_code=400)
    if status == 'accept':
        user = await Users.objects.exists(telegram_id = application.telegram_id)
        if user: 
            await application.reject()
            print('Пользователь уже зарегестрирован')
            return JSONResponse({'details':'Пользователь уже зарегестрирован'}, status_code=400)
        await Users.objects.create(
            full_name=application.full_name, 
            phone_number=application.phone_number, 
            telegram_id=application.telegram_id, 
            telegram_user_name=application.telegram_user_name
            )
        await send_message(application.telegram_id, "Ваша заявка принята")
    elif status == 'reject': 
        await send_message(application.telegram_id, "К сожалению ваша заявка отклонена")
    else: 
        print('неверный статус')
        return JSONResponse({"details":"неверный статус"}, status_code=400)
    application.status = status
    await application.save()
    return JSONResponse({'details': 'ok'}, status_code=200)




public_application_router_v2 = APIRouter(prefix="/application/v2")


@public_application_router_v2.post('')
async def submit_an_application(data : ExtendedApplicationRequest, background : BackgroundTasks, service : ApplicationService = Depends(get_application_service)):
    try:
        await service.submit_an_application(data)
        return JSONResponse({"details" : "ok"}, status_code=200, background=background)
    except HTTPException as e:
        return JSONResponse({"details" : e.detail}, status_code=e.status_code) 





admin_application_router_v2 = APIRouter(prefix="/application/v2")


@admin_application_router_v2.patch('/{application_id}/accept')
async def accept_application(application_id : int, background : BackgroundTasks, service : ApplicationService = Depends(get_application_service)):
    try:
        await service.accept_application(application_id)
        return JSONResponse({"details" : "ok"}, status_code=200)
    except HTTPException as e:
        return JSONResponse({"details" : e.detail}, status_code=e.status_code)


@admin_application_router_v2.patch('/{application_id}/reject')
async def reject_application(application_id : int, background : BackgroundTasks, service : ApplicationService = Depends(get_application_service)):
    try:
        await service.reject_application(application_id)
        return JSONResponse({"details" : "ok"}, status_code=200)
    except HTTPException as e:
        return JSONResponse({"details" : e.detail}, status_code=e.status_code)


@admin_application_router_v2.get('')
async def get_applications_by_status(status : str, service : ApplicationService = Depends(get_application_service)):
    try:
        applications = await service.get_applications_by_status(status)
        return JSONResponse({"details" : "ok", "applications" : applications}, status_code=200)
    except HTTPException as e:
        return JSONResponse({"details" : e.detail}, status_code=e.status_code)


    
