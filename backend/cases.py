"""Authored case packages. Solutions and unrevealed evidence never leave the server."""

from .cast import expand_cast


def clue(id, title, text, role, location, kind="document", requires=()):
    return dict(
        id=id,
        title=title,
        text=text,
        role=role,
        location=location,
        kind=kind,
        requires=list(requires),
    )


def response(id, label, text, reveals=None, requires=()):
    return dict(id=id, label=label, text=text, reveals=reveals, requires=list(requires))


TRAIN = {
    "id": "last-announcement",
    "number": "01",
    "title": "The Last Announcement",
    "eyebrow": "VAYAL JUNCTION · 23:47",
    "genre": "A railway mystery",
    "duration": 18,
    "tagline": "The train stopped. The story didn’t.",
    "description": "A midnight announcement. A missing station master. A sealed consignment that vanished in the rain. Someone knows more than they are saying.",
    "brief": "The night express is stranded at Vayal Junction. At 23:47, an announcement cleared the luggage coach. The museum’s brass astronomical instrument disappeared. Station master Arun Sen is missing. Find who moved the consignment, how the announcement helped, and where Arun went.",
    "credit": "An original fictional case written for Do Duniya. All people, records and locations are invented.",
    "source": None,
    "roles": {
        "field": {
            "name": "Station investigator",
            "subtitle": "Walk the platform. Question the witnesses.",
        },
        "archive": {
            "name": "Records investigator",
            "subtitle": "Read the logs. Find what doesn’t fit.",
        },
    },
    "locations": [
        {
            "id": "platform",
            "name": "Platform 03",
            "role": "field",
            "description": "Rain needles the station roof. The luggage coach stands open. A trolley has left a dark arc across the tiles.",
        },
        {
            "id": "office",
            "name": "Station office",
            "role": "field",
            "description": "An untouched cup of tea. A coat still on its hook. Whoever left this room expected to return.",
        },
        {
            "id": "relay",
            "name": "Relay passage",
            "role": "field",
            "requires": ["route"],
            "description": "Beyond the service gate, the generator hum covers a faint knock from inside an old store.",
        },
        {
            "id": "console",
            "name": "Broadcast console",
            "role": "archive",
            "description": "The loudspeaker has fallen silent. The announcement log and key register lie beside the console. Check them against what the witnesses heard.",
        },
        {
            "id": "records",
            "name": "Dispatch archive",
            "role": "archive",
            "description": "A collection docket, an access register and a delivery receipt. Three records. One impossible account.",
        },
    ],
    "evidence": [
        clue(
            "seal",
            "The cut seal",
            "The museum crate’s seal was cut cleanly. The emergency axe is untouched. This was not storm damage.",
            "field",
            "platform",
            "object",
        ),
        clue(
            "tracks",
            "A trolley’s turn",
            "Wet brass polish marks a trolley trail from the luggage coach toward the service gate, away from the passenger exit.",
            "field",
            "platform",
            "observation",
        ),
        clue(
            "note",
            "Arun’s unfinished note",
            "“23:49 — dispatch says no night collection. Someone is moving the museum crate through the service passage. Following. Do not let the train depart.”",
            "field",
            "office",
        ),
        clue(
            "receipt",
            "Leela’s delivery receipt",
            "The tea supplier’s signed receipt places Leela in the public canteen at 23:46–23:51. Her frightened departure was not a luggage collection.",
            "field",
            "office",
        ),
        clue(
            "broadcast",
            "A borrowed announcement",
            "At 23:47 the console played evacuation file E-14 locally. It was not a live message. The line “keep the luggage aisle clear” belongs to an old drill.",
            "archive",
            "console",
            "audio",
        ),
        clue(
            "access",
            "The key register",
            "The broadcast cupboard key was checked out to Dev Rao at 23:39. Arun’s signature is absent. The key had not been returned by 23:55.",
            "archive",
            "console",
        ),
        clue(
            "docket",
            "A collection that wasn’t",
            "The museum authorized collection for 08:00 tomorrow. No overnight courier or emergency transfer was approved. Dev’s handwritten 23:45 instruction is not countersigned.",
            "archive",
            "records",
        ),
        clue(
            "route",
            "The service route",
            "Follow the service passage to the old relay store, then the west loading bay. The store latch opens from the passage. Your partner can follow this route to check the locked door.",
            "archive",
            "records",
        ),
        clue(
            "clock",
            "The corrected clock",
            "The platform clock is four minutes slow. Console times use the radio clock. Witness memories of the clock are not precise alibis.",
            "archive",
            "records",
        ),
        clue(
            "found",
            "The voice behind the door",
            "Arun is alive in the relay store. He says Dev pushed the door shut after Arun challenged the removal. The museum crate stands under a tarpaulin at the west loading bay.",
            "field",
            "relay",
            "testimony",
            ["route"],
        ),
        clue(
            "admission",
            "Dev changes his account",
            "Shown the key register and false collection docket, Dev admits playing the drill to clear the aisle. He intended to sell the instrument; Arun followed and was locked in the store.",
            "field",
            "platform",
            "testimony",
            ["access", "docket"],
        ),
    ],
    "characters": [
        {
            "id": "dev",
            "name": "Dev Rao",
            "occupation": "Consignment clerk",
            "role": "field",
            "location": "platform",
            "initial": "The museum arranged an urgent collection. I was only following instructions. Arun must have gone to inspect the track.",
            "responses": [
                response(
                    "timing",
                    "Ask about the announcement",
                    "I heard the announcement like everyone else. There was rain, shouting, luggage. I cannot tell you the exact minute.",
                ),
                response(
                    "collection",
                    "Ask who authorized collection",
                    "The instructions were on the collection docket. If control has a different copy, ask them to check it.",
                ),
                response(
                    "confront",
                    "Present the key register and collection docket",
                    "All right. I played the old drill. There was no courier. Arun followed the trolley, so I shut him in the relay store. The crate is at the west bay.",
                    "admission",
                    ["access", "docket"],
                ),
            ],
        },
        {
            "id": "leela",
            "name": "Leela Das",
            "occupation": "Night porter",
            "role": "field",
            "location": "platform",
            "initial": "I was already at the canteen when I heard “evacuate”. I thought the water had reached the coach. Please don’t confuse being afraid with stealing something.",
            "responses": [
                response(
                    "where",
                    "Ask where she went",
                    "The canteen. I was signing for the tea delivery. The receipt should still be in the station office.",
                ),
                response(
                    "trolley",
                    "Ask about the trolley",
                    "Dev asked me to leave the trolley beside the luggage coach before the announcement. I did not see what he loaded.",
                ),
            ],
        },
        {
            "id": "mira",
            "name": "Mira Joseph",
            "occupation": "Signal operator",
            "role": "archive",
            "location": "console",
            "initial": "No emergency came from my signal desk. Let’s separate what the loudspeaker said from what the railway authorized.",
            "responses": [
                response(
                    "local",
                    "Ask how a recording could play",
                    "A local playback uses the cupboard key. The broadcast log identifies the file. Compare it with the key register.",
                ),
                response(
                    "time",
                    "Ask about conflicting times",
                    "Use the radio-clock timestamps in the console. The platform clock was running slow; the maintenance note records the difference.",
                ),
            ],
        },
    ],
    "suspects": [
        {"id": "dev", "name": "Dev Rao"},
        {"id": "leela", "name": "Leela Das"},
        {"id": "mira", "name": "Mira Joseph"},
    ],
    "questions": [
        {
            "id": "method",
            "label": "What was the announcement?",
            "options": [
                {"id": "recording", "label": "An old drill played locally"},
                {"id": "live", "label": "A live warning from control"},
                {"id": "weather", "label": "An automatic weather alert"},
            ],
        },
        {
            "id": "where",
            "label": "Where did Arun go?",
            "options": [
                {"id": "store", "label": "Locked inside the relay store"},
                {"id": "track", "label": "Inspecting the flooded track"},
                {"id": "train", "label": "Left on another train"},
            ],
        },
    ],
    "solution": {
        "culprit": "dev",
        "method": "recording",
        "where": "store",
        "required": ["broadcast", "admission", "found"],
        "support_routes": [
            ["broadcast", "admission", "found"],
            ["access", "docket", "found"],
        ],
        "reveal": "Dev used a borrowed key to play an old drill, clearing the luggage aisle. He moved the instrument under a false collection instruction. Arun followed the trolley, challenged him and was locked in the relay store. Leela’s receipt clears her; the slow clock explains the misleading times. The crate is recovered at the west loading bay.",
        "timeline": [
            ("23:39", "Dev signs out the broadcast key."),
            ("23:47", "He plays the old drill and clears the luggage aisle."),
            ("23:49", "Arun follows the trolley into the service passage."),
            (
                "23:51",
                "Dev locks Arun in the relay store and leaves the crate at the west bay.",
            ),
        ],
    },
    "hints": [
        "The announcement and the authorization are different things. Compare the broadcast log and collection docket.",
        "Your partner’s discoveries matter. Share the route and read the key register together.",
        "Find Arun before deciding what happened to him. The service route opens the relay passage.",
    ],
}

