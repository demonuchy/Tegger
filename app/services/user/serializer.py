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



class ManyUserSerializer(SQLAlchemyAutoSchema):
    class Meta:
        model = UsersLatest
        exclude = (
            'id',
             'created_at', 
             'telegram_id', 
             'telegram_user_name',
             'is_active',
             'is_admin',
             'updated_at', 
             'full_name',
             'passport_series',
             'passport_number',
             'actual_address',
             'address_registered',
             'educational_group',
             'educational_faculty',
             'creative_skills', 
             )


class ExtendUserModelSerializer(SQLAlchemyAutoSchema):
     class Meta:
        model = UsersLatest
        load_instance = True