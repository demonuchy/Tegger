import os
import sys
from sqladmin import Admin, ModelView

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database.models.applications import Applications, Users, ApplicationsLatest
from services.database.models.user import UsersLatest

class AdminManage:
    USER = UsersLatest
    APPLICATION = ApplicationsLatest


class UserAdmin(ModelView, model=AdminManage.USER):
    name = "Пользователь"
    name_plural = "Пользователи"
    column_list = [
        AdminManage.USER.id, 
        AdminManage.USER.telegram_id,
        AdminManage.USER.telegram_user_name, 
        AdminManage.USER.full_name, 
        AdminManage.USER.phone_number, 
        AdminManage.USER.is_active, 
        AdminManage.USER.is_admin,
       
    ]
    exclude_list = [AdminManage.USER.created_at, AdminManage.USER.updated_at]
    form_readonly_columns = [
        AdminManage.USER.id,
        AdminManage.USER.telegram_user_name,
        AdminManage.USER.telegram_id,
        AdminManage.USER.created_at
    ]
        

class ApplicationAdmin(ModelView, model=AdminManage.APPLICATION):
    name = "Заявка"
    name_plural = "Заявки"
    column_list = [
        AdminManage.APPLICATION.id, 
        AdminManage.APPLICATION.telegram_id,
        AdminManage.APPLICATION.telegram_user_name, 
        AdminManage.APPLICATION.full_name, 
        AdminManage.APPLICATION.phone_number, 
        AdminManage.APPLICATION.status
    ]
    exclude_list = [AdminManage.APPLICATION.created_at]
    form_readonly_columns = [
        AdminManage.APPLICATION.id,
        AdminManage.APPLICATION.telegram_user_name,
        AdminManage.APPLICATION.telegram_id,
        AdminManage.APPLICATION.created_at
    ]