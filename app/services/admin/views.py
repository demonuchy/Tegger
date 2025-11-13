import os
import sys
from sqladmin import Admin, ModelView

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database.models.applications import Applications, Users
 

class UserAdmin(ModelView, model=Users):
    name = "Пользователь"
    name_plural = "Пользователи"
    column_list = [
        Users.id, 
        Users.telegram_id,
        Users.telegram_user_name, 
        Users.full_name, 
        Users.phone_number, 
        Users.is_active, 
        Users.is_admin,
       
    ]
    exclude_list = [Users.created_at, Users.updated_at]
    form_readonly_columns = [
        Applications.id,
        Applications.telegram_user_name,
        Applications.telegram_id,
        Applications.created_at
    ]
        

class ApplicationAdmin(ModelView, model=Applications):
    name = "Заявка"
    name_plural = "Заявки"
    column_list = [
        Applications.id, 
        Applications.telegram_id,
        Applications.telegram_user_name, 
        Applications.full_name, 
        Applications.phone_number, 
        Applications.is_active, 
        Applications.is_accepted
    ]
    exclude_list = [Applications.created_at]
    form_readonly_columns = [
        Applications.id,
        Applications.telegram_user_name,
        Applications.telegram_id,
        Applications.created_at
    ]