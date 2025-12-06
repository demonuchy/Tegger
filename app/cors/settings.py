from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import  ConfigDict




class Settings(BaseSettings):
    """Настройкт проекта"""

    DB_USER : str
    DB_PASS : str
    DB_HOST : str
    DB_NAME : str
    DB_PORT : int


    API_ID : str
    API_HASH : str
    TOKEN_BOT : str
    WEBHOOK_SECRET_TOKEN : str


    WEBHOOK_TUNNEL_URL : str
    WEB_APP_URL : str

    
    ADMIN_SECRET_TOKEN : str


    TOKEN_ENCODE_ALGORITHM : str
    JWT_SECRET_KEY : str
    EXPAIR_ACCSES_TIME : int

    @property
    def AsyncDataBaseUrl(self):
        """Url для подключения к базе данных"""
        uri = f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        print(f"URI DB CONNECT {uri}")
        return uri

    model_config = ConfigDict(
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_nested_delimiter="__"
    )


settings = Settings()