from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import  ConfigDict




class Settings(BaseSettings):

    DB_USER : str
    DB_PASS : str
    DB_HOST : str
    DB_NAME : str
    DB_PORT : int

    API_ID : str
    API_HASH : str
    TOKEN_BOT : str
    WEBHOOK_TUNNEL_URL : str

    @property
    def AsyncDataBaseUrl(self):
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  
    )


settings = Settings()