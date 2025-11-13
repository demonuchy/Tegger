import os
import sys
from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database.models.auth import Applications, Users


class ApplicationSerializer(SQLAlchemyAutoSchema):
    """Сереалайзер в dict для модели заявки """
    class Meta:
        model = Applications
        load_instance = True
        exclude = ('is_accepted', 'is_active', 'created_at',)


class ApplicationModelSerealizer(SQLAlchemyAutoSchema):
    """Сереалайзер в pydantic модель для модели заявки """
    class Meta:
        model = Applications
        load_instance = True
        exclude = ( 'is_accepted', 'is_active','created_at',)

    def dump_to_pydantic(self, obj, *, pydantic_model, many=False, **pydantic_kwargs):
        """метод для сериализации в Pydantic модель"""
        serialized_data = self.dump(obj, many=many)
        if many:
            return [pydantic_model(**item, **pydantic_kwargs) for item in serialized_data]
        else:
            return pydantic_model(**serialized_data, **pydantic_kwargs)
    
    
class UserModelSerializetr(SQLAlchemyAutoSchema):
    """Сереалайзер в pydantic модель для модели заявки """
    class Meta:
        model = Users
        load_instance = True
        exclude = ('created_at', 'updated_at',)

    def dump_to_pydantic(self, obj, *, pydantic_model, many=False, **pydantic_kwargs):
        """метод для сериализации в Pydantic модель"""
        serialized_data = self.dump(obj, many=many)
        if many:
            return [pydantic_model(**item, **pydantic_kwargs) for item in serialized_data]
        else:
            return pydantic_model(**serialized_data, **pydantic_kwargs)

