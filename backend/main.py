import json
import logging
import os
from contextlib import asynccontextmanager

# pyrefly: ignore-file
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

from database import Base, SessionLocal, engine
from routers import foods


# ── Structured Logging ────────────────────────────────────
class JSONFormatter(logging.Formatter):
    """JSON log format for production — parseable by Render, Datadog, etc."""
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


_is_production = os.getenv("ENVIRONMENT", "development") == "production"
_handler = logging.StreamHandler()
if _is_production:
    _handler.setFormatter(JSONFormatter())
else:
    _handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))

logging.basicConfig(level=logging.INFO, handlers=[_handler])
logger = logging.getLogger(__name__)

# ── Rate Limiter ──────────────────────────────────────────────
# KEY INSIGHT: behind Render's proxy, request.client.host is the proxy
# IP for EVERY visitor — keying on it makes all users share ONE global
# bucket. rate_limit_key reads the right-most X-Forwarded-For entry
# (appended by Render's proxy, unspoofable) so limits are per-user.
limiter = Limiter(key_func=foods.rate_limit_key, default_limits=["60/minute"])

# ── Startup (lifespan) ────────────────────────────────────────
# Table creation runs at startup, not at import time, and a database
# failure here is logged but never fatal: the process must come up even
# when the DB is unreachable (e.g. Aiven powered off), so /livez can
# answer and /health can report 503 instead of the service crash-looping.
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as e:
        # Log only the exception type: the message can contain the DSN.
        logger.error(
            "Database unavailable at startup (%s); starting without it. "
            "/health will report 503 until it is reachable.",
            type(e).__name__,
        )
    yield


# ── App (no debug info exposed in production) ─────────────────
app = FastAPI(
    lifespan=lifespan,
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
        if content_length is not None:
            # RFC 9110: Content-Length is 1*DIGIT. Reject anything else
            # (letters, decimals, signs, non-ASCII digits) with a 400
            # instead of letting int() raise and turn it into a 500.
            value = content_length.strip()
            if not (value.isascii() and value.isdigit()):
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid Content-Length header."},
                )
            content_length = int(value)
        if content_length is not None and content_length > self.MAX_BODY_SIZE:
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
        # The full foods list is public, static (seeded) data — let the
        # browser cache it briefly so reloads don't re-hit the API.
        # Only successful responses: a cached 429/5xx would keep showing
        # an error for the full max-age. Everything else stays no-store.
        if (
            request.method == "GET"
            and request.url.path.rstrip("/") == "/foods"
            and response.status_code == 200
        ):
            response.headers["Cache-Control"] = "public, max-age=120"
        else:
            response.headers["Cache-Control"] = "no-store"
        # Remove server fingerprint
        if "server" in response.headers:
            del response.headers["server"]
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

# ── Routes ────────────────────────────────────────────────────
app.include_router(foods.router)


@app.get("/")
def home():
    return {"message": "Backend is running!"}


@app.get("/livez")
def liveness():
    """Liveness: 200 whenever the process is up. Never touches the database,
    so a DB outage cannot make the platform restart a healthy process."""
    return {"status": "alive"}


@app.get("/health")
def health_check():
    """Readiness: 200 when the database answers, 503 when it does not.

    A plain `def` on purpose: FastAPI runs it in the threadpool, so the
    blocking DB ping never stalls the event loop. Use /livez for the
    platform health check; /health reports readiness (database
    reachability) for monitoring and the frontend wake-up screen.
    """
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as e:
        # Log only the exception type: the message can contain the DSN.
        logger.error("Health check DB ping failed (%s)", type(e).__name__)
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "unreachable"},
        )
    finally:
        if db:
            db.close()

    return {"status": "ok", "database": "connected"}
