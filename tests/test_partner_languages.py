"""Source-preserving partner relay contracts, with no real model calls."""

import io
import wave

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
import pytest

from backend import main as game
from backend.partner_language import install
from test_game import act, client, create, headers

partner_app = FastAPI()
install(partner_app, game)
relay = TestClient(partner_app)


def duo(language="te"):
    code, sender = create(solo=False)
    other = client.post(
        "/api/join", json={"code": code, "name": "B", "language": language}
    ).json()["token"]
    act(code, sender, "ready")
    act(code, other, "ready")
    act(code, sender, "start")
    return code, sender, other


def post_message(code, token, text):
    return relay.post(
        f"/api/rooms/{code}/partner-message",
        headers=headers(token),
        json={"text": text},
    )


def speak(code, token, message_id):
    return relay.post(
        f"/api/rooms/{code}/partner-speech",
        headers=headers(token),
        json={"message_id": message_id},
    )


def wav():
    output = io.BytesIO()
    with wave.open(output, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(b"\0\0" * 240)
    return output.getvalue()


def test_different_languages_preserve_original_and_target_translation(monkeypatch):
    observed = []

    async def translate(room, instruction, payload):
        observed.append((instruction, payload))
        return {"text": "నేను 23:47 వద్ద Dev‌ను చూడలేదు."}

    monkeypatch.setattr(game, "gemini", translate)
    code, a, b = duo()
    response = post_message(code, a, "I did not see Dev at 23:47.")
    assert response.status_code == 200
    message = response.json()["messages"][-1]
    assert message["source_language"] == "en"
    assert message["text"] == "I did not see Dev at 23:47."
    assert message["translations"] == {"te": "నేను 23:47 వద్ద Dev‌ను చూడలేదు."}
    assert "untrusted" in observed[0][0] and "negation" in observed[0][0]
    assert observed[0][1]["target_language"] == "Telugu"
    assert message["author_id"] == response.json()["you"]["id"]


def test_same_language_uses_no_translator_and_speech_cache(monkeypatch):
    async def forbidden(*args, **kwargs):
        raise AssertionError("A same-language message must not call Gemini")

    calls = []

    async def voice(room, path, key, **kwargs):
        calls.append((path, kwargs["json"]))
        return wav()

    monkeypatch.setattr(game, "gemini", forbidden)
    monkeypatch.setattr(game, "gnani", voice)
    code, a, b = duo("en")
    response = post_message(code, a, "Check the record, please.")
    assert response.status_code == 200
    message = response.json()["messages"][-1]
    assert message["translations"] == {}
    first = speak(code, b, message["id"])
    second = speak(code, b, message["id"])
    assert first.status_code == second.status_code == 200
    assert first.content[:4] == b"RIFF" and len(calls) == 1
    assert calls[0][1]["text"] == message["text"]
    assert calls[0][1]["model"] == "timbre-v3.0"
    assert calls[0][1]["language"] == "en-IN"


def test_translation_failure_delivers_original_without_fake_spoken_translation(
    monkeypatch,
):
    async def unavailable(*args, **kwargs):
        raise HTTPException(503, "Provider unavailable")

    async def no_speech(*args, **kwargs):
        raise AssertionError("An untranslated mismatch must not be spoken")

    monkeypatch.setattr(game, "gemini", unavailable)
    monkeypatch.setattr(game, "gnani", no_speech)
    code, a, b = duo()
    response = post_message(code, a, "Could you check the clock?")
    assert response.status_code == 200
    message = response.json()["messages"][-1]
    assert message["text"] == "Could you check the clock?"
    assert message["translations"] == {} and message["translation_error"]
    assert speak(code, b, message["id"]).status_code == 409


@pytest.mark.parametrize(
    "language,translation", [("te", "23:48 వద్ద చూశాను."), ("hi", "আমি 23:47 দেখেছি।")]
)
def test_invalid_numbers_and_wrong_script_are_not_accepted(
    monkeypatch, language, translation
):
    async def invalid(*args, **kwargs):
        return {"text": translation}

    monkeypatch.setattr(game, "gemini", invalid)
    code, a, b = duo(language)
    message = post_message(code, a, "I saw it at 23:47.").json()["messages"][-1]
    assert message["translations"] == {} and message["translation_error"]
    assert speak(code, b, message["id"]).status_code == 409


def test_spoken_relay_uses_viewers_translation_and_rejects_bad_wav(monkeypatch):
    async def translate(*args, **kwargs):
        return {"text": "దయచేసి రికార్డును చూడండి."}

    observed = []

    async def voice(room, path, key, **kwargs):
        observed.append(kwargs["json"])
        return b"not a wav"

    monkeypatch.setattr(game, "gemini", translate)
    monkeypatch.setattr(game, "gnani", voice)
    code, a, b = duo()
    message = post_message(code, a, "Check the record, please.").json()["messages"][-1]
    response = speak(code, b, message["id"])
    assert response.status_code == 502
    assert observed[0]["text"] == message["translations"]["te"]
    assert observed[0]["language"] == "te-IN"


def test_copied_hindi_is_not_accepted_as_english(monkeypatch):
    source = "मैंने Dev को नहीं देखा।"

    async def copied(room, instruction, payload):
        assert "into English" in instruction and payload["target_language"] == "English"
        return {"text": source}

    monkeypatch.setattr(game, "gemini", copied)
    code, a, b = duo("hi")
    message = post_message(code, b, source).json()["messages"][-1]
    assert message["translations"] == {} and message["translation_error"]
    assert speak(code, a, message["id"]).status_code == 409


def test_auth_room_isolation_pause_and_message_bounds():
    code, a, b = duo("en")
    message = post_message(code, a, "This is our room.").json()["messages"][-1]
    other, token = create()
    assert speak(other, token, message["id"]).status_code == 404
    assert (
        relay.post(
            f"/api/rooms/{code}/partner-speech", json={"message_id": message["id"]}
        ).status_code
        == 403
    )
    assert post_message(code, a, "x" * 601).status_code == 422
    assert post_message(code, a, "   ").status_code == 400
    act(code, a, "pause")
    assert post_message(code, a, "Wait for me.").status_code == 409