BLUE = {
    "id": "blue-carbuncle",
    "number": "02",
    "title": "The Blue Carbuncle",
    "eyebrow": "LONDON · CHRISTMAS, 1892",
    "genre": "A stolen jewel. An innocent man.",
    "duration": 20,
    "tagline": "A precious stone. A very ordinary goose.",
    "description": "A jewel stolen from a hotel turns up in a Christmas goose. Follow a trail of small transactions before the wrong man takes the blame.",
    "brief": "A blue jewel has been found inside a Christmas goose brought to Baker Street. At the Hotel Cosmopolitan, plumber John Horner stands accused of stealing it. One investigator follows the bird through London; the other examines the hotel accounts. Connect the chains and test the accusation.",
    "credit": "Adapted from Arthur Conan Doyle’s “The Adventure of the Blue Carbuncle” (1892). Original dialogue, clue records and cooperative structure by Do Duniya. Some records are invented for gameplay. Not an official Sherlock Holmes production.",
    "source": "https://www.gutenberg.org/ebooks/1661",
    "roles": {
        "field": {
            "name": "Street investigator",
            "subtitle": "Follow the goose through London.",
        },
        "archive": {
            "name": "Records investigator",
            "subtitle": "Examine the hotel case and incoming records.",
        },
    },
    "locations": [
        {
            "id": "street",
            "name": "Baker Street",
            "role": "field",
            "description": "A battered hat lies beside an astonishing blue stone. Henry Baker has come to reclaim his lost Christmas dinner.",
        },
        {
            "id": "market",
            "name": "Covent Garden",
            "role": "field",
            "requires": ["alpha"],
            "description": "The market is closing. Breckinridge is tired of being asked about his geese. One anxious visitor keeps returning.",
        },
        {
            "id": "brixton",
            "name": "Brixton Road",
            "role": "field",
            "requires": ["supplier"],
            "description": "Mrs Oakshott remembers two almost identical geese, and her brother’s peculiar urgency.",
        },
        {
            "id": "hotel",
            "name": "Hotel dossier",
            "role": "archive",
            "description": "A plumber’s arrest, an attendant’s account and a maid’s statement. The jewel was never found on the accused man.",
        },
        {
            "id": "ledger",
            "name": "Supplier records",
            "role": "archive",
            "description": "The Alpha Inn’s order can connect a lost bird to the market. Follow ownership, not appearances.",
        },
    ],
    "evidence": [
        clue(
            "stone",
            "The recovered jewel",
            "Peterson’s household found the blue stone inside the goose. The stone matches the description of the Countess of Morcar’s stolen jewel.",
            "field",
            "street",
            "object",
        ),
        clue(
            "baker",
            "Baker accepts a replacement",
            "Henry Baker readily accepts a replacement goose and shows no interest in the remains of his original bird. He identifies the Alpha Inn goose club.",
            "field",
            "street",
            "testimony",
        ),
        clue(
            "alpha",
            "The Alpha Inn account",
            "The inn bought its Christmas goose-club birds from Breckinridge at Covent Garden. Henry Baker was one of the club members.",
            "archive",
            "ledger",
        ),
        clue(
            "supplier",
            "Breckinridge’s supplier",
            "The dealer’s account names Mrs Oakshott of Brixton Road as the supplier of the relevant batch.",
            "field",
            "market",
        ),
        clue(
            "visitor",
            "The anxious visitor",
            "A man at the market urgently asks for a white goose with a barred tail. He first offers a false name, then identifies himself as James Ryder.",
            "field",
            "market",
            "testimony",
        ),
        clue(
            "arrest",
            "The accusation against Horner",
            "Ryder says Horner was left repairing the grate before the jewel went missing. The jewel was not recovered from Horner or his rooms. Suspicion is not a chain of possession.",
            "archive",
            "hotel",
        ),
        clue(
            "ryder",
            "Ryder’s hotel position",
            "James Ryder is the hotel’s head attendant and the principal witness against Horner. He had access to the room as well as knowledge of the repair.",
            "archive",
            "hotel",
        ),
        clue(
            "cusack",
            "Cusack’s limited statement",
            "Catherine Cusack reports hearing Ryder raise the alarm. Her statement does not establish when the jewel left the room or who carried it away.",
            "archive",
            "hotel",
        ),
        clue(
            "twins",
            "Two barred-tailed birds",
            "Mrs Oakshott confirms two similar barred-tailed geese. Her brother James Ryder took one; the other went to Breckinridge with the market batch.",
            "field",
            "brixton",
            "testimony",
            ["supplier"],
        ),
        clue(
            "confession",
            "The wrong goose",
            "Confronted with the recovered stone, supplier record and his hotel role, Ryder admits the theft. He hid the stone in a goose at his sister’s yard, then took the wrong similar-looking bird.",
            "field",
            "market",
            "testimony",
            ["stone", "supplier", "ryder"],
        ),
    ],
    "characters": [
        {
            "id": "henry",
            "name": "Henry Baker",
            "occupation": "Goose-club member",
            "role": "field",
            "location": "street",
            "initial": "The bird was my Christmas dinner. I lost it in a street scuffle. If there is a replacement, I would be most grateful.",
            "responses": [
                response(
                    "inn",
                    "Ask where he obtained the goose",
                    "At the Alpha Inn. I paid into the goose club over several weeks. I knew nothing unusual about the bird.",
                ),
                response(
                    "remains",
                    "Offer the remains of his original goose",
                    "No need to keep the feathers or crop for me. A fresh bird is quite sufficient.",
                    "baker",
                ),
            ],
        },
        {
            "id": "dealer",
            "name": "Breckinridge",
            "occupation": "Market dealer",
            "role": "field",
            "location": "market",
            "initial": "First one fellow, now you. What is so extraordinary about a batch of geese?",
            "responses": [
                response(
                    "source",
                    "Ask about the supplier",
                    "My account is plain: Mrs Oakshott, Brixton Road. I sold the batch to the Alpha. Read the ledger rather than argue with me.",
                ),
                response(
                    "visitor",
                    "Ask about the returning visitor",
                    "A nervous little man wants a particular barred-tailed bird. He says Mrs Oakshott sent him. He calls himself Ryder now.",
                    "visitor",
                ),
            ],
        },
        {
            "id": "james",
            "name": "James Ryder",
            "occupation": "Hotel attendant",
            "role": "field",
            "location": "market",
            "initial": "I am merely trying to trace a goose. This is a private matter.",
            "responses": [
                response(
                    "bird",
                    "Ask why that particular bird matters",
                    "It was promised to me. A white bird with a bar across its tail. Surely you can understand wanting what is yours.",
                ),
                response(
                    "confront",
                    "Present the jewel, supplier record and hotel dossier",
                    "I stole it. I hid the stone in a goose at my sister’s, then took the wrong bird. There were two with barred tails. Horner did not take the jewel.",
                    "confession",
                    ["stone", "supplier", "ryder"],
                ),
            ],
        },
        {
            "id": "inspector",
            "name": "Inspector Bradstreet",
            "occupation": "Investigating officer",
            "role": "archive",
            "location": "hotel",
            "initial": "Horner was accused on the attendant’s account. Bring me evidence that connects someone else to the stone, not a feeling about his character.",
            "responses": [
                response(
                    "evidence",
                    "Ask what supports the arrest",
                    "Opportunity and Ryder’s accusation. The searches did not recover the stone. A complete chain from the hotel to the recovered bird would matter.",
                ),
                response(
                    "access",
                    "Ask who else had access",
                    "Ryder was the head attendant. Cusack knew the room. Horner’s presence alone does not establish exclusive access.",
                ),
            ],
        },
    ],
    "suspects": [
        {"id": "james", "name": "James Ryder"},
        {"id": "henry", "name": "Henry Baker"},
        {"id": "horner", "name": "John Horner"},
    ],
    "questions": [
        {
            "id": "method",
            "label": "How did the jewel enter the market?",
            "options": [
                {
                    "id": "goose",
                    "label": "Hidden in a goose; a similar bird was taken by mistake",
                },
                {"id": "hat", "label": "Sold inside Henry Baker’s hat"},
                {"id": "dealer", "label": "Planted by the dealer"},
            ],
        },
        {
            "id": "where",
            "label": "What follows for Horner?",
            "options": [
                {
                    "id": "innocent",
                    "label": "Ryder’s account and the bird trail clear him",
                },
                {"id": "partner", "label": "He was Ryder’s accomplice"},
                {"id": "unknown", "label": "The bird proves nothing about the theft"},
            ],
        },
    ],
    "solution": {
        "culprit": "james",
        "method": "goose",
        "where": "innocent",
        "required": ["confession", "ryder", "twins"],
        "support_routes": [
            ["confession", "ryder", "twins"],
            ["stone", "ryder", "twins", "visitor"],
        ],
        "reveal": "Ryder stole the stone after arranging suspicion to fall on Horner, with Cusack’s involvement described in the original story. He hid it in a goose at his sister’s yard, confused two similar birds, and lost it into the market supply. Breckinridge sold the bird to the Alpha Inn; Baker received it; Peterson recovered it. Baker’s ignorance and the bird’s journey expose the false accusation against Horner. Our adaptation ends with the evidence submitted to clear him, rather than reproducing Holmes’s original decision to let Ryder leave.",
        "timeline": [
            (
                "22 DEC",
                "The jewel is stolen at the Hotel Cosmopolitan; Horner is accused.",
            ),
            (
                "LATER",
                "Ryder hides it in a goose at Mrs Oakshott’s yard and takes the wrong bird.",
            ),
            (
                "CHRISTMAS",
                "The other bird passes through Breckinridge and the Alpha to Baker.",
            ),
            ("27 DEC", "The recovered stone and supplier trail connect back to Ryder."),
        ],
    },
    "hints": [
        "Follow the goose in both directions. The hotel accusation alone cannot explain where the stone was found.",
        "Your archive partner can identify the Alpha’s supplier. Share that record to open the market.",
        "Compare Ryder’s interest in the bird with his role at the hotel. Ask Mrs Oakshott about the two similar geese.",
    ],
}

CASES = {c["id"]: c for c in [TRAIN, BLUE]}
expand_cast(CASES)


def catalog():
    fields = [
        "id",
        "number",
        "title",
        "eyebrow",
        "genre",
        "duration",
        "tagline",
        "description",
        "brief",
        "credit",
        "source",
        "roles",
    ]
    return [{k: c[k] for k in fields} for c in CASES.values()]


def validate_cases():
    for c in CASES.values():
        ids = {e["id"] for e in c["evidence"]}
        assert len(ids) == len(c["evidence"])
        assert set(c["solution"]["required"]) <= ids
        for route in c["solution"].get("support_routes", []):
            assert set(route) <= ids
        locations = {l["id"] for l in c["locations"]}
        for e in c["evidence"]:
            assert e["location"] in locations and set(e["requires"]) <= ids
        for ch in c["characters"]:
            for r in ch["responses"]:
                assert set(r["requires"]) <= ids
                assert not r["reveals"] or r["reveals"] in ids


validate_cases()
