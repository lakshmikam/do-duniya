"""A reciprocal scene action must stay solvable and honor both roles."""

from test_game import act, room, inspect_share
from test_partner_link import duo
from backend import main as game


def test_shared_route_needs_power_then_physical_latch():
    code, field, records = duo()
    assert act(code, field, "assist", target="service_gate").status_code == 403
    assert act(code, records, "assist", target="service_gate").status_code == 409
    inspect_share(code, records, "route")
    assert act(code, field, "inspect", target="found").status_code == 409
    assert act(code, records, "assist", target="service_gate").status_code == 200
    assert room(code, field)["cooperation"]["service_gate"]
    assert act(code, field, "inspect", target="found").status_code == 200
    assert room(code, records)["cooperation"]["store_latch"]
    assert not any(e["id"] == "found" for e in room(code, records)["evidence"])
    act(code, field, "share", target="found")
    assert any(e["id"] == "found" for e in room(code, records)["evidence"])


def test_incorrect_reconstruction_can_be_revisited_without_losing_discoveries():
    code, a, b = duo()
    inspect_share(code, a, "seal")
    r = game.ROOMS[code]
    r["proposal"] = {"answers": {}, "evidence": []}
    game.finish(r)
    assert not r["result"]["success"]
    assert act(code, a, "reopen").status_code == 200
    state = room(code, b)
    assert state["status"] == "playing" and state["proposal"] is None
    assert any(e["id"] == "seal" for e in state["evidence"])
