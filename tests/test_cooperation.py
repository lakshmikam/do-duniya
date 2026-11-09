"""A reciprocal scene action must stay solvable and honor both roles."""

from test_game import act, room, inspect_share
from test_partner_link import duo
from backend import main as game


def test_partner_route_opens_the_next_scene_without_an_extra_power_switch():
    code, field, records = duo()
    assert act(code, field, "inspect", target="found").status_code == 403
    assert act(code, records, "inspect", target="route").status_code == 200
    assert any(e["id"] == "route" for e in room(code, field)["evidence"])
    assert act(code, field, "inspect", target="found").status_code == 200
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


def test_two_players_cannot_overwrite_each_others_pending_answers():
    code, a, b = duo()
    for id in ["seal", "tracks", "note"]:
        assert act(code, a, "inspect", target=id).status_code == 200
    answers = {"culprit": "dev", "method": "recording", "where": "store"}
    assert (
        act(
            code, a, "propose", answers=answers, evidence=["seal", "tracks", "note"]
        ).status_code
        == 200
    )
    assert (
        act(
            code, b, "propose", answers=answers, evidence=["seal", "tracks", "note"]
        ).status_code
        == 409
    )
    assert room(code, b)["proposal"]["by"] == "A"
