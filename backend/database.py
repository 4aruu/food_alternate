from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
import logging

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

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
