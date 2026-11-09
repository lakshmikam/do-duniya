"""Explicit small live check. Does not print keys, headers, passes or full payloads."""

import io
import json
import time
import wave
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from backend import main as game

client = TestClient(game.app)
results = []


def check(label, path, token, **kwargs):
    began = time.monotonic()
    response = client.post(path, headers={"Authorization": "Bearer " + token}, **kwargs)
    result = {
        "check": label,
        "status": response.status_code,
        "seconds": round(time.monotonic() - began, 2),
    }
    if response.status_code != 200:
        result["message"] = response.json().get("detail", "Unavailable")
    results.append(result)
    print(json.dumps(result), flush=True)
    return response


def run():
    import uuid

    language = (
        sys.argv[sys.argv.index("--language") + 1] if "--language" in sys.argv else "en"
    )
    d = client.post(
        "/api/rooms",
        json={"name": "Live integration check", "solo": True, "language": language},
    ).json()
    code, token = d["room"]["code"], d["token"]
    for kind in ["ready", "start"]:
        client.post(
            f"/api/rooms/{code}/action",
            headers={"Authorization": "Bearer " + token},
            json={"kind": kind, "request_id": str(uuid.uuid4())},
        ).raise_for_status()
    base = f"/api/rooms/{code}"
    if "--speech-only" not in sys.argv:
        check(
            "Gemini: English witness question",
            base + "/ask",
            token,
            json={"character": "dev", "question": "Who authorized the collection?"},
        )
    text = game.CASES["last-announcement"]["characters"][0]["initial"]
    voice = (
        None
        if "--reasoning-only" in sys.argv
        else check(
            "Timbre: " + language + " character voice",
            base + "/speech",
            token,
            json={"text": text, "character": "dev"},
        )
    )
    if voice is not None and voice.status_code == 200:
        with wave.open(io.BytesIO(voice.content)) as w:
            result = {
                "check": "Generated " + language + " audio",
                "duration_seconds": round(w.getnframes() / w.getframerate(), 2),
                "sample_rate": w.getframerate(),
            }
            print(json.dumps(result), flush=True)
        result = check(
            "Prisma: generated " + language + " audio",
            base + "/transcribe",
            token,
            files={"audio": ("synthetic.wav", voice.content, "audio/wav")},
        )
        if result.status_code == 200:
            results[-1]["transcript"] = result.json().get("text", "")
            print(json.dumps({"transcript": results[-1]["transcript"]}), flush=True)
    if "--speech-only" not in sys.argv and results[0]["status"] == 200:
        for language in ["te", "hi", "gu"]:
            client.post(
                base + "/action",
                headers={"Authorization": "Bearer " + token},
                json={
                    "kind": "language",
                    "target": language,
                    "request_id": str(uuid.uuid4()),
                },
            ).raise_for_status()
            translated = check(
                "Gemini: " + language + " passage translation",
                base + "/translate",
                token,
                json={"text": text},
            )
            if translated.status_code == 200:
                results[-1]["translation"] = translated.json()["text"]
                print(
                    json.dumps(
                        {
                            "language": language,
                            "translation": translated.json()["text"],
                        },
                        ensure_ascii=True,
                    ),
                    flush=True,
                )
    out = (
        Path(__file__).resolve().parents[1]
        / "outputs"
        / (
            "live-speech-" + language + ".json"
            if "--speech-only" in sys.argv
            else "live-smoke.json"
        )
    )
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Saved sanitized integration results.", flush=True)


if __name__ == "__main__":
    if "--model" in sys.argv:
        import os

        os.environ["GEMINI_MODEL"] = sys.argv[sys.argv.index("--model") + 1]
        print("Testing model: " + os.environ["GEMINI_MODEL"], flush=True)
    run()
