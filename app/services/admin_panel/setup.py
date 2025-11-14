import os
import sys
from sqladmin import Admin, ModelView
from typing import List, Type

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.admin_panel.model_views import ApplicationAdmin, UserAdmin
from app.services.admin_panel.views import MyAuthBackend
from app.cors.settings import settings



class AdminSetup:
    def __init__(self, app, engine):
        self.admin = Admin(app, engine, title="BeregDona Admin", base_url="/admin", authentication_backend=MyAuthBackend(secret_key=settings.ADMIN_SECRET_TOKEN))
        self._custom_views: List[Type[ModelView]] = [ApplicationAdmin, UserAdmin]
        self._setup_views()

    def _setup_views(self):
        """Настройка всех View для админки"""
        for view in self._custom_views:
            self.admin.add_view(view)
