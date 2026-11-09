"""Conversation memory, cast separation and spoiler gates."""

from test_game import client, create, start, headers, act, room
from backend import main as game
from backend.cast import PROFILES


def ask(code, t, **kw):
    return client.post(
        f"/api/rooms/{code}/ask", headers=headers(t), json={"character": "dev", **kw}
    )


def test_cast_has_distinct_voices_and_more_than_only_puzzle_answers():
    assert len({p["voice"] for p in PROFILES.values()}) == 7
    for case in game.CASES.values():
        for ch in case["characters"]:
            assert len(ch["responses"]) >= 8
            assert len({r["id"] for r in ch["responses"]}) == len(ch["responses"])
            assert ch["voice_profile"]["tone"]


def test_followup_memory_is_bounded_private_and_has_no_hidden_answer(monkeypatch):
    seen = []

    async def route(r, instruction, payload):
        seen.append(payload)
        return {"id": "collection"}

    monkeypatch.setattr(game, "gemini", route)
    code, t = create()
    start(code, t)
    for i in range(11):
        assert (
            ask(
                code,
                t,
                question="Who gave you that?" if i else "Who authorized the pickup?",
            ).status_code
            == 200
        )
    assert "conversation" not in seen[0]
    assert seen[1]["conversation"][0]["topic"] == "collection"
    assert all(len(p.get("conversation", [])) <= 4 for p in seen)
    assert "All right. I played" not in str(seen)
    assert "conversations" not in room(code, t)
    r = game.ROOMS[code]
    assert len(next(iter(r["conversations"].values()))["dev"]) == 8


def test_accusations_without_evidence_do_not_unlock_confession():
    code, t = create()
    start(code, t)
    response = ask(code, t, topic="trust")
    assert response.status_code == 200 and response.json()["evidence"] is None
    assert "admission" not in {e["id"] for e in room(code, t)["evidence"]}
    assert "All right. I played" not in str(room(code, t))


def test_unknown_reply_is_available_for_speech_and_translation():
    code, t = create()
    start(code, t)
    answer = ask(code, t, topic="not-a-story-topic").json()["text"]
    r, p = game.auth(code, "Bearer " + t)
    assert answer in game.accessible_texts(r, p)
    assert "paperwork" in answer


def test_baker_reaction_is_earned_by_questioning_not_inspecting_a_menu_item():
    code, t = create(case="blue-carbuncle")
    start(code, t)
    assert act(code, t, "inspect", target="baker").status_code == 403
    response = client.post(
        f"/api/rooms/{code}/ask",
        headers=headers(t),
        json={"character": "henry", "topic": "remains"},
    )
    assert response.status_code == 200 and response.json()["evidence"] == "baker"
    assert any(e["id"] == "baker" for e in room(code, t)["evidence"])


def test_voice_profiles_send_real_voice_tag_and_numeric_speed(monkeypatch):
    import io, wave, json, httpx
    from test_providers import use_transport

    monkeypatch.setenv("GNANI_API_KEY", "fake-key")
    game.AUDIO_CACHE.clear()
    output = io.BytesIO()
    with wave.open(output, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(b"\0\0" * 240)
    sent = []

    def handler(request):
        sent.append(json.loads(request.content))
        return httpx.Response(200, content=output.getvalue())

    use_transport(monkeypatch, handler)
    code, t = create()
    start(code, t)
    text = ask(code, t, topic="pressure").json()["text"]
    result = client.post(
        f"/api/rooms/{code}/speech",
        headers=headers(t),
        json={"text": text, "character": "dev"},
    )
    assert result.status_code == 200
    assert sent[0]["voice"] == "Devansh" and sent[0]["text"].startswith("<exhales> ")
    assert sent[0]["speed"] == 0.97
