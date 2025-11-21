from pydantic import BaseModel, Field


class AplicationRequest(BaseModel):
    """Модель запроса для подачи заявки"""
    full_name : str
    telegram_id : str
    telegram_user_name : str
    phone_number : str
    

class ExtendedApplicationRequest(BaseModel):
    """Модель запроса для подачи заявки V2"""
    # паспортные данные
    full_name : str
    passport_series : str
    passport_number : str
    actual_address : str
    address_registered : str
    # доп данные
    educational_group : str
    educational_faculty : str
    creative_skills :str
    phone_number : str
    # meta data
    telegram_id : str
    telegram_user_name : str
    


class ApplicationScheme(BaseModel):
    """Схема модели заявки"""
    id: int
    # Паспортные данные ...
    full_name: str 
    phone_number: str
    # Telegram данные
    telegram_id: str
    telegram_user_name: str

    status : str
