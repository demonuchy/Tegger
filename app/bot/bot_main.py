import os
import sys
import asyncio
import requests
from telethon import TelegramClient, events
from telethon.tl.types import UpdateNewMessage, PeerUser, Message, PeerChannel, KeyboardButtonWebView, ReplyInlineMarkup, KeyboardButtonRow

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from cors.settings import settings

WEBHOOK_PATH = f"/bot/{settings.TOKEN_BOT}"
WEBHOOK_URL = f"{settings.WEBHOOK_TUNNEL_URL}{WEBHOOK_PATH}"


class TeggerBot(TelegramClient):
    def __init__(
        self, 
        session: str = "bot_session", 
        api_id: str = settings.API_ID,
        api_hash: str = settings.API_HASH,
        system_version: str = "4.16.30-vxCUSTOM",
        bot_token : str = settings.TOKEN_BOT
    ) -> None:
        self._session = session
        self._api_id = api_id
        self._api_hash = api_hash
        self._system_version = system_version
        self.bot_token = bot_token
        self._client = None
        self.web_app_url = "https://old-deer-beam.loca.lt"
        super().__init__(
            session=self._session,
            api_id=self._api_id,
            api_hash=self._api_hash,
            system_version=self._system_version)

    @property
    def client(self) -> TelegramClient | None:
        return self._client
    
    @client.setter
    def client(self, set_value: TelegramClient) -> None:
        self._client = set_value

    @staticmethod
    def create_update_from_data(data: dict):
        if "message" in data:
            message_data = data["message"]
            chat_id = message_data["chat"]["id"]
            text = message_data.get("text", "")
            peer = PeerUser(chat_id) if message_data["chat"]["type"] == "private" else PeerChannel(chat_id)
            message = Message(
                id=message_data["message_id"],
                peer_id=peer,
                date=None,
                message=text,
                out=False,
                media=None
            )
            print(message)
            return UpdateNewMessage(message=message, pts=None, pts_count=None)
        else:
            raise ValueError("Invalid update data")


    async def initialize_client(self) -> TelegramClient:
        try:
            client = await self.start(bot_token=self.bot_token)
            return client
        except Exception as e:
            print(f"Ошибка при инициализации клиента: {e}")
            raise


    """ Conection """
    async def close_client_stream(self):
        print("cоединение закрыто")
        if self.client and self.client.is_connected():
            await self.client.disconnect()

    async def open_client_stream(self):
        print("cоединение открыто")
        if not self.client:
            self.client = await self.initialize_client()

    async def setup_webhook(self, url : str):
        try:
            response = requests.post(f"https://api.telegram.org/bot{self.bot_token}/setWebhook", json={"url": url} )
            if response.status_code == 200 and response.json().get("ok"):
                print(f"Веб-хук успешно установлен: {url}")
            else:
                print(f"Ошибка при установке веб-хука: {response.text}")
        except Exception as e:
            print(f"Ошибка при установке веб хука: {e}")

    async def delete_webhook(self):
        try:
            response = requests.post(f"https://api.telegram.org/bot{self.bot_token}/deleteWebhook")
            if response.status_code == 200 and response.json().get("ok"):
                print("Веб-хук удален.")
            else:
                print(f"Ошибка при удалении веб-хука: {response.text}")
        except Exception as e:
            print(f"Ошибка при отправке запроса: {e}")


    """ Engine """
    async def get_chat_user(self, chat_id : int):
        try:
            users : list[str] = []
            chat = await self.client.get_entity(chat_id)
            if not hasattr(chat, "title"):
                return
            async for user in self.client.iter_participants(chat):
               users.append("@"+str(user.username))
            return users
        except Exception as e:
            print(str(e))
        finally:
            pass

    async def send_webapp_button(self, chat_id: int, text: str = "Открыть приложение"):
        """Отправляет кнопку для открытия WebApp"""
        try:
            webapp_button = KeyboardButtonWebView(text=text, url=self.web_app_url)
            keyboard_row = KeyboardButtonRow(buttons=[webapp_button])
            reply_markup = ReplyInlineMarkup(rows=[keyboard_row])
            await self.client.send_message(chat_id, "Нажмите на кнопку ниже чтобы открыть приложение:", buttons=reply_markup)
        except Exception as e:
            print(f"Ошибка при отправке WebApp кнопки: {e}")



tegger= TeggerBot()