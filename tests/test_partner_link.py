"""Two real test WebSocket clients: radio relay, isolation and shared handoffs."""

import base64, json
from contextlib import contextmanager
from test_game import client, create, start, headers, act, room
from backend import main as game


def duo():
    code, a = create(solo=False)
    b = client.post("/api/join", json={"code": code, "name": "Partner"}).json()["token"]
    act(code, a, "ready")
    act(code, b, "ready")
    act(code, a, "start")
    return code, a, b


@contextmanager
def connected_radios(code, a, b):
    """Connect and opt both authenticated players into live radio."""
    with client.websocket_connect(f"/api/rooms/{code}/live") as wa:
        wa.send_json({"token": a})
        wa.receive_json()
        with client.websocket_connect(f"/api/rooms/{code}/live") as wb:
            wb.send_json({"token": b})
            wb.receive_json()
            wa.receive_json()
            for sender in [wa, wb]:
                sender.send_json({"type": "radio_state", "enabled": True})
                wa.receive_json()
                wb.receive_json()
            yield wa, wb


def claim(sender, other=None, request_id="claim"):
    sender.send_json({"type": "radio_claim", "request_id": request_id})
    reply = sender.receive_json()
    assert reply["type"] == "radio_control" and reply["request_id"] == request_id
    if reply["granted"]:
        sender.receive_json()
        if other is not None:
            other.receive_json()
    return reply["granted"]


def refresh(ws):
    ws.send_text("refresh")
    snapshot = ws.receive_json()
    assert "type" not in snapshot
    return snapshot


def test_only_discovered_clues_enter_both_notebooks_and_conversation():
    code, a, b = duo()
    assert room(code, b)["messages"] == []
    assert (
        act(code, a, "message", text="Look at this", target="note").status_code == 403
    )
    act(code, a, "inspect", target="note")
    act(code, a, "share", target="note")
    shared = room(code, b)["messages"][-1]
    assert shared["kind"] == "clue" and shared["evidence_id"] == "note"
    assert (
        act(
            code, b, "message", text="I will compare the records.", target="note"
        ).status_code
        == 200
    )
    assert room(code, a)["messages"][-1]["author"] == "Partner"
    assert room(code, a)["messages"][-1]["text"] == "I will compare the records."
    for i in range(42):
        act(code, a, "message", text=f"Line {i}")
    assert len(room(code, b)["messages"]) == 40


def test_radio_only_reaches_other_opted_in_player_and_is_not_saved():
    code, a, b = duo()
    with client.websocket_connect(f"/api/rooms/{code}/live") as wa:
        wa.send_json({"token": a})
        wa.receive_json()
        with client.websocket_connect(f"/api/rooms/{code}/live") as wb:
            wb.send_json({"token": b})
            wb.receive_json()
            wa.receive_json()
            wa.send_json({"type": "radio_state", "enabled": True})
            wa.receive_json()
            wb.receive_json()
            wb.send_json({"type": "radio_state", "enabled": True})
            wa.receive_json()
            wb.receive_json()
            assert claim(wa, wb)
            pcm = base64.b64encode(bytes(range(256)) * 8).decode()
            wa.send_json({"type": "radio", "audio": "not-base64!"})
            wa.send_json({"type": "radio", "audio": pcm})
            packet = wb.receive_json()
            assert packet["type"] == "radio" and packet["audio"] == pcm
            assert packet["from"] != room(code, b)["you"]["id"]
            wa.send_text("refresh")
            assert "type" not in wa.receive_json(), "Own radio audio must not echo back"
            assert pcm not in json.dumps(
                game.ROOMS[code]
            ), "Radio audio must not be retained"
            wb.send_json({"type": "radio_state", "enabled": False})
            wa.receive_json()
            wb.receive_json()
            wa.send_json({"type": "radio", "audio": pcm})
            wb.send_text("refresh")
            assert (
                "type" not in wb.receive_json()
            ), "Disabled listeners receive no audio"


