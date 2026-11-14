# Story and cooperation revision

Implemented on `codex/story-cooperation-rework`, branched from local `main` on 11 November 2026. Reference: the user-supplied 21-page `doduniya.pdf`. Existing evidence IDs, role keys (`field` and `archive`), case answers and both accepted supporting sets per case remain in use.

## What changed in play

Witnesses now make concrete, sometimes false claims. Meeting one adds their account to the shared notebook's Statements section. During the conversation, open **Test this account with evidence**, choose an exact statement and a discovered passage, and present it. Correct contradictions change the account only when the server's conditions are met. Supporting evidence can confirm an honest statement. Unrelated evidence does not advance the story.

Statements are claims, not discoveries of objective truth. Their status and cited evidence are shared. Private freeform conversation history stays private. Testimony earned through a challenge is filed automatically and does not add another object marker to the scene.

## The Last Announcement

The opening question is why Arun's own voice appeared to issue an order two minutes before he wrote that he was following a thief. The announcement log establishes a recording from 2019. The theft appropriated a familiar, trusted voice.

Dev claims an authorized urgent collection and says he stayed away from the console. The records player finds the pickup approval and key register; the field player tests his two claims. The first contradiction shakes his story; the second earns the admission. The cut seal offers another, optional contradiction.

Leela claims she stayed beside the coach. Her canteen receipt breaks that claim, but she fears the timing implicates her. Once the records player finds the slow-clock note, she admits Dev paid her to take tea. That testimony travels back to the records player: Mira cannot fully explain the key loan until the paid absence exposes the pattern of favors. Challenge her live-warning claim with the log and her denial of lending the key with the register. She admits a loan for a supposed system test, not participation in the theft.

The service route still opens the relay passage automatically. Open the store door to find Arun, then speak to him directly. No new power-switch step or loading-bay scene is added. The final reconstruction retains Dev, the locally played drill and Arun's confinement as its answers. A joint optional epilogue asks whether to recommend a formal inquiry or leniency while recording all the facts either way.

## The Blue Carbuncle

The stakes are a wrongly accused man facing prison. Henry Baker's acceptance of a replacement bird still provides the opening interview. The records player traces the Alpha Inn supply and checks the hotel accusation; the field player follows the unlocked market route.

Breckinridge initially claims his birds came from Essex. His own supplier account contradicts him. Presenting it earns the returning-visitor testimony and opens the next comparison. The supplier lead opens Brixton, where Mrs Oakshott is now a witness. Ask about her two barred-tailed birds to earn that testimony; the birds are not a clickable document masquerading as a person.

Ryder denies asking about geese and claims only Horner had room access. The visitor testimony and hotel position defeat those two claims. The recovered stone and supplier record are also required before he can confess. The records player's conversation matters too: Bradstreet's confidence in the arrest is first challenged with the accusation and Cusack statement. His account changes again when the field partner establishes the visitor and the two birds alongside the hotel connection.

The final answers and support sets are preserved, including deduction without a confession. The epilogue asks the team to agree on an open hearing or a signed private statement. Both versions clear Horner and preserve accountability; a private statement does not erase the theft.

## Presentation and scope choices

- Two additions to the cast: Arun after rescue and Mrs Oakshott at Brixton. Arun uses existing artwork; Oakshott has a simple original vector portrait. No additional location or dense prop layer was needed.
- Evidence challenges stay inside the conversation; statement cards stay inside the notebook. Portraits retain their existing art, with textual demeanor changes rather than unproduced emotional-image variants.
- Timed dispatches add atmosphere at authored points. They do not auto-fail, unlock a location or reveal the culprit. Pause stops the story clock. A 15-second pulse keeps connected players current even while idle.
- Seven different wrong comparisons can make a witness go quiet for 45 seconds. Replaying an identical wrong pair does not compound pressure. Other witnesses and records remain available; there is no permanent fail or lost evidence.
- Authored presentation topics remain an alternative to the comparison picker and use the same challenge evaluation. Original successful support sets remain valid; side testimony is optional rather than an added completion checklist.

## Model boundary

The reference proposes generated character prose. This implementation keeps the existing stricter contract: Gemini routes a freeform question to an available authored response; it never supplies accepted story facts or stage changes. An invented `speech`, `stage`, `grants` or claim list in its response is ignored. Only server-authored replies are displayed. This preserves character voices without relying on keyword filters to prevent invented clues.

The new `/talk` path falls back explicitly to an authored current-stage line when the model is off, unavailable, timed out or returns no usable selection. `/ask` remains available for compatibility and its original provider-error contract. `GEMINI_CHARACTERS=off` disables model routing on `/talk`; `GEMINI_TIMEOUT_SECONDS` defaults to 8 and is bounded to 1–15 seconds. Provider credentials stay server-side. No provider calls were used for this implementation's tests.

## Implementation map

`backend/story_content.py` extends the authored cases. `backend/story.py` owns challenge evaluation, monotonic witness stages, pressure recovery, statement records, dispatches and epilogue agreement. `backend/main.py` integrates the same rules with inspection, conversation, snapshots and speech access. `backend/guidance.py` and `case_coach.py` supply comparison hints without naming an undiscovered culprit.

`src/game/WitnessChallenge.tsx` contains comparison controls and notebook statement pages. `CaseNotebook.tsx`, `CharacterPortrait.tsx`, `VoiceChat.tsx` and `main.tsx` integrate them. Old room data receives defaults when accessed; the SQLite schema does not change. Tests in `tests/test_story.py` exercise two authenticated roles and the final agreement flow for both cases.
