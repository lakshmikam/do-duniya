from test_game import client, create, start, headers, room, act
from backend import main as game


def test_team_hint_budget_is_shared_and_text_is_accessible():
    code, a = create()
    start(code, a)
    for number in range(1, 4):
        result = client.post(
            f"/api/rooms/{code}/coach", headers=headers(a), json={"topic": "nudge"}
        )
        assert result.status_code == 200
        assert result.json()["remaining"] == 3 - number
    state = room(code, a)
    assert len(state["coach_hints"]) == 3 and state["hints_remaining"] == 0
    r, p = game.auth(code, "Bearer " + a)
    assert state["coach_hints"][0]["text"] in game.accessible_texts(r, p)
    assert (
        client.post(
            f"/api/rooms/{code}/coach", headers=headers(a), json={"topic": "next"}
        ).status_code
        == 409
    )


def test_failed_model_does_not_consume_hint(monkeypatch):
    code, a = create()
    start(code, a)

    async def broken(*args, **kwargs):
        game.fail("Provider unavailable", 502)

    monkeypatch.setattr(game, "gemini", broken)
    response = client.post(
        f"/api/rooms/{code}/coach", headers=headers(a), json={"question": "What next?"}
    )
    assert response.status_code == 502
    assert room(code, a)["hints_remaining"] == 3
    assert not game.ROOMS[code].get("coach_pending")


def test_coach_respects_pause_and_auth():
    code, a = create()
    start(code, a)
    assert (
        client.post(f"/api/rooms/{code}/coach", json={"topic": "next"}).status_code
        == 403
    )
    act(code, a, "pause")
    assert (
        client.post(
            f"/api/rooms/{code}/coach", headers=headers(a), json={"topic": "next"}
        ).status_code
        == 409
    )


def test_duplicate_tab_does_not_replace_existing_player():
    code, a = create()
    start(code, a)
    with client.websocket_connect(f"/api/rooms/{code}/live") as first:
        first.send_json({"token": a})
        first.receive_json()
        with client.websocket_connect(f"/api/rooms/{code}/live") as second:
            second.send_json({"token": a})
            assert second.receive_json()["type"] == "session_in_use"
        first.send_json({"type": "radio_state", "enabled": True})
        assert first.receive_json()["you"]["id"] == room(code, a)["you"]["id"]


def test_explicit_takeover_moves_session():
    code, a = create()
    start(code, a)
    with client.websocket_connect(f"/api/rooms/{code}/live") as first:
        first.send_json({"token": a})
        first.receive_json()
        with client.websocket_connect(f"/api/rooms/{code}/live") as second:
            second.send_json({"token": a, "take_over": True})
            assert first.receive_json()["type"] == "session_moved"
            assert second.receive_json()["code"] == code
