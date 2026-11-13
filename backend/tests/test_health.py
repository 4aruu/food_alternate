"""
Tests for / and /health endpoints.
"""


def test_root_returns_message(client):
    """GET / should return a running status message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "running" in data["message"].lower()


def test_health_returns_200_when_db_up(client):
    """GET /health is 200 with an exact body when the database answers."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_health_db_connected_with_sqlite(client):
    """With the SQLite test DB, /health should report connected."""
    response = client.get("/health")
    data = response.json()
    # SQLite in-memory DB should work fine for SELECT 1
    assert data["database"] == "connected"


class _UnreachableSession:
    """Stands in for a SessionLocal() session whose database is down."""

    closed = False

    def execute(self, *args, **kwargs):
        from sqlalchemy.exc import OperationalError

        raise OperationalError("SELECT 1", {}, Exception("Name or service not known"))

    def close(self):
        _UnreachableSession.closed = True


def test_health_returns_503_when_db_down(client, monkeypatch):
    """GET /health is 503 with a clear body when the database is unreachable."""
    import main

    _UnreachableSession.closed = False
    monkeypatch.setattr(main, "SessionLocal", _UnreachableSession)

    response = client.get("/health")
    assert response.status_code == 503
    assert response.json() == {"status": "unhealthy", "database": "unreachable"}
    assert response.headers["cache-control"] == "no-store"
    assert _UnreachableSession.closed, "session must be closed on failure"


def test_livez_ok_without_touching_db(client, monkeypatch):
    """GET /livez is 200 even when any DB access would fail."""
    import main

    def no_db(*args, **kwargs):
        raise AssertionError("/livez must not open a DB session")

    monkeypatch.setattr(main, "SessionLocal", no_db)

    response = client.get("/livez")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}
