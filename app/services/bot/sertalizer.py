import os
import sys
from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database.models.auth import Applications


class ApplicationSerializer(SQLAlchemyAutoSchema):
    class Meta:
        model = Applications
        load_instance = True
        exclude = ('is_accepted', 'is_active', 'created_at',)