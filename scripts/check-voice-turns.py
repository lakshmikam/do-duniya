"""Opt-in bounded LIVE check of multilingual synthetic character voice turns.

Uses fictional game text only. No microphone/browser or native-speaker quality
claim. At most four TTS, four STT, four routing and three translation requests;
failed stages are not retried. Credentials and session tokens are never logged.
"""

import json
import os
from pathlib import Path
import sys
import time
import uuid

os.environ["PROVIDER_DAILY_LIMIT"] = "240"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from backend import main as game


def run():
    client = TestClient(game.app)
    results = []
    character = next(
        c for c in game.CASES["last-announcement"]["characters"] if c["id"] == "dev"
    )
    topic = next(r for r in character["responses"] if r["id"] == "collection")

    def call(language, stage, path, **kwargs):
        began = time.monotonic()
        response = client.post(path, **kwargs)
        entry = {
            "language": language,
            "stage": stage,
            "status": response.status_code,
            "seconds": round(time.monotonic() - began, 2),
        }
        if response.status_code != 200:
            # The application returns bounded, credential-free provider errors.
            try:
                detail = response.json().get("detail", "Unavailable")
                entry["error"] = (
                    detail if isinstance(detail, str) else "Validation failed"
                )
            except ValueError:
                entry["error"] = "Non-JSON error response"
        results.append(entry)
        return response, entry

    def emit(entry):
        print(
            json.dumps({k: v for k, v in entry.items() if k != "error"}),
            flush=True,
        )

    for language in ["en", "hi", "te", "gu"]:
        made, creation = call(
            language,
            "create",
            "/api/rooms",
            json={
                "name": "Synthetic voice turn check",
                "case_id": "last-announcement",
                "solo": True,
                "language": language,
                "access_code": os.getenv("TEST_ACCESS_CODE", ""),
            },
        )
        if made.status_code != 200:
            emit(creation)
            continue
        data = made.json()
        base = "/api/rooms/" + data["room"]["code"]
        headers = {"Authorization": "Bearer " + data["token"]}
        started = True
        for action in ["ready", "start"]:
            response = client.post(
                base + "/action",
                headers=headers,
                json={"kind": action, "request_id": str(uuid.uuid4())},
            )
            if response.status_code != 200:
                failed = {
                    "language": language,
                    "stage": action,
                    "status": response.status_code,
                    "seconds": 0,
                }
                results.append(failed)
                emit(failed)
                started = False
                break
        if not started:
            continue
        spoken, entry = call(
            language,
            "timbre",
            base + "/speech",
            headers=headers,
            json={"text": topic["label"], "character": "dev"},
        )
        emit(entry)
        if spoken.status_code != 200:
            continue
        heard, entry = call(
            language,
            "prisma",
            base + "/transcribe",
            headers=headers,
            data={"character": "dev"},
            files={"audio": ("fictional-turn.wav", spoken.content, "audio/wav")},
        )
        emit(entry)
        if heard.status_code != 200:
            continue
        answered, entry = call(
            language,
            "gemini-route",
            base + "/ask",
            headers=headers,
            json={"character": "dev", "question": heard.json()["text"][:500]},
        )
        entry["expected_route"] = (
            answered.status_code == 200 and answered.json()["text"] == topic["text"]
        )
        emit(entry)

    out = Path(__file__).resolve().parents[1] / "outputs" / "voice-turns-v5.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(results, indent=2), encoding="utf-8")
    routes = [r for r in results if r["stage"] == "gemini-route"]
    print(
        json.dumps(
            {
                "completed_turns": len(routes),
                "expected_routes": sum(r["expected_route"] for r in routes),
                "failed_stages": sum(r["status"] != 200 for r in results),
            }
        ),
        flush=True,
    )


if __name__ == "__main__":
    run()
