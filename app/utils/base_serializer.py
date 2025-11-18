import os
import sys
from marshmallow import fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database.models.applications import Applications, User


class BaseModelSerializer(SQLAlchemyAutoSchema):
    """Базовый сериализатор с методом для преобразования в Pydantic модель"""
    def dump_to_pydantic(self, obj, *, pydantic_model, many=False, **pydantic_kwargs):
        """Метод для сериализации в Pydantic модель"""
        serialized_data = self.dump(obj, many=many)
        if many:
            return [pydantic_model(**item, **pydantic_kwargs) for item in serialized_data]
        else:
            return pydantic_model(**serialized_data, **pydantic_kwargs)
