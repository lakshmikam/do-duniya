"""Spoiler-bounded next actions derived only from discoveries visible to a player."""


def next_objective(c, r, p):
    own = r["discoveries"][p["role"]]
    shared = set(r["shared"])
    known = set(own) | shared

    def locate(id):
        e = next(e for e in c["evidence"] if e["id"] == id)
        return {
            "kind": "location",
            "target": e["location"],
            "evidence_id": id,
            "title": e["title"],
        }

    pending = [id for id in own if id not in shared]
    if pending:
        e = next(e for e in c["evidence"] if e["id"] == pending[-1])
        return {
            "phase": "share",
            "text": f'You found “{e["title"]}”. Share it so your partner can connect it to their side of the case.',
            "action": {"kind": "share", "target": e["id"]},
            "source_ids": [e["id"]],
        }
    if c["id"] == "last-announcement":
        if p["role"] == "archive":
            sequence = [
                (
                    "broadcast",
                    "Start with the broadcast log. Was this a live warning, or a recording?",
                ),
                (
                    "access",
                    "Now trace access to the broadcast cupboard. Who could play that recording?",
                ),
                (
                    "docket",
                    "Compare the evacuation with the collection paperwork. Was anyone authorized to remove the crate?",
                ),
                (
                    "route",
                    "Find the service route and share it. Your field partner needs a way to follow the trolley.",
                ),
            ]
            for id, text in sequence:
                if id not in known:
                    return {
                        "phase": "investigate",
                        "text": text,
                        "action": locate(id),
                        "source_ids": [],
                    }
            text = "Your records are shared. Ask your partner what they found in the relay passage; compare that account with the key and collection records."
            if "admission" not in known:
                return {
                    "phase": "coordinate",
                    "text": text,
                    "action": {"kind": "board"},
                    "source_ids": [
                        id
                        for id in ["broadcast", "access", "docket", "route"]
                        if id in known
                    ],
                }
        else:
            sequence = [
                (
                    "seal",
                    "Inspect the crate seal. Did the storm open it, or did someone cut it?",
                ),
                (
                    "note",
                    "Check the station office for a trace of Arun’s last movements.",
                ),
            ]
            for id, text in sequence:
                if id not in known:
                    return {
                        "phase": "investigate",
                        "text": text,
                        "action": locate(id),
                        "source_ids": [],
                    }
            if "route" not in known:
                return {
                    "phase": "coordinate",
                    "text": "Arun followed someone into the service passage. Ask your records partner to find and share the service route. You can inspect Leela’s receipt while they search.",
                    "action": locate("receipt"),
                    "source_ids": ["note"],
                }
            if "found" not in known:
                return {
                    "phase": "follow",
                    "text": "Your partner found a route. Follow it to the relay passage and investigate the voice behind the door.",
                    "action": locate("found"),
                    "source_ids": ["route"],
                }
            if {"access", "docket"} <= known and "admission" not in known:
                return {
                    "phase": "confront",
                    "text": "Arun’s account and the records now overlap. Return to Dev and present the key register together with the collection docket.",
                    "action": {
                        "kind": "character",
                        "target": "dev",
                        "location": "platform",
                    },
                    "source_ids": ["found", "access", "docket"],
                }
            if not {"access", "docket"} <= known:
                return {
                    "phase": "coordinate",
                    "text": "You found Arun. Ask your partner to share the key register and collection docket before confronting the account you were given.",
                    "action": {"kind": "board"},
                    "source_ids": ["found"],
                }
            text = "You have the witness account and the records. Compare them together, then build a reconstruction supported by shared evidence."
    else:
        if p["role"] == "archive":
            sequence = [
                (
                    "alpha",
                    "Trace the Alpha Inn’s account. Your city partner needs the name of the market supplier.",
                ),
                ("arrest", "Read exactly what supports the accusation against Horner."),
                (
                    "ryder",
                    "Check who had access at the hotel. Share that person’s role, not just your suspicion.",
                ),
                ("cusack", "Separate what Cusack saw from what she only heard."),
            ]
            for id, text in sequence:
                if id not in known:
                    return {
                        "phase": "investigate",
                        "text": text,
                        "action": locate(id),
                        "source_ids": [],
                    }
            text = "Your dossier is shared. Ask your partner who is trying to recover the bird, and compare that identity with the hotel witness."
            if "confession" not in known:
                return {
                    "phase": "coordinate",
                    "text": text,
                    "action": {"kind": "board"},
                    "source_ids": [id for id in ["alpha", "ryder"] if id in known],
                }
        else:
            if "stone" not in known:
                return {
                    "phase": "investigate",
                    "text": "Examine the recovered jewel. This is the link between a Christmas dinner and the hotel theft.",
                    "action": locate("stone"),
                    "source_ids": [],
                }
            if "baker" not in known:
                return {
                    "phase": "investigate",
                    "text": "See whether Baker wants his original goose back, or would accept a replacement. What does his reaction suggest?",
                    "action": locate("baker"),
                    "source_ids": ["stone"],
                }
            if "alpha" not in known:
                return {
                    "phase": "coordinate",
                    "text": "Baker names the Alpha Inn. Ask your records partner to share the inn’s supplier account so you can follow the bird.",
                    "action": {"kind": "board"},
                    "source_ids": ["baker"],
                }
            for id, text in [
                (
                    "supplier",
                    "The inn account opens the market trail. Find Breckinridge’s supplier.",
                ),
                (
                    "visitor",
                    "Find out why the returning visitor wants one particular bird.",
                ),
                (
                    "twins",
                    "Follow the supplier record to Brixton Road. Ask what made these birds easy to confuse.",
                ),
            ]:
                if id not in known:
                    return {
                        "phase": "follow",
                        "text": text,
                        "action": locate(id),
                        "source_ids": [x for x in ["alpha", "supplier"] if x in known],
                    }
            if "ryder" not in known:
                return {
                    "phase": "coordinate",
                    "text": "You know the visitor’s name. Ask your records partner to share his connection to the hotel.",
                    "action": {"kind": "board"},
                    "source_ids": ["visitor"],
                }
            if "confession" not in known:
                return {
                    "phase": "confront",
                    "text": "The two trails meet. Present the recovered stone, supplier record and hotel dossier to Ryder.",
                    "action": {
                        "kind": "character",
                        "target": "james",
                        "location": "market",
                    },
                    "source_ids": ["stone", "supplier", "ryder"],
                }
            text = "The bird trail and hotel account connect. Agree which facts clear the accused man, and support your final explanation."
    return {
        "phase": "reconstruct",
        "text": text,
        "action": {"kind": "theory"},
        "source_ids": [id for id in shared if id in known][:5],
    }
