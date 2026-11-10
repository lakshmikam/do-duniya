"""Same-origin deployment of the built React app and the existing game API.

Single worker intentionally: live rooms and sockets belong to one Python process.
"""

from pathlib import Path
import os
import time
from collections import defaultdict, deque
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.gzip import GZipMiddleware
from .main import app as game_api


def create_app(static_dir=None):
    web = FastAPI(title="Do Duniya", docs_url=None, redoc_url=None, openapi_url=None)
    web.include_router(game_api.router)
    web.add_middleware(GZipMiddleware, minimum_size=1000)
    attempts = defaultdict(deque)

    @web.middleware("http")
    async def hosting_boundary(request: Request, call_next):
        # Public room entry retains creation throttles and bounded provider usage.
        if request.url.path in ["/api/rooms", "/api/join"] and request.method == "POST":
            address = request.client.host if request.client else "unknown"
            now = time.monotonic()
            bucket = attempts[address]
            while bucket and bucket[0] < now - 60:
                bucket.popleft()
            if len(bucket) >= 20:
                return JSONResponse(
                    {"detail": "Too many room attempts. Wait a minute."},
                    status_code=429,
                )
            bucket.append(now)
            if len(attempts) > 2000:
                attempts.clear()
        length = request.headers.get("content-length")
        if length:
            try:
                if int(length) > 2_200_000:
                    return JSONResponse(
                        {"detail": "This request is too large."}, status_code=413
                    )
            except ValueError:
                return JSONResponse(
                    {"detail": "Invalid content length."}, status_code=400
                )
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self)"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' wss:; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'"
        )
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    assets = Path(
        static_dir
        or os.getenv("STATIC_DIR", str(Path(__file__).resolve().parents[1] / "dist"))
    )
    if assets.is_dir():
        web.mount("/", StaticFiles(directory=assets, html=True), name="frontend")
    return web


app = create_app()
