from pydantic import BaseModel, Field


class AplicationRequest(BaseModel):
    """Модель запроса для подачи заявки"""
    full_name : str
    telegram_id : str
    telegram_user_name : str
    phone_number : str
    
