from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    """Request obj to login"""
    user_name : str
    password : str
