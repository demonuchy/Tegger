import os
import sys
from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.applications import Applications, ApplicationsLatest


class ApplicationModelSerializetr(SQLAlchemyAutoSchema):
    """Сереалайзер в pydantic модель для модели заявки """
    class Meta:
        model = Applications
        load_instance = True


class ApplicationToUserSerializer(SQLAlchemyAutoSchema):
    class Meta:
        model = ApplicationsLatest
        load_instance = True
        exclude = ('id', 'status', 'created_at',)



class ExtendApplicationModelSerializetr(SQLAlchemyAutoSchema):
    class Meta:
        model = ApplicationsLatest
        load_instance = True