def test_presence_cannot_claim_a_locked_scene_or_other_roles_character():
    code, a, b = duo()
    with client.websocket_connect(f"/api/rooms/{code}/live") as ws:
        ws.send_json({"token": a})
        ws.receive_json()
        ws.send_json({"type": "presence", "location": "relay", "character": "mira"})
        v = ws.receive_json()
        me = next(p for p in v["players"] if p["id"] == v["you"]["id"])
        assert not me["scene"] and not me["interviewing"]
        ws.send_json({"type": "presence", "location": "platform", "character": "dev"})
        v = ws.receive_json()
        me = next(p for p in v["players"] if p["id"] == v["you"]["id"])
        assert me["scene"] and me["interviewing"] == "Dev Rao"


def test_radio_does_not_escape_its_room():
    code, a, b = duo()
    other, t = create()
    start(other, t)
    with client.websocket_connect(f"/api/rooms/{code}/live") as wa:
        wa.send_json({"token": a})
        wa.receive_json()
        with client.websocket_connect(f"/api/rooms/{other}/live") as wc:
            wc.send_json({"token": t})
            wc.receive_json()
            wa.send_json({"type": "radio_state", "enabled": True})
            wa.receive_json()
            assert claim(wa)
            wa.send_json(
                {"type": "radio", "audio": base64.b64encode(b"\0\0" * 1024).decode()}
            )
            wc.send_text("refresh")
            v = wc.receive_json()
            assert "type" not in v and v["code"] == other


def test_radio_floor_prevents_simultaneous_speakers_and_releases_for_partner():
    code, a, b = duo()
    with connected_radios(code, a, b) as (wa, wb):
        assert claim(wa, wb, "first")
        assert not claim(wb, wa, "competing")
        assert game.RADIO_FLOORS[code]["owner"] == room(code, a)["you"]["id"]
        wa.send_json({"type": "radio_end"})
        wa.receive_json()
        wb.receive_json()
        assert code not in game.RADIO_FLOORS
        assert claim(wb, wa, "after-release")
        assert game.RADIO_FLOORS[code]["owner"] == room(code, b)["you"]["id"]


def test_stale_and_foreign_radio_packets_cannot_bypass_floor():
    code, a, b = duo()
    pcm = base64.b64encode(bytes(range(256)) * 4).decode()
    with connected_radios(code, a, b) as (wa, wb):
        assert claim(wa, wb)
        # A forged sender field does not change the authenticated connection.
        wb.send_json(
            {"type": "radio", "from": room(code, a)["you"]["id"], "audio": pcm}
        )
        refresh(wb)
        refresh(wa)  # Would receive radio first if the forged packet escaped.
        game.RADIO_FLOORS[code]["until"] = 0
        wa.send_json({"type": "radio", "audio": pcm})
        refresh(wa)
        refresh(wb)  # An expired claim does not authorize a delayed packet.
        assert claim(wb, wa, "new-owner")
        wb.send_json({"type": "radio", "audio": pcm})
        packet = wa.receive_json()
        assert packet["type"] == "radio" and packet["audio"] == pcm
        assert pcm not in json.dumps(game.ROOMS[code])
        assert pcm not in json.dumps(game.RADIO_FLOORS)


def test_disconnect_releases_radio_floor_for_remaining_player():
    code, a, b = duo()
    with client.websocket_connect(f"/api/rooms/{code}/live") as wa:
        wa.send_json({"token": a})
        wa.receive_json()
        with client.websocket_connect(f"/api/rooms/{code}/live") as wb:
            wb.send_json({"token": b})
            wb.receive_json()
            wa.receive_json()
            for sender in [wa, wb]:
                sender.send_json({"type": "radio_state", "enabled": True})
                wa.receive_json()
                wb.receive_json()
            assert claim(wb, wa)
        disconnected = wa.receive_json()
        assert code not in game.RADIO_FLOORS
        peer = next(
            p for p in disconnected["players"] if p["id"] != disconnected["you"]["id"]
        )
        assert not peer["connected"] and not peer["radio_talking"]
        assert claim(wa, request_id="remaining-player")
