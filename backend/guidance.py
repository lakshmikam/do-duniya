"""Plain, role-specific tasks and concrete reasons to talk to the other player."""


def handoff_prompt(evidence_id):
    return {
        "seal": "Was anyone authorized to collect the crate tonight?",
        "broadcast": "Does this match what the witnesses heard?",
        "note": "Can you find the route to the store?",
        "route": "Follow this route and check the store door.",
        "access": "Ask Dev why his name is in the key register.",
        "docket": "Does the approved pickup time match Dev’s account?",
        "found": "Compare Arun’s account with the key and pickup records.",
        "admission": "Do the records support this account? Decide together.",
        "stone": "Can you connect this jewel to the hotel case?",
        "baker": "Where did the Alpha Inn buy its geese?",
        "alpha": "Follow the inn’s supplier to the market.",
        "supplier": "Follow this supplier to Brixton Road.",
        "visitor": "Does this visitor appear in the hotel records?",
        "ryder": "Compare this hotel role with the visitor at the market.",
        "twins": "Could someone have taken the wrong bird?",
        "leela_admission": "Does this paid absence change what the key loan meant? Ask Mira.",
        "mira_admission": "Compare the favor with the clerk’s claim that he never used the cupboard.",
    }.get(evidence_id, "What does this change about our explanation?")


def comparison_hint(c, r):
    """Name a missing comparison without revealing a culprit or a secret."""
    k = set(r['shared'])
    pairs = {tuple(p) for p in r.get('challenges', [])}
    if c['id'] == 'last-announcement':
        if 'broadcast' in k and ('mira_control', 'broadcast') not in pairs:
            return 'Compare Mira’s claim of a live warning with the announcement log. Visit her and present the passage that disagrees.'
        if 'receipt' in k and 'leela_admission' not in k:
            return 'Compare Leela’s claim about staying by the coach with the canteen receipt. Your records partner can check which clock those times use.'
        if 'leela_admission' in k and 'mira_admission' not in k:
            return 'The paid absence changes the context of the borrowed key. Ask Mira about her account, then compare it with the register.'
        if {'docket', 'access'} <= k and 'admission' not in k:
            return 'Compare the urgent-pickup claim with the approval, and the parcel-office claim with the key register. Present each contradiction separately.'
    else:
        if {'arrest', 'cusack'} <= k and ('brad_proof', 'cusack') not in pairs:
            return 'Bradstreet says the paperwork proves the theft. Compare the accusation and the maid’s statement with what each actually establishes.'
        if 'supplier' in k and 'visitor' not in k:
            return 'Compare the dealer’s claim about Essex with his supplier account. One gives you a new person to ask about.'
        if {'visitor', 'ryder'} <= k and 'confession' not in k:
            return 'Compare the visitor’s denial about a goose with the dealer’s testimony. Then test his claim of exclusive access against the hotel record.'
    return None


