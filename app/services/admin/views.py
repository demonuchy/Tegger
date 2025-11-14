import os
import sys
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database.models.applications import Applications, Users
from shared.sertalizer import ApplicationModelSerealizer



addmin_router = APIRouter(prefix="/api/admin", tags=["application"])


@addmin_router.get('/applications')
async def view_active_application(status : str):
    applications = await Applications.objects.filter(is_active = status)
    if not applications:
        return JSONResponse({"details" : "Активных заявок пока нет"}, status_code=404)
    return JSONResponse({"details" : "ok", "applications" : ["1", "2"]}, status_code=200)


@addmin_router.patch('/application/{application_id}')
async def accept_application(application_id : int, status : str):
    application : Optional[Applications] = await Applications.objects.get(application_id)
    if not application:
        return JSONResponse({'details':'заявка не найдена'}, status_code=404)
    if application.status != 'active':
        return JSONResponse({'details':'pass'}, status_code=400)
    if status == 'accept':
        user = await Users.objects.exists(telegram_id = application.telegram_id)
        if user: return JSONResponse({'details':'Пользователь уже зарегестрирован'}, status_code=400)
        await Users.objects.create(
            full_name=application.full_name, 
            phone_number=application.phone_number, 
            telegram_id=application.telegram_id, 
            telegram_user_name=application.telegram_user_name
            )
    elif status == 'reject': pass
    else: return JSONResponse({"details":"неверный статус"}, status_code=400)
    application.status = status
    await application.save()
    return JSONResponse({'details': 'ok'}, status_code=200)
    










