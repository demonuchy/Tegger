import os
import sys
from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models.base import Base


class Applications(Base):
    """Модель заявки на всупление"""
    __tablename__ = "application_legacy"
    __table_args__ = {'extend_existing': True}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    # Паспортные данные mapped_column()
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    phone_number: Mapped[str] = mapped_column(String, nullable=False)
    # Telegram данные
    telegram_id: Mapped[str] = mapped_column(String, nullable=False)  
    telegram_user_name: Mapped[str] = mapped_column(String, nullable=False)  
    # metadata
    status : Mapped[str] = mapped_column(String, nullable=False, default='active')
    #is_accepted : Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    #is_active : Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())  

    async def accept(self):
        """Принимаем заявку"""
        self.status = 'accept'
        await self.save()
    
    async def reject(self):
        """Отклоняем заявку"""
        self.status = 'reject'
        await self.save()



class ApplicationsLatest(Base):
    """Модель заявки на всупление"""
    __tablename__ = "applications"
    __table_args__ = {'extend_existing': True}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    # Паспортные данные mapped_column()
    full_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # доп данные
    creative_skills :Mapped[str] = mapped_column(String, nullable=True)
    phone_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # Telegram данные
    telegram_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)  
    telegram_user_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)    
    #vk 
    vk_username : Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # metadata
    status : Mapped[str] = mapped_column(String, nullable=False, default='active')
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())  

    async def accept(self):
        """Принимаем заявку"""
        self.status = 'accept'
        await self.save()
    
    async def reject(self):
        """Отклоняем заявку"""
        self.status = 'reject'
        await self.save()










class Users(Base):
    """Модель пользователя"""
    __tablename__ = "users_legacy"
    __table_args__ = {'extend_existing': True}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    # Паспортные данные ...
    full_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    phone_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # Telegram данные
    telegram_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)  
    telegram_user_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)  
    # metadata
    
    is_active : Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_admin : Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status : Mapped[str] = mapped_column(String, nullable=False , default="Кандидат")
    updated_at : Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    created_at : Mapped[DateTime] = mapped_column(DateTime, server_default=func.now()) 
    
    
