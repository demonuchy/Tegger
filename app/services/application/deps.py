import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.application.service import ApplicationService
from app.services.database.models.user import UsersLatest
from app.services.database.models.applications import ApplicationsLatest

async def get_application_service() -> ApplicationService:
    return ApplicationService(UsersLatest, ApplicationsLatest)
