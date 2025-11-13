from pydantic import BaseModel, Field


class AplicationRequest(BaseModel):
    """Модель запроса для подачи заявки"""
    full_name : str
    telegram_id : str
    telegram_user_name : str
    phone_number : str
    
class ApplicationScheme(BaseModel):
    """Схема модели заявки"""
    id: int
    # Паспортные данные ...
    full_name: str 
    phone_number: str
    # Telegram данные
    telegram_id: str
    telegram_user_name: str
  

class UserSheme(BaseModel):
    id: int
    # Паспортные данные ...
    full_name: str 
    phone_number: str
    # Telegram данные
    telegram_id: str
    telegram_user_name: str
    # metadata
    status : str
    is_admin : bool
    is_active :bool


