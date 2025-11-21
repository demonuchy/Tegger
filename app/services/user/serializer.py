import os
import sys
from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.applications import Users
from app.services.database.models.user import UsersLatest

class UserModelSerializer(SQLAlchemyAutoSchema):
    class Meta:
        model = Users
        load_instance = True


class ExtendUserModelSerializer(SQLAlchemyAutoSchema):
     class Meta:
        model = UsersLatest
        load_instance = True