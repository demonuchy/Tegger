
import typing
import asyncio
import contextvars
import asyncio
from ultralytics import YOLO
import concurrent.futures
import queue

class AsyncYOLOProcessor:
    def __init__(self, model_path='yolov8n.pt'):
        self.model = YOLO(model_path)
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)
        self.result_queue = queue.Queue(maxsize=1)
        self.current_task = None
        
    async def process_frame_async(self, image):
        """Асинхронная обработка кадра"""
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor, 
            self._process_frame_sync, 
            image.copy()  
        )
        return result
    
    def _process_frame_sync(self, image):
        """Синхронная обработка (выполняется в потоке)"""
        results = self.model(image, conf=0.3,      # Увеличить порог уверенности
                                half=True,     # Использовать половинную точность (если GPU)
                                max_det=3,    # Ограничить максимальное количество детекций
                                agnostic_nms=True,  # Ускорить NMS
                                verbose=False
                                )
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                    conf = box.conf[0].cpu().numpy()
                    cls = int(box.cls[0].cpu().numpy())
                    label = self.model.names[cls]
        return image



#manager_var : contextvars.ContextVar[typing.Optional[AsyncYOLOProcessor]] = contextvars.ContextVar('manager', default=None)
