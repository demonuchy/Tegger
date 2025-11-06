import os
import sys
import asyncio
import json
import uvicorn  
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from telethon import events, types

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bot.bot_main import tegger, WEBHOOK_URL, WEBHOOK_PATH




async def start_app():
    try:
        print("start server")
        await tegger.open_client_stream()
        await tegger.setup_webhook(WEBHOOK_URL)
        print("secsesfull start")
    except Exception as e:
        print(e)



async def stop_app():
    print("stop server")
    try: 
        await tegger.close_client_stream()
        await tegger.delete_webhook()
    except Exception as e:
        print(f"Error while closing client stream: {e}")
    finally:
        print("secsesfull stop")


@asynccontextmanager
async def lifespan(app : FastAPI):
    await start_app()
    yield
    await stop_app()


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post(WEBHOOK_PATH)
async def webhook_handler(request: Request):
    data = await request.json()
    try:
        update = tegger.create_update_from_data(data)
        await tegger.client._dispatch_event(update)
    except Exception as e:
        print(f"Error processing update: {e}")
    return {"status": 200}


@tegger.on(events.NewMessage(pattern="/start"))
async def command_all(event):
    print("Worck")
    try:
       await tegger.send_webapp_button(event.chat_id)
    except Exception as e:
        print(f"Ошибка в обработчике команды /all: {e}")


@tegger.on(events.Raw(types.UpdateBotWebhookJSONQuery))
async def handle_webapp_data(event):
    data = json.loads(event.data)
    print("Данные:", data)


@tegger.on(events.NewMessage(pattern="/all"))
async def command_all(event):
    print("Worck")
    try:
        chat = await event.get_chat()
        users = await tegger.get_chat_user(chat_id=chat.id)
        message = " ".join(users)
        await event.respond(message)
    except Exception as e:
        print(f"Ошибка в обработчике команды /all: {e}")


@tegger.on(events.NewMessage(pattern="/help"))
async def command_help(event):
    try:
        message : str = """
        Это бот помощник в нем реализованы различные функции для работы с группой Telegram
        \nДоступные команды:
        \n/all - Упамянуть всех участников чата
        \n/help - Помощь 
        \nКонтакт разработчика: @dmetro365"""
        await event.respond(message)
    except Exception as e:
        print(f"Ошибка в обработчике команды /all: {e}")


if __name__ == "__main__":
    uvicorn.run("app.main:app", port=8000, host="0.0.0.0", reload=True)