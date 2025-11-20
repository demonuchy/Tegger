import os
import sys
import asyncio
import json
import uvicorn  
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from starlette.middleware.sessions import SessionMiddleware

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aiogram.types import Update
from services.bot.bot_aiogram import bot, dp, set_webhook, delete_webhook, WEBHOOK_PATH

from services.database.middleware import db_session_middleware, DBSessionMiddleware
from services.database.config import create_all_tables, drop_all_tables
from services.database.models.base import Base

from services.auth.views import  puplic_router, private_router, admin_router
from services.database.config import engine
from services.admin_panel.setup import AdminSetup
from services.admin_panel.middleware import AdminAuthMiddleware, admin_auth_middleware
from cors.middlevare import MiddlewareRouter
from cors.settings import settings


async def start_app():
    """Запуск приложения"""
    try:
        print("start server")
        status = await create_all_tables()
        print(f"Create tables: {status}")
        await set_webhook()
        print("successful start")
    except Exception as e:
        print(f"Error starting app: {e}")


async def stop_app():
    """Остановка приложения"""
    try: 
        print("stop server")
        await delete_webhook()
        await bot.session.close()
    except Exception as e:
        print(f"Error while closing client stream: {e}")
    finally:
        print("successful stop")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Жизненный цикл"""
    await start_app()
    yield
    await stop_app()


app = FastAPI(lifespan=lifespan)


#app.add_middleware(AdminAuthMiddleware)
app.add_middleware(DBSessionMiddleware)

app.add_middleware(
    SessionMiddleware,
    secret_key="your-very-secret-key-change-in-production",  # Обязательно измените!
    session_cookie="sqladmin_session",  # Ваше название куки
    max_age=3600 * 24,  # 24 часа (настройте по необходимости)
    https_only=False,  # True для production с HTTPS
    same_site="lax"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bereg-dona.vercel.app", "https://bdapp.loca.lt"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(puplic_router)
app.include_router(private_router)
app.include_router(admin_router)

admin = AdminSetup(app, engine)


@app.post(WEBHOOK_PATH)
async def bot_webhook(request : Request, update: dict):
    """Обработка всех событий бота"""
    try:
        print(request.headers)
        telegram_update = Update(**update)
        await dp.feed_webhook_update(bot, telegram_update)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error"}
    

if __name__ == "__main__":
    uvicorn.run("app.main:app", port=8000, host="0.0.0.0", reload=True)