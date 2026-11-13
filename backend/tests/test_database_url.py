"""
Unit tests for database URL handling in database.py: scheme normalisation to
postgresql+psycopg://, URL-encoding of DB_* credentials, and the engine's
connect timeout. No test opens a real database connection.
"""

import pytest
from sqlalchemy import event
from sqlalchemy.engine import make_url

from database import (
    build_database_url,
    database_url_from_env,
    make_engine,
    normalize_database_url,
)

SECRET = "s3cr3t-Pa55"


# ── normalize_database_url ─────────────────────────────────────

@pytest.mark.parametrize(
    "raw",
    [
        "postgres://u:p@db.example.com:5432/app",
        "postgresql://u:p@db.example.com:5432/app",
        "postgresql+psycopg://u:p@db.example.com:5432/app",
        "PostgreSQL://u:p@db.example.com:5432/app",
        "  postgres://u:p@db.example.com:5432/app  ",
    ],
)
def test_accepted_schemes_become_psycopg(raw):
    assert normalize_database_url(raw) == "postgresql+psycopg://u:p@db.example.com:5432/app"


def test_query_string_is_preserved():
    url = normalize_database_url("postgres://avnadmin:p@h.aivencloud.com:12345/defaultdb?sslmode=require")
    assert url == "postgresql+psycopg://avnadmin:p@h.aivencloud.com:12345/defaultdb?sslmode=require"


def test_normalized_url_uses_psycopg_dialect():
    url = make_url(normalize_database_url("postgres://u:p@h:5432/d"))
    assert url.drivername == "postgresql+psycopg"


@pytest.mark.parametrize(
    "raw",
    [
        f"postgresql+psycopg2://u:{SECRET}@h:5432/d",
        f"mysql://u:{SECRET}@h:3306/d",
        f"sqlite:///{SECRET}.db",
        f"u:{SECRET}@h:5432/d",          # no scheme at all
        "postgresql://",                  # scheme only
        "",
    ],
)
def test_other_schemes_are_rejected_without_leaking_the_url(raw):
    with pytest.raises(ValueError) as exc:
        normalize_database_url(raw)
    assert SECRET not in str(exc.value)


# ── build_database_url (DB_* route) ─────────────────────────────

def test_build_uses_psycopg_scheme():
    url = build_database_url("user", "pass", "db.example.com", "5432", "app")
    assert url == "postgresql+psycopg://user:pass@db.example.com:5432/app"


def test_build_encodes_special_characters_in_credentials():
    password = "p@ss:w/rd#?%"
    user = "app user@corp"
    url = build_database_url(user, password, "db.example.com", "5432", "app")

    parsed = make_url(url)
    assert parsed.username == user
    assert parsed.password == password
    assert parsed.host == "db.example.com"
    assert parsed.port == 5432
    assert parsed.database == "app"


def test_build_rejects_non_numeric_port():
    with pytest.raises(ValueError):
        build_database_url("u", "p", "h", "54x2", "d")


# ── database_url_from_env ──────────────────────────────────────

_DB_VARS = ("DATABASE_URL", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASS", "DB_NAME")


@pytest.fixture
def clean_db_env(monkeypatch):
    for var in _DB_VARS:
        monkeypatch.delenv(var, raising=False)
    return monkeypatch


def test_env_database_url_is_normalized(clean_db_env):
    clean_db_env.setenv("DATABASE_URL", "postgres://u:p@h:5432/d")
    assert database_url_from_env() == "postgresql+psycopg://u:p@h:5432/d"


def test_env_parts_build_a_psycopg_url(clean_db_env):
    for var, value in {
        "DB_HOST": "h", "DB_PORT": "5432", "DB_USER": "u", "DB_PASS": "p@ss", "DB_NAME": "d",
    }.items():
        clean_db_env.setenv(var, value)
    assert database_url_from_env() == "postgresql+psycopg://u:p%40ss@h:5432/d"


def test_env_incomplete_config_raises(clean_db_env):
    clean_db_env.setenv("DB_HOST", "h")
    with pytest.raises(RuntimeError, match="incomplete"):
        database_url_from_env()


# ── engine options ─────────────────────────────────────────────

class _StopBeforeNetwork(Exception):
    pass


def test_engine_passes_connect_timeout_to_driver():
    """The real psycopg connect call receives connect_timeout=5."""
    engine = make_engine("postgresql+psycopg://u:p@db.invalid:5432/d")
    captured = {}

    @event.listens_for(engine, "do_connect")
    def capture(dialect, conn_rec, cargs, cparams):
        captured.update(cparams)
        raise _StopBeforeNetwork  # never actually connect

    with pytest.raises(_StopBeforeNetwork):
        engine.connect()

    assert captured["connect_timeout"] == 5
    engine.dispose()
