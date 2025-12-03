import os
import sys
import cv2
import numpy as np

import asyncio
from contextlib import asynccontextmanager
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, WebSocketException

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.connection_manager import ConnectionManager
from app.utils.YOLOProcces import AsyncYOLOProcessor
    

ws_router = APIRouter(prefix="/ws")
manager = ConnectionManager()
processor = AsyncYOLOProcessor()


@ws_router.websocket("/{telegram_id}")
async def detect_document(websocket: WebSocket, telegram_id):
    try: 
        cv2.namedWindow('prew')
        cv2.resizeWindow('prew', 600, 600)
        await manager.connect(telegram_id, websocket)
        while True:
            try:
                data = await websocket.receive_bytes()
                print('полученны данные')
                nparr = np.frombuffer(data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except KeyError as e:
                print("Ошибка неверный формат данных", e)
                continue
            except asyncio.TimeoutError:
                print('⏰ нет данных (таймаут 200 ms )')
                continue
    except (WebSocketDisconnect, WebSocketException) as e:
        print(f"🔌 Соединение закрыто WebSocketDisconnect: {e}")
        await manager.disconnect(telegram_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"непредвиденная ошибка: {e}")
        await manager.disconnect(telegram_id)
       
        