"""Actual REST adapter contracts exercised with HTTP mocks, never paid calls."""

import io
import json
import wave
import httpx
import pytest
from fastapi.testclient import TestClient
from backend import main as game
from test_game import create, start, headers, act

client = TestClient(game.app)
OriginalAsyncClient = httpx.AsyncClient


def use_transport(monkeypatch, handler):
    transport = httpx.MockTransport(handler)

    def factory(*args, **kwargs):
        kwargs["transport"] = transport
        return OriginalAsyncClient(*args, **kwargs)

    monkeypatch.setattr(game.httpx, "AsyncClient", factory)


def test_gemini_routes_question_without_exposing_solution(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key")
    observed = []

    def handler(request):
        body = json.loads(request.content)
        observed.append(body)
        return httpx.Response(
            200,
            json={
                "candidates": [{"content": {"parts": [{"text": '{"id":"timing"}'}]}}]
            },
        )

    use_transport(monkeypatch, handler)
    code, t = create()
    start(code, t)
    r = client.post(
        f"/api/rooms/{code}/ask",
        headers=headers(t),
        json={"character": "dev", "question": "When did you hear it?"},
    )
    assert r.status_code == 200 and r.json()["provider"] == "gemini"
    assert "there was rain" in r.json()["text"].lower()
    payload = json.loads(observed[0]["contents"][0]["parts"][0]["text"])
    assert set(payload) == {"question", "topics"} and "confront" not in str(payload)
    assert observed[0]["generationConfig"]["thinkingConfig"] == {"thinkingLevel": "low"}
    assert "temperature" not in observed[0]["generationConfig"]


@pytest.mark.parametrize(
    "upstream,expected,message",
    [(429, 429, "quota"), (404, 503, "not available"), (403, 503, "rejected")],
)
def test_gemini_failures_are_specific_and_do_not_retry(
    monkeypatch, upstream, expected, message
):
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key")
    calls = []

    def handler(request):
        calls.append(True)
        return httpx.Response(upstream, json={"error": {"status": "UNAVAILABLE"}})

    use_transport(monkeypatch, handler)
    code, t = create()
    start(code, t)
    r = client.post(
        f"/api/rooms/{code}/ask",
        headers=headers(t),
        json={"character": "dev", "question": "What happened?"},
    )
    assert r.status_code == expected and message in r.json()["detail"]
    assert len(calls) == 1


def test_timbre_contract_returns_wav_and_caches(monkeypatch):
    monkeypatch.setenv("GNANI_TIMBRE_KEY", "fake-voice-key")
    game.AUDIO_CACHE.clear()
    calls = []
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(b"\x00\x00" * 240)

    def handler(request):
        calls.append(json.loads(request.content))
        return httpx.Response(200, content=buf.getvalue())

    use_transport(monkeypatch, handler)
    code, t = create()
    text = game.CASES["last-announcement"]["brief"]
    path = f"/api/rooms/{code}/speech"
    r = client.post(path, headers=headers(t), json={"text": text})
    assert r.status_code == 200 and r.content[:4] == b"RIFF"
    assert calls[0]["model"] == "timbre-v3.0" and calls[0]["language"] == "en-IN"
    assert (
        client.post(path, headers=headers(t), json={"text": text}).headers[
            "x-audio-source"
        ]
        == "timbre-cached"
    )
    assert len(calls) == 1


def test_prisma_transcript_and_provider_failure_are_explicit(monkeypatch):
    monkeypatch.setenv("GNANI_PRISMA_KEY", "fake-prisma-key")
    responses = [
        httpx.Response(
            200, json={"success": True, "transcript": "Ask about the announcement"}
        ),
        httpx.Response(429, json={"detail": "rate limit"}),
    ]

    def handler(request):
        assert request.url.path == "/stt/v3"
        assert b"prisma-v3.0" in request.content
        return responses.pop(0)

    use_transport(monkeypatch, handler)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(b"\x00\x00" * 160)
    code, t = create()
    start(code, t)
    path = f"/api/rooms/{code}/transcribe"
    files = {"audio": ("test.wav", buf.getvalue(), "audio/wav")}
    r = client.post(path, headers=headers(t), files=files)
    assert r.status_code == 200 and r.json()["provider"] == "prisma-v3.0"
    r = client.post(path, headers=headers(t), files=files)
    assert r.status_code == 502 and "No automatic retry" in r.json()["detail"]
    assert responses == []
