"""
Startup must survive an unreachable database: table creation runs in the
lifespan handler (not at import time) and a DB error there is logged, not fatal.
"""

import logging

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

import main
from database import Base


def test_app_starts_when_create_all_fails(monkeypatch, caplog):
    secret_dsn = "postgresql+psycopg://user:s3cret@db.example:5432/x"

    def unreachable(*args, **kwargs):
        raise OperationalError(secret_dsn, {}, Exception("Name or service not known"))

    monkeypatch.setattr(Base.metadata, "create_all", unreachable)

    with caplog.at_level(logging.ERROR, logger="main"):
        with TestClient(main.app) as client:  # `with` runs the lifespan
            assert client.get("/").status_code == 200
            assert client.get("/livez").status_code == 200

    messages = " ".join(r.getMessage() for r in caplog.records)
    assert "Database unavailable at startup (OperationalError)" in messages
    assert "s3cret" not in messages, "the DSN must never be logged"


def test_lifespan_creates_tables_on_startup(monkeypatch):
    calls = []
    monkeypatch.setattr(Base.metadata, "create_all", lambda **kw: calls.append(kw))

    with TestClient(main.app):
        pass

    assert calls == [{"bind": main.engine}]
