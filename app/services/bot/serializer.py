import os
import sys
from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.applications import Users

class UserModelSerializer(SQLAlchemyAutoSchema):
    class Meta:
        model = Users
        load_instance = True
        exclude = ('id', 'telegram_id', 'telegram_user_name', 'is_active', 'is_admin', 'created_at', 'updated_at',)