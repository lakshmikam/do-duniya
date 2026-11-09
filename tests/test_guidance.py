"""Story continuity without leaking the other player's undiscovered evidence."""

from test_game import create, start, act, room, inspect_share, client, headers


def test_train_lead_changes_on_discovery_share_and_partner_route():
    code, t = create()
    start(code, t)
    assert room(code, t)["objective"]["action"]["evidence_id"] == "seal"
    act(code, t, "inspect", target="seal")
    guide = room(code, t)["objective"]
    assert guide["phase"] == "share" and guide["source_ids"] == ["seal"]
    act(code, t, "share", target="seal")
    assert room(code, t)["objective"]["action"]["evidence_id"] == "note"
    inspect_share(code, t, "note")
    assert room(code, t)["objective"]["phase"] == "coordinate"
    act(code, t, "switch")
    inspect_share(code, t, "route")
    act(code, t, "assist", target="service_gate")
    act(code, t, "switch")
    guide = room(code, t)["objective"]
    assert guide["phase"] == "follow" and guide["action"]["evidence_id"] == "found"
    assert guide["source_ids"] == ["route"]


def test_both_cases_guidance_sources_are_visible_and_targets_accessible():
    for case in ["last-announcement", "blue-carbuncle"]:
        code, t = create(case)
        start(code, t)
        # Walk the suggested leads across both perspectives. Confrontations
        # remain deliberate player actions; no solution is proposed for them.
        for _ in range(32):
            v = room(code, t)
            g = v["objective"]
            a = g["action"]
            assert set(g["source_ids"]) <= {e["id"] for e in v["evidence"]}
            assert not {"answers", "solution", "culprit"} & set(g)
            if a["kind"] == "share":
                assert act(code, t, "share", target=a["target"]).status_code == 200
            elif a["kind"] == "location":
                assert any(
                    l["id"] == a["target"] and not l["locked"] for l in v["locations"]
                )
                assert (
                    act(code, t, "inspect", target=a["evidence_id"]).status_code == 200
                )
                if g["phase"] == "coordinate":
                    act(code, t, "switch")
            elif g["phase"] == "coordinate":
                act(code, t, "switch")
            elif a["kind"] == "assist":
                assert act(code, t, "assist", target=a["target"]).status_code == 200
            elif a["kind"] == "character":
                assert any(c["id"] == a["target"] for c in v["characters"])
                if g["phase"] == "confront":
                    break
                assert (
                    client.post(
                        f"/api/rooms/{code}/ask",
                        headers=headers(t),
                        json={"character": a["target"], "topic": a["topic"]},
                    ).status_code
                    == 200
                )
            else:
                break
        assert g["phase"] == "confront"
