"""
MaxBodySizeMiddleware: a malformed Content-Length is a client error (400),
never a server error (500); oversized bodies are still rejected with 413.
"""

import pytest

ENDPOINT = "/foods/explain-swap"
JSON = {"content-type": "application/json"}


# b"\xb2" is the Latin-1 superscript two: str.isdigit() accepts it but int()
# does not, so a plain isdigit() check alone would still 500. Sent as raw
# bytes because httpx only accepts ASCII str header values.
@pytest.mark.parametrize("bad", ["abc", "-1", "1.5", "+5", "1e3", b"\xb2", "12abc"])
def test_malformed_content_length_returns_400(client, bad):
    response = client.post(ENDPOINT, content=b"{}", headers={**JSON, "content-length": bad})
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid Content-Length header."}


def test_oversized_content_length_returns_413(client):
    too_big = str(1024 * 1024 + 1)
    response = client.post(ENDPOINT, content=b"{}", headers={**JSON, "content-length": too_big})
    assert response.status_code == 413


def test_valid_content_length_reaches_the_route(client):
    """A normal request passes the middleware; the route's own validation answers."""
    response = client.post(ENDPOINT, json={})
    assert response.status_code not in (400, 413, 500)


def test_get_without_body_is_unaffected(client):
    assert client.get("/livez").status_code == 200
