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


def test_health_returns_ok_and_db_status(client):
    """GET /health should return status ok and a database status field."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] in ("connected", "disconnected")


def test_health_db_connected_with_sqlite(client):
    """With the SQLite test DB, /health should report connected."""
    response = client.get("/health")
    data = response.json()
    # SQLite in-memory DB should work fine for SELECT 1
    assert data["database"] == "connected"
