import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from database import Base, engine
from routers import foods

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── Rate Limiter ──────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# ── App (no debug info exposed in production) ─────────────────
app = FastAPI(
    title="Food Alternatives API",
    docs_url=None if os.getenv("ENVIRONMENT", "development") == "production" else "/docs",
    redoc_url=None if os.getenv("ENVIRONMENT", "development") == "production" else "/redoc",
    openapi_url=None if os.getenv("ENVIRONMENT", "development") == "production" else "/openapi.json",
)

# ── Rate limit error handler ──────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Request body size limit (1 MB) ───────────────────────────
class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    MAX_BODY_SIZE = 1 * 1024 * 1024  # 1 MB

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large. Maximum size is 1 MB."},
            )
        return await call_next(request)

app.add_middleware(MaxBodySizeMiddleware)

# ── Security Headers Middleware ───────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["Cache-Control"] = "no-store"
        # Remove server fingerprint
        response.headers.pop("server", None)
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── CORS — only allow configured origins ──────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:4028,http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,          # No cookies/sessions in this API
    allow_methods=["GET", "POST"],     # Only methods actually used
    allow_headers=["Content-Type", "Accept"],
)

# ── Trusted Host (prevents Host-header injection) ────────────
_raw_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
ALLOWED_HOSTS = [h.strip() for h in _raw_hosts.split(",") if h.strip()]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# ── Database & Routes ─────────────────────────────────────────
Base.metadata.create_all(bind=engine)
app.include_router(foods.router)


@app.get("/")
def home():
    return {"message": "Backend is running!"}

