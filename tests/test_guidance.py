"""Every task names a next action and a concrete reason to talk to the teammate."""

from test_game import create, start, act, room, client, headers
from backend import main as game


def test_first_tasks_explain_both_roles_and_what_to_communicate():
    code, t = create()
    start(code, t)
    task = room(code, t)["objective"]
    assert task["action"]["evidence_id"] == "seal"
    assert "announcement log" in task["partner_task"]
    assert "announcement log" in task["communication"]
    assert (
        task["chapter"] == 1 and task["team_question"] == "Was the evacuation genuine?"
    )
    assert task["action"]["label"]


def test_discovering_a_clue_immediately_advances_task_without_a_share_step():
    code, t = create()
    start(code, t)
    act(code, t, "inspect", target="seal")
    state = room(code, t)
    assert state["objective"]["action"]["evidence_id"] == "note"
    assert state["evidence"][0]["shared"]
    assert state["shared_count"] == 1
    assert state["messages"][-1]["evidence_id"] == "seal"


def test_both_guided_roles_reach_a_solvable_case_without_power_or_share_actions():
    for case in ["last-announcement", "blue-carbuncle"]:
        code, t = create(case)
        start(code, t)
        actions = []
        for _ in range(30):
            state = room(code, t)
            g = state["objective"]
            a = g["action"]
            assert g["communication"] and g["partner_task"] and a["label"]
            assert set(g["source_ids"]) <= {e["id"] for e in state["evidence"]}
            assert a["kind"] not in ["share", "assist"]
            if a["kind"] == "theory":
                break
            if a["kind"] == "location":
                assert (
                    act(code, t, "inspect", target=a["evidence_id"]).status_code == 200
                )
            elif a["kind"] == "character":
                assert (
                    client.post(
                        f"/api/rooms/{code}/ask",
                        headers=headers(t),
                        json={"character": a["target"], "topic": a["topic"]},
                    ).status_code
                    == 200
                )
            elif a["kind"] == "partner":
                act(code, t, "switch")
            else:
                raise AssertionError(a)
            actions.append(a["kind"])
        assert state["can_solve"] and g["ready"] and g["chapter"] == 3
        assert len(actions) < 20
