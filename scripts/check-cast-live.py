"""Opt-in live check: seven short fictional voices and three contextual questions."""

import sys, time, json, uuid, io, wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from backend import main as game

client = TestClient(game.app)
results = []
for case in game.CASES.values():
    for ch in case["characters"]:
        d = client.post(
            "/api/rooms",
            json={
                "name": "Fictional cast check",
                "solo": True,
                "case_id": case["id"],
                "role": ch["role"],
            },
        ).json()
        code, t = d["room"]["code"], d["token"]
        base = "/api/rooms/" + code
        headers = {"Authorization": "Bearer " + t}

        def act(kind, **kw):
            r = client.post(
                base + "/action",
                headers=headers,
                json={"kind": kind, "request_id": str(uuid.uuid4()), **kw},
            )
            r.raise_for_status()

        act("ready")
        act("start")
        if ch["id"] in ["dealer", "james"]:
            act("switch")
            act("inspect", target="alpha")
            act("share", target="alpha")
            act("switch")
        began = time.monotonic()
        r = client.post(
            base + "/speech",
            headers=headers,
            json={"text": ch["initial"], "character": ch["id"]},
        )
        entry = {
            "character": ch["id"],
            "voice": ch["voice_profile"]["voice"],
            "status": r.status_code,
            "seconds": round(time.monotonic() - began, 2),
        }
        if r.status_code == 200:
            with wave.open(io.BytesIO(r.content)) as w:
                entry["audio_seconds"] = round(w.getnframes() / w.getframerate(), 2)
        else:
            entry["error"] = r.json().get("detail")
        results.append(entry)
        print(json.dumps(entry), flush=True)
        if ch["id"] == "dev":
            for q, expected in [
                ("Who authorized the pickup?", "collection"),
                ("What should I check on that paperwork?", "procedure"),
                ("Why are you so defensive?", "pressure"),
            ]:
                began = time.monotonic()
                s = client.post(
                    base + "/ask",
                    headers=headers,
                    json={"character": "dev", "question": q},
                )
                item = {
                    "question_type": expected,
                    "status": s.status_code,
                    "seconds": round(time.monotonic() - began, 2),
                }
                if s.status_code == 200:
                    item["expected_reply"] = s.json()["text"] == next(
                        a["text"] for a in ch["responses"] if a["id"] == expected
                    )
                else:
                    item["error"] = s.json().get("detail")
                results.append(item)
                print(json.dumps(item), flush=True)
out = Path(__file__).resolve().parents[1] / "outputs" / "cast-v4.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(results, indent=2), encoding="utf-8")
