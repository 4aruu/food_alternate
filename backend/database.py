import logging
import os
from urllib.parse import quote

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)
load_dotenv()

# Only psycopg v3 is installed (requirements.txt). A bare postgres:// or
# postgresql:// URL makes SQLAlchemy load psycopg2, which is absent, so
# every accepted spelling is rewritten to the explicit psycopg driver.
PSYCOPG_SCHEME = "postgresql+psycopg"
_ACCEPTED_SCHEMES = ("postgres", "postgresql", PSYCOPG_SCHEME)


def normalize_database_url(url: str) -> str:
    """Return `url` with its scheme set to postgresql+psycopg://.

    Accepts postgres://, postgresql:// and postgresql+psycopg://. Anything
    else (including postgresql+psycopg2://) raises ValueError. Error
    messages never include the URL, because it contains credentials.
    """
    scheme, sep, rest = url.strip().partition("://")
    if not sep or not rest:
        raise ValueError("DATABASE_URL must look like postgresql+psycopg://user:pass@host:port/db")
    if scheme.lower() not in _ACCEPTED_SCHEMES:
        raise ValueError(
            "Unsupported DATABASE_URL scheme. Use postgresql+psycopg:// "
            "(postgres:// and postgresql:// are rewritten to it)."
        )
    return f"{PSYCOPG_SCHEME}://{rest}"


def build_database_url(user: str, password: str, host: str, port: str, name: str) -> str:
    """Build a postgresql+psycopg:// URL from parts.

    User and password are percent-encoded so characters such as @ : / #
    in a password cannot break the URL.
    """
    if not str(port).isdigit():
        raise ValueError("DB_PORT must be a number")
    return (
        f"{PSYCOPG_SCHEME}://{quote(user, safe='')}:{quote(password, safe='')}"
        f"@{host}:{port}/{name}"
    )


def database_url_from_env() -> str:
    """DATABASE_URL if set, otherwise built from DB_HOST/PORT/USER/PASS/NAME."""
    url = os.getenv("DATABASE_URL")
    if url:
        return normalize_database_url(url)
    parts = [os.getenv(k) for k in ("DB_USER", "DB_PASS", "DB_HOST", "DB_PORT", "DB_NAME")]
    if not all(parts):
        raise RuntimeError(
            "Database configuration is incomplete. "
            "Set DATABASE_URL or all of: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME"
        )
    return build_database_url(*parts)


DATABASE_URL = database_url_from_env()

# SECURITY: Never log the DATABASE_URL — it contains credentials.
logger.info(
    "Database engine initialising for host: %s",
    os.getenv("DB_HOST") or "<from DATABASE_URL>",
)

# CONNECTION BUDGET (Aiven Free tier allows max_connections = 20):
# The backend runs WEB_CONCURRENCY=2 gunicorn workers, and each worker
# gets its OWN pool. So the worst case is:
#   2 workers x (pool_size 2 + max_overflow 2) = 8 connections
# Well under Aiven's cap of 20 (minus a few slots Aiven itself uses).
# With the old pool_size=5 + max_overflow=10 this was 2 x 15 = 30 —
# guaranteed "FATAL: too many clients" as soon as 2+ users were active.
ENGINE_OPTIONS = {
    "pool_pre_ping": True,   # Detect stale connections before using them
    "pool_recycle": 300,     # Recycle connections every 5 minutes (Aiven drops idle ones)
    "pool_size": 2,
    "max_overflow": 2,
    "pool_timeout": 10,      # Fail fast instead of hanging threads when exhausted
    # Fail a connection attempt after 5 s instead of the OS TCP timeout
    # (minutes), so startup and /health don't hang on an unreachable host.
    "connect_args": {"connect_timeout": 5},
}


def make_engine(url: str):
    return create_engine(url, **ENGINE_OPTIONS)


engine = make_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
