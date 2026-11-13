import logging
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

# Allow overriding with a single DATABASE_URL (useful for Aiven/Render)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if not all([DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME]):
        raise RuntimeError(
            "Database configuration is incomplete. "
            "Set DATABASE_URL or all of: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME"
        )
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# SECURITY: Never log the DATABASE_URL — it contains credentials.
logger.info("Database engine initialising for host: %s", DB_HOST or "<from DATABASE_URL>")

# CONNECTION BUDGET (Aiven Free tier allows max_connections = 20):
# The backend runs WEB_CONCURRENCY=2 gunicorn workers, and each worker
# gets its OWN pool. So the worst case is:
#   2 workers x (pool_size 2 + max_overflow 2) = 8 connections
# Well under Aiven's cap of 20 (minus a few slots Aiven itself uses).
# With the old pool_size=5 + max_overflow=10 this was 2 x 15 = 30 —
# guaranteed "FATAL: too many clients" as soon as 2+ users were active.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,     # Detect stale connections before using them
    pool_recycle=300,       # Recycle connections every 5 minutes (Aiven drops idle ones)
    pool_size=2,
    max_overflow=2,
    pool_timeout=10,        # Fail fast instead of hanging threads when exhausted
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
