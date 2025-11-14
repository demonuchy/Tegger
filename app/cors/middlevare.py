from starlette.middleware.base import BaseHTTPMiddleware
from typing import List, Callable, Awaitable
from fastapi import Request
from fastapi.responses import JSONResponse, Response


class MiddlewareRouter(BaseHTTPMiddleware):
    def __init__(self, app, middlewares: List[BaseHTTPMiddleware]):
        super().__init__(app)
        self.middlewares = middlewares
    
    async def dispatch(self, request: Request, call_next):
        async def execute_middleware_chain(index: int) -> Response:
            if index >= len(self.middlewares):
                return await call_next(request)
            current_middleware = self.middlewares[index]
            print(f"🔍 Middleware {index + 1}/{len(self.middlewares)}: {current_middleware.__class__.__name__}")
            async def next_wrapper(next_request: Request):
                return await execute_middleware_chain(index + 1)
            return await current_middleware.dispatch(request, next_wrapper)
        return await execute_middleware_chain(0)