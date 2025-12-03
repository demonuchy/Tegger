import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.user import UsersLatest
from app.services.user.service import UserService


async def get_user_service():
    return  UserService(UsersLatest)