def next_objective(c, r, p):
    known = set(r["shared"])
    role = p["role"]
    routes = c["solution"].get("support_routes", [c["solution"]["required"]])
    ready = any(set(route) <= known for route in routes)

    def find(id, text, communication):
        e = next(e for e in c["evidence"] if e["id"] == id)
        return dict(
            phase="investigate",
            text=text,
            communication=communication,
            action=dict(
                kind="location",
                target=e["location"],
                evidence_id=id,
                label="Open: " + e["title"],
            ),
            source_ids=[],
        )

    def talk(id, topic, text, communication, sources=()):
        ch = next(ch for ch in c["characters"] if ch["id"] == id)
        return dict(
            phase="investigate",
            text=text,
            communication=communication,
            action=dict(
                kind="character",
                target=id,
                location=ch["location"],
                topic=topic,
                label="Talk to " + ch["name"],
            ),
            source_ids=list(sources),
        )

    def ask(text, communication, sources=()):
        return dict(
            phase="coordinate",
            text=text,
            communication=communication,
            action=dict(kind="partner", label="Ask your partner"),
            source_ids=list(sources),
        )

    def task(who):
        if ready:
            return dict(
                phase="reconstruct",
                text="You have enough clues. Agree who did it, how it happened, and what the records prove.",
                communication="What explanation fits all the clues in our notebook?",
                action=dict(kind="theory", label="Solve the case together"),
                source_ids=[],
            )
        if c["id"] == "last-announcement":
            if who == "archive":
                for id, text, message in [
                    (
                        "broadcast",
                        "Read the announcement log. Check whether control sent a live warning.",
                        "I’m checking the announcement. What did the people on the platform hear?",
                    ),
                    (
                        "route",
                        "Find the service route. Your partner needs it to look for Arun.",
                        "The announcement log is in our notebook. I’m finding the way to the store.",
                    ),
                    (
                        "access",
                        "Read the key register. Find who could use the announcement equipment.",
                        "The store route is in our notebook. Can you go there while I check the keys?",
                    ),
                    (
                        "docket",
                        "Read the pickup approval. Check when the crate was meant to leave.",
                        "Who says the crate was being collected tonight? I’m checking the approved time.",
                    ),
                ]:
                    if id not in known:
                        return find(id, text, message)
                return ask(
                    "Your records are complete. Your partner is checking the store; ask what they found.",
                    "I checked the log, keys and pickup time. What did you find in the store?",
                    ("route", "access", "docket"),
                )
            if "seal" not in known:
                return find(
                    "seal",
                    "Check the crate’s broken seal on the platform.",
                    "I’m checking the crate. Can you read the announcement log?",
                )
            if "note" not in known:
                return find(
                    "note",
                    "Open Arun’s note in the station office. Find where he was heading.",
                    "The seal was cut. Does your log say the warning was genuine?",
                )
            if "route" not in known:
                return ask(
                    "Your partner must find the store route in the records. Ask for it here.",
                    "Arun’s note points to the service passage. Can you find the store route?",
                    ("note",),
                )
            if "found" not in known:
                return find(
                    "found",
                    "Your partner found the route. Open the store door in the relay passage.",
                    "I have the store route. I’m following it now—check who had the keys.",
                )
            missing = [id for id in ["access", "docket"] if id not in known]
            if missing:
                return ask(
                    "You found Arun. Your partner still needs to check the key register and pickup approval.",
                    "Arun’s account is in our notebook. Can you check the keys and approved pickup time?",
                    ("found",),
                )
            return talk(
                "dev",
                "confront",
                "Ask Dev to explain the key register and pickup approval.",
                "The accounts do not line up. What should we ask Dev?",
                ("found", "access", "docket"),
            )
        if who == "archive":
            for id, text, message in [
                (
                    "alpha",
                    "Read the Alpha Inn account. Find who supplied its geese.",
                    "I’m checking the inn’s supplier. What did you find with Baker?",
                ),
                (
                    "ryder",
                    "Read the hotel attendant’s record. Check who had access to the room.",
                    "The market route is in our notebook. Who keeps asking about a particular bird?",
                ),
                (
                    "arrest",
                    "Read why Horner was accused. Separate the accusation from proof.",
                    "The hotel record names the people with access. Does that match your visitor?",
                ),
            ]:
                if id not in known:
                    return find(id, text, message)
            return ask(
                "Your partner is following the bird. Ask what the supplier and visitor revealed.",
                "What does the bird trail tell us about the hotel theft?",
                ("ryder",),
            )
        if "stone" not in known:
            return find(
                "stone",
                "Examine the jewel recovered from the goose.",
                "I’m checking the recovered jewel. Can you read the hotel case?",
            )
        if "baker" not in known:
            return talk(
                "henry",
                "remains",
                "Ask Baker whether he wants his original bird back or a replacement.",
                "I’m asking Baker about his bird. Can you trace the Alpha Inn’s supplier?",
                ("stone",),
            )
        if "alpha" not in known:
            return ask(
                "Your partner must find the inn’s supplier. Ask for the market lead.",
                "Baker got the bird from the Alpha Inn. Who supplied the inn?",
                ("baker",),
            )
        if "supplier" not in known:
            return find(
                "supplier",
                "Open the dealer’s supplier record at the market.",
                "I’m at the market. Can you check the hotel attendant’s name?",
            )
        if "visitor" not in known:
            return talk(
                "dealer",
                "visitor",
                "Ask the dealer about the visitor looking for one particular goose.",
                "Does the name of the hotel attendant match the returning visitor?",
                ("supplier",),
            )
        if "twins" not in known:
            return talk(
                "oakshott", "twins",
                "Follow the supplier to Brixton Road. Ask Mrs Oakshott about the similar birds.",
                "I’m checking the birds at Brixton Road. Compare the visitor with the hotel record.",
                ("supplier",),
            )
        if "ryder" not in known:
            return ask(
                "Your partner must check the visitor’s hotel connection.",
                "The visitor’s name is in our notebook. Does he appear in the hotel records?",
                ("visitor",),
            )
        return talk(
            "james",
            "confront",
            "Ask Ryder to explain the jewel, supplier record and his hotel role.",
            "Does this chain of clues support the original accusation?",
            ("stone", "supplier", "ryder"),
        )

    mine, theirs = task(role), task("archive" if role == "field" else "field")
    if ready:
        chapter, title, question = (
            3,
            "Decide together",
            "What explanation fits the clues?",
        )
    elif c["id"] == "last-announcement":
        chapter = 2 if {"route", "note"} <= known else 1
        title = "Find Arun" if chapter == 2 else "Check the warning"
        question = (
            "Where did Arun go?" if chapter == 2 else "Was the evacuation genuine?"
        )
    else:
        chapter = 2 if {"alpha", "stone", "baker"} <= known else 1
        title = "Follow the bird" if chapter == 2 else "Connect the two cases"
        question = (
            "Who wanted that particular goose?"
            if chapter == 2
            else "How are the jewel and the goose connected?"
        )
    return mine | dict(
        chapter=chapter,
        chapter_title=title,
        team_question=question,
        partner_task=theirs["text"],
        ready=ready,
    )
