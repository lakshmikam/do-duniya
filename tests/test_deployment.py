"""Deployment boundaries use the same game engine; no live models or cloud calls."""

from fastapi.testclient import TestClient
from backend.production import create_app
from backend import main as game
from test_game import headers, act
import pytest


@pytest.fixture
def hosted(tmp_path):
    (tmp_path / "index.html").write_text(
        "<!doctype html><title>Do Duniya test</title>", encoding="utf-8"
    )
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "test.js").write_text(
        'console.log("asset")', encoding="utf-8"
    )
    return TestClient(create_app(tmp_path))


def test_same_origin_frontend_and_api(hosted):
    assert hosted.get("/").status_code == 200
    assert hosted.get("/api/health").json()["ok"]
    assert hosted.get("/assets/test.js").status_code == 200
    assert hosted.get("/.env").status_code == 404
    assert hosted.get("/backend/main.py").status_code == 404


def test_security_headers_and_private_api_cache(hosted):
    r = hosted.get("/api/cases")
    assert r.headers["cache-control"] == "no-store"
    assert r.headers["x-content-type-options"] == "nosniff"
    assert "blob:" in r.headers["content-security-policy"]
    assert r.headers["permissions-policy"] == "camera=(), microphone=(self)"


def test_invitation_required_for_create_and_join(hosted, monkeypatch):
    monkeypatch.setenv("TEST_ACCESS_CODE", "local-test-invitation")
    assert hosted.get("/api/health").json()["access_required"]
    assert hosted.post("/api/rooms", json={"name": "A"}).status_code == 403
    d = hosted.post(
        "/api/rooms", json={"name": "A", "access_code": "local-test-invitation"}
    ).json()
    code = d["room"]["code"]
    assert hosted.post("/api/join", json={"name": "B", "code": code}).status_code == 403
    b = hosted.post(
        "/api/join",
        json={"name": "B", "code": code, "access_code": "local-test-invitation"},
    )
    assert b.status_code == 200
    assert "local-test-invitation" not in str(d)
    assert "local-test-invitation" not in str(b.json())


def test_existing_room_pass_does_not_require_invitation_again(hosted, monkeypatch):
    monkeypatch.setenv("TEST_ACCESS_CODE", "invitation")
    d = hosted.post(
        "/api/rooms", json={"name": "A", "access_code": "invitation"}
    ).json()
    monkeypatch.setenv("TEST_ACCESS_CODE", "rotated-invitation")
    r = hosted.get("/api/rooms/" + d["room"]["code"], headers=headers(d["token"]))
    assert r.status_code == 200


def test_creation_attempts_rate_limited(hosted):
    # Invalid room attempts count too. The limiter is isolated per app instance.
    for _ in range(20):
        hosted.post("/api/join", json={"code": "ZZZZZZ", "name": "B"})
    assert (
        hosted.post("/api/join", json={"code": "ZZZZZZ", "name": "B"}).status_code
        == 429
    )


def test_oversized_request_rejected_before_parsing(hosted):
    r = hosted.post(
        "/api/rooms",
        content=b"x" * 2_200_001,
        headers={"content-type": "application/json"},
    )
    assert r.status_code == 413


def test_websocket_and_http_share_the_same_hosted_room(hosted):
    d = hosted.post("/api/rooms", json={"name": "A"}).json()
    with hosted.websocket_connect("/api/rooms/" + d["room"]["code"] + "/live") as ws:
        ws.send_json({"token": d["token"]})
        state = ws.receive_json()
        assert state["code"] == d["room"]["code"]
        assert "solution" not in state
