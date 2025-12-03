
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connection : dict[str, WebSocket] = {}
        self._lock = asyncio.Lock()

    async def connect(self, id, websocket : WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connection[str(id)] = websocket

    async def disconnect(self, id):
        try:
            async with self._lock:
                del self.active_connection[str(id)]
        except KeyError as e:
            pass

#manager_var : contextvars.ContextVar[typing.Optional[ConnectionManager]] = contextvars.ContextVar('manager', default=None)