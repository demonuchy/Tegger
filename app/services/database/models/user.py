import os
import sys
from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models.base import Base

class UsersLatest(Base):
    """Модель пользователя"""
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    # Паспортные данные
    full_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    passport_series : Mapped[str] = mapped_column(String, nullable=True, unique=True)
    passport_number : Mapped[str] = mapped_column(String, nullable=True, unique=True)
    actual_address : Mapped[str] = mapped_column(String, nullable=True)
    address_registered : Mapped[str] = mapped_column(String, nullable=True)
    # доп данные
    educational_group : Mapped[str] = mapped_column(String, nullable=True)
    educational_faculty : Mapped[str] = mapped_column(String, nullable=True)
    creative_skills :Mapped[str] = mapped_column(String, nullable=True)
    phone_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # Telegram данные
    telegram_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)  
    telegram_user_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)  
    #vk
    vk_username : Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # meta
    is_active : Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_admin : Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status : Mapped[str] = mapped_column(String, nullable=False , default="Кандидат")
    updated_at : Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    created_at : Mapped[DateTime] = mapped_column(DateTime, server_default=func.now()) 
    