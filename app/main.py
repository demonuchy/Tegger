import os
import sys
import asyncio
import json
import uvicorn  
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from telethon import events, types
from sqladmin import Admin, ModelView

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aiogram.types import Update
from services.bot.bot_aiogram import bot, dp, set_webhook, delete_webhook, WEBHOOK_PATH

from services.database.middleware import db_session_middleware
from services.database.config import create_all_tables, drop_all_tables
from services.database.models.base import Base

from services.application.views import auth_router
from services.database.config import engine
from services.admin.setup import AdminSetup


async def start_app():
    """Запуск приложения"""
    try:
        print("start server")
        await create_all_tables()
        print("Create tables")
        await set_webhook()
        print("successful start")
    except Exception as e:
        print(f"Error starting app: {e}")


async def stop_app():
    """Остановка приложения"""
    try: 
        print("stop server")
        #await drop_all_tables()
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

admin = AdminSetup(app, engine)


app.middleware("http")(db_session_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://bdfront.loca.lt",
        "https://bdapp.loca.lt"
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)

@app.post(WEBHOOK_PATH)
async def bot_webhook(request : Request, update: dict):
    """Обработка всех событий бота"""
    try:
        telegram_update = Update(**update)
        await dp.feed_webhook_update(bot, telegram_update)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error"}
    

if __name__ == "__main__":
    uvicorn.run("app.main:app", port=8000, host="0.0.0.0", reload=True)