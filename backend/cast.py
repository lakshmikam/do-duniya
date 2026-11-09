"""Original character colour and conversations; no hidden evidence is added here.

New leads belong in cases.py with explicit unlock conditions. These exchanges
add motives, working lives and witness limitations without changing the solution.
Timbre v3 voices/tags: https://www.gnani.ai/resources/timbre-v3
"""

PROFILES = {
    "dev": {
        "voice": "Devansh",
        "speed": 0.97,
        "tag": "<exhales>",
        "tone": "Guarded, defensive; precise about paperwork, evasive under pressure.",
        "fallback": "I cannot help with that question. If this concerns my shift, ask me about the paperwork, the museum consignment or the announcement.",
    },
    "leela": {
        "voice": "Kalpana",
        "speed": 1.02,
        "tag": "<sigh>",
        "tone": "Warm but shaken; practical, observant, and tired of being blamed.",
        "fallback": "I cannot help with that question. I can tell you about my work, the trolley, the canteen or what the warning felt like.",
    },
    "mira": {
        "voice": "Vasudha",
        "speed": 0.94,
        "tag": "",
        "tone": "Calm, exact and methodical; distinguishes observation from assumption.",
        "fallback": "I cannot help with that question. Bring it back to the signal desk: the clocks, the broadcast system or how to check a claim.",
    },
    "henry": {
        "voice": "Prakash",
        "speed": 0.93,
        "tag": "<slow>",
        "tone": "Polite, embarrassed and weary; old-fashioned, with a little dry humour.",
        "fallback": "I cannot help with that question. I can explain the goose club, the street scuffle or why a replacement dinner would suit me.",
    },
    "dealer": {
        "voice": "Harshad",
        "speed": 1.08,
        "tag": "<exhales>",
        "tone": "Brisk, impatient and wry; proud of his accounts and his trade.",
        "fallback": "I cannot help with that question. Ask me about the geese, the accounts, my supplier or that persistent visitor.",
    },
    "james": {
        "voice": "Yashraj",
        "speed": 1.04,
        "tag": "<sigh>",
        "tone": "Nervous and clipped; overexplains ordinary matters and avoids accusations.",
        "fallback": "I cannot help with that question. I came about a bird. Ask me about its markings or why I am looking for it.",
    },
    "inspector": {
        "voice": "Avinash",
        "speed": 0.92,
        "tag": "<slow>",
        "tone": "Steady and skeptical; courteous, firm and focused on corroboration.",
        "fallback": "I cannot help with that question. We need the accusation, access to the room, or evidence that connects the hotel to the recovered stone.",
    },
}
EXCHANGES = {
    "dev": [
        (
            "work",
            "Ask about his job and an ordinary night shift",
            "Consignment clerk. Labels, signatures, damaged corners, missing copies. Nobody notices a quiet shift; everybody remembers one missing crate.",
        ),
        (
            "museum",
            "Ask why the museum consignment mattered",
            "A museum instrument is not a sack of grain. There is a seal and a chain of signatures. The paperwork is supposed to travel with the crate.",
        ),
        (
            "arun",
            "Ask what Arun was like to work with",
            "Arun checks things twice. A signature, a latch, a destination. If you want to know where he went tonight, find something firmer than my guess about the track.",
        ),
        (
            "storm",
            "Ask how the storm affected his work",
            "You try keeping paper dry while people shout over the rain. That does not make a signature optional. It makes checking one harder.",
        ),
        (
            "pressure",
            "Ask why he sounds defensive or nervous",
            "Because you are asking me to account for every movement on a night when nobody could hear themselves think. Ask one thing at a time.",
        ),
        (
            "procedure",
            "Ask how a legitimate pickup should be checked",
            "Look for an authorized time and a countersignature. A handwritten instruction and an authorization are not necessarily the same document.",
        ),
        (
            "trust",
            "Ask whether to trust him or accuse him without evidence",
            "You do not have to trust my face. Compare the records. I will answer what you can actually put in front of me.",
        ),
    ],
    "leela": [
        (
            "work",
            "Ask about her work or what a porter notices",
            "People see the luggage move and forget the person moving it. I notice handles, wheels and where somebody leaves a trolley. I do not get to read every label.",
        ),
        (
            "fear",
            "Ask how she felt during the evacuation",
            "Afraid. A warning comes over the loudspeaker and everyone looks at everyone else. You move first, then spend the next hour wishing you had looked back.",
        ),
        (
            "arun",
            "Ask about Arun as a colleague",
            "He would rather ask an awkward question than sign something he had not checked. I hope someone is looking for him, not just arguing about the crate.",
        ),
        (
            "limits",
            "Ask what she actually saw versus guessed",
            "I saw where the trolley was left. I heard the warning. What someone loaded afterwards is not something I can honestly swear to.",
        ),
        (
            "blame",
            "Ask why she fears being blamed",
            "Because I left, and people make leaving sound like running away. I went to the canteen. Check the receipt instead of deciding from my expression.",
        ),
        (
            "routine",
            "Ask about tea deliveries or her normal break",
            "Even in weather like this, someone wants the delivery signed for. It is a small piece of paper until you need to prove where you were.",
        ),
        (
            "help",
            "Ask how to help her or what investigators should do next",
            "Listen separately, then compare. If two people repeat the same warning, that does not mean either of them knows who issued it.",
        ),
    ],
    "mira": [
        (
            "work",
            "Ask about signal work or her responsibilities",
            "My job is to keep movements safe and records usable. If I cannot trace an instruction to its source, I do not treat a confident voice as authorization.",
        ),
        (
            "certainty",
            "Ask whether she is certain, guessing or accusing someone",
            "I can explain what the system records. I cannot read a colleague’s mind. Keep that difference in your notebook.",
        ),
        (
            "storm",
            "Ask whether rain or the storm proves there was an emergency",
            "Bad weather is a condition, not an emergency order. Compare the announcement with the actual control record before joining those two things together.",
        ),
        (
            "arun",
            "Ask about Arun or whether he would investigate a problem",
            "Arun is careful about discrepancies. That is a description of his work, not proof of where he is now. Your field partner needs to follow the physical trail.",
        ),
        (
            "evidence",
            "Ask how two players should compare contradictory accounts",
            "Ask your partner for the exact line, not their conclusion. Then compare who recorded it, when, and what that person could actually know.",
        ),
        (
            "records",
            "Ask whether a log or signature alone proves guilt",
            "A log establishes an event in a system. A signature establishes a recorded responsibility. Neither replaces the rest of the chain.",
        ),
        (
            "fatigue",
            "Ask about her feelings, exhaustion or why she stays calm",
            "Calm is a working habit. It does not mean I am not worried. Guessing louder would not bring anyone back sooner.",
        ),
    ],
    "henry": [
        (
            "club",
            "Ask how a goose club works or how he paid",
            "Small payments over several weeks, and a bird at Christmas. A modest arrangement, but it puts a proper dinner within reach.",
        ),
        (
            "scuffle",
            "Ask about the street scuffle and losing the bird",
            "A street disturbance, a fright, and a dinner lost in the confusion. I cannot identify a jewel thief from that unhappy little adventure.",
        ),
        (
            "feelings",
            "Ask how he feels or why he is embarrassed",
            "A man prefers not to introduce himself with the story of how he lost his Christmas dinner. Yet here we are.",
        ),
        (
            "replacement",
            "Ask what kind of replacement bird he would accept",
            "A sound bird for the table would do. I have no sentimental attachment to a particular set of feathers.",
        ),
        (
            "jewel",
            "Ask whether he recognized a jewel or knew a secret was hidden",
            "I knew nothing unusual about the bird. If you have found something extraordinary, it is news to me, not a memory you can coax out.",
        ),
        (
            "help",
            "Ask what he can genuinely confirm",
            "Where I obtained the bird, and that I would accept a replacement. Please do not make my gratitude sound like expertise I do not possess.",
        ),
    ],
    "dealer": [
        (
            "trade",
            "Ask about his work and the goose trade",
            "I buy a batch, record its source and sell it on. A good account survives longer than a customer’s memory of an argument.",
        ),
        (
            "temper",
            "Ask why he is annoyed or rude",
            "Because I sell poultry, and everyone today seems determined to make me a philosopher of poultry. Ask a straight question and you will get a straight answer.",
        ),
        (
            "records",
            "Ask why he trusts accounts more than memories",
            "Names and deliveries go in the book. If a fellow returns tomorrow with a different story, the ink has not changed its mind overnight.",
        ),
        (
            "markings",
            "Ask about distinguishing one goose from another",
            "A marking can narrow a description. It does not make every bird with that marking the same bird. Follow the supplier if you need more than a guess.",
        ),
        (
            "jewel",
            "Ask whether he saw a jewel or can identify the thief",
            "I saw geese and customers. A thief’s name is not printed under a wing. Trace what passed through my business, then take your accusation elsewhere.",
        ),
        (
            "help",
            "Ask what question matters or how to follow the trail",
            "Who supplied the batch, who bought it, and who keeps coming back for one bird. Those are business questions. I can answer those.",
        ),
    ],
    "james": [
        (
            "pressure",
            "Ask why he is nervous, impatient or avoiding questions",
            "Would you enjoy strangers asking why you want something that was promised to you? I would like the matter settled quietly.",
        ),
        (
            "markings",
            "Ask him to describe the bird or its tail",
            "White, with a bar across the tail. That is the description I am looking for. Do not hand me any white goose and say the business is finished.",
        ),
        (
            "privacy",
            "Ask why he calls the search a private matter",
            "Because a person may wish to recover a promised possession without entertaining the whole market. You are making rather a spectacle of it.",
        ),
        (
            "work",
            "Ask about his hotel work without presenting the dossier",
            "An attendant attends to guests. It is not an invitation to discuss every guest’s belongings with strangers in a market.",
        ),
        (
            "accuse",
            "Accuse him of theft or demand confession without presenting evidence",
            "An accusation is easy to make. If you have something that actually connects me to your claim, present it. I will not answer a shouted guess.",
        ),
        (
            "delay",
            "Ask what he will do if the bird is gone",
            "Then I must keep tracing it. A replacement is not the point. I have already told you I am looking for a particular bird.",
        ),
    ],
    "inspector": [
        (
            "standard",
            "Ask what counts as proof instead of suspicion",
            "An account that can be checked against independent facts. Confidence, nervousness and a respectable occupation are not substitutes.",
        ),
        (
            "innocence",
            "Ask whether accusation or an arrest means Horner is guilty",
            "An arrest records a suspicion. It is not the conclusion of the inquiry. If the supporting account fails, that matters.",
        ),
        (
            "chain",
            "Ask how to connect the hotel, bird and recovered jewel",
            "Keep each handover distinct: who had the object, who supplied the bird, who received it. A missing link remains missing even in an elegant theory.",
        ),
        (
            "partner",
            "Ask how investigators should work together",
            "One of you follows the physical trail, the other checks the records. Share the source before asking your partner to accept your conclusion.",
        ),
        (
            "demeanor",
            "Ask whether nervous or calm behaviour proves anything",
            "A frightened innocent person may stumble; a practiced liar may sound composed. Write down the claim and test it.",
        ),
        (
            "revisit",
            "Ask whether he will reconsider the arrest",
            "Bring the chain of evidence. I am investigating what happened, not defending a theory because it was written down first.",
        ),
    ],
}


def expand_cast(cases):
    for case in cases.values():
        for character in case["characters"]:
            character["voice_profile"] = PROFILES[character["id"]]
            character["responses"].extend(
                {
                    "id": id,
                    "label": label,
                    "text": text,
                    "reveals": None,
                    "requires": [],
                }
                for id, label, text in EXCHANGES[character["id"]]
            )
