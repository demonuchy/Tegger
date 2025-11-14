from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    user_name : str
    password : str
