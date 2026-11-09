import asyncio, io, wave, json, httpx
from test_game import client, create, start, headers
from test_providers import use_transport
from backend import main as game


def test_prisma_context_uses_only_available_names_and_actual_previous_clip(monkeypatch):
    monkeypatch.setenv("GNANI_API_KEY", "fake-key")
    requests = []

    def handler(request):
        requests.append(request.content.decode("utf-8", errors="ignore"))
        return httpx.Response(200, json={"transcript": "Who authorized the pickup?"})

    use_transport(monkeypatch, handler)
    code, t = create()
    start(code, t)
    audio = io.BytesIO()
    with wave.open(audio, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(b"\0\0" * 1600)
    for _ in range(2):
        r = client.post(
            f"/api/rooms/{code}/transcribe",
            headers=headers(t),
            data={"character": "dev"},
            files={"audio": ("clip.wav", audio.getvalue(), "audio/wav")},
        )
        assert r.status_code == 200
    assert "keyterms" in requests[0] and "Dev Rao" in requests[0]
    assert "Mira Joseph" not in requests[0] and "All right. I played" not in requests[0]
    assert "previous_text" not in requests[0]
    assert (
        "previous_text" in requests[1] and "Who authorized the pickup?" in requests[1]
    )


def test_gnani_calls_are_serialized_without_automatic_retry(monkeypatch):
    current = 0
    peak = 0
    calls = 0

    async def fake(*args, **kw):
        nonlocal current, peak, calls
        current += 1
        calls += 1
        peak = max(peak, current)
        await asyncio.sleep(0.02)
        current -= 1
        return b"ok"

    monkeypatch.setattr(game, "gnani_request", fake)

    async def run():
        return await asyncio.gather(
            *(game.gnani({}, "/test", "fake") for _ in range(3))
        )

    assert asyncio.run(run()) == [b"ok"] * 3
    assert peak == 1 and calls == 3
