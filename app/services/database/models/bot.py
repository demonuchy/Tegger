import os
import sys
from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models.base import Base


class Bot(Base):
    __tablename__ = "bot"
    __table_args__ = {'extend_existing': True}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_name : Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password : Mapped[str] = mapped_column(String, unique=True, nullable=False)
