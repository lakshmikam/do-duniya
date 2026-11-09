"""Small opt-in LIVE check: fictional dialogue only, bounded calls, no secrets logged.

Checks provider integration, question routing and timestamp retention. This does
not establish human-reviewed translation quality or real microphone accuracy.
"""

import io, json, time, uuid, wave, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from backend import main as game

client = TestClient(game.app)
results = []
questions = {
    "en": [
        "Who authorized the pickup?",
        "I am not asking about the pickup. When did you hear the announcement?",
    ],
    "hi": [
        "सामान ले जाने की अनुमति किसने दी?",
        "Pickup नहीं, announcement कब सुना था?",
    ],
    "te": [
        "సామాను తీసుకెళ్లడానికి అనుమతి ఎవరు ఇచ్చారు?",
        "Pickup గురించి కాదు, announcement ఎప్పుడు విన్నారు?",
    ],
    "gu": [
        "સામાન લઈ જવાની મંજૂરી કોણે આપી?",
        "Pickup વિશે નહીં, announcement ક્યારે સાંભળી?",
    ],
}
dev = game.CASES["last-announcement"]["characters"][0]
reply = next(x["text"] for x in dev["responses"] if x["id"] == "collection")
docket = next(
    x["text"]
    for x in game.CASES["last-announcement"]["evidence"]
    if x["id"] == "docket"
)


def check(label, path, token, **kw):
    began = time.monotonic()
    r = client.post(path, headers={"Authorization": "Bearer " + token}, **kw)
    entry = {
        "check": label,
        "status": r.status_code,
        "seconds": round(time.monotonic() - began, 2),
    }
    if r.status_code != 200:
        entry["error"] = r.json().get("detail", "Unavailable")
    results.append(entry)
    print(json.dumps(entry), flush=True)
    return r, entry


for lang, qs in questions.items():
    if "--translations-only" in sys.argv and lang == "en":
        continue
    made = client.post(
        "/api/rooms",
        json={"name": "Fictional language check", "solo": True, "language": lang},
    ).json()
    code, token = made["room"]["code"], made["token"]
    base = "/api/rooms/" + code

    def act(kind, **kw):
        r = client.post(
            base + "/action",
            headers={"Authorization": "Bearer " + token},
            json={"kind": kind, "request_id": str(uuid.uuid4()), **kw},
        )
        r.raise_for_status()

    act("ready")
    act("start")
    for q, topic in (
        [] if "--translations-only" in sys.argv else zip(qs, ["collection", "timing"])
    ):
        r, entry = check(
            lang + ": question " + topic,
            base + "/ask",
            token,
            json={"character": "dev", "question": q},
        )
        if r.status_code == 200:
            expected = next(x["text"] for x in dev["responses"] if x["id"] == topic)
            entry["expected_route"] = r.json()["text"] == expected
    if lang != "en":
        act("switch")
        act("inspect", target="docket")
        r, entry = check(
            lang + ": evidence translation",
            base + "/translate",
            token,
            json={"text": docket},
        )
        if r.status_code == 200:
            entry["translation"] = r.json()["text"]
        act("switch")
        r, entry = check(
            lang + ": dialogue translation",
            base + "/translate",
            token,
            json={"text": reply},
        )
        if r.status_code == 200:
            entry["translation"] = r.json()["text"]
    if "--translations-only" in sys.argv:
        continue
    r, entry = check(
        lang + ": Timbre",
        base + "/speech",
        token,
        json={"text": reply, "character": "dev"},
    )
    if r.status_code == 200:
        with wave.open(io.BytesIO(r.content)) as w:
            entry["duration"] = round(w.getnframes() / w.getframerate(), 2)
        s, e = check(
            lang + ": Prisma synthetic round trip",
            base + "/transcribe",
            token,
            files={"audio": ("fictional.wav", r.content, "audio/wav")},
        )
        if s.status_code == 200:
            e["transcript"] = s.json()["text"]

out = (
    Path(__file__).resolve().parents[1]
    / "outputs"
    / (
        "translations-v3.json"
        if "--translations-only" in sys.argv
        else "languages-v3.json"
    )
)
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
print(
    json.dumps(
        {
            "checks": len(results),
            "http_passed": sum(x["status"] == 200 for x in results),
            "routing_passed": sum(x.get("expected_route", False) for x in results),
        }
    ),
    flush=True,
)
