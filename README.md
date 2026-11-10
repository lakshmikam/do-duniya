# Do Duniya

A two-player mystery with complementary roles, voice conversations and an automatic
team notebook. One player investigates the scene; the other checks the records.
Both see the chapter question; optional notebook hints help when they are stuck.

Current playtest build: https://do-duniya-test.onrender.com (public room entry).

## Current game loop

- Tap a person or clue to investigate; movement and opening happen together.
- Discovered clues appear in both players’ notebooks automatically.
- Compare findings through typed or spoken translated messages, or optional raw radio.
- Agree on three answers; the notebook is included automatically.

The confusing manual-sharing step, extra power-switch puzzle, hiding/keepsakes,
separate activity sidebar and final evidence checklist have been removed. The
current controls are documented in [GAMEPLAY.md](GAMEPLAY.md).

## Development

Python 3.11; Node 22. Copy `.env.example` to `.env` privately. Do not commit keys.

```powershell
pip install -r requirements-dev.txt
npm ci
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8011
```

In another terminal, run `npm run dev`, then open http://127.0.0.1:5175.
Use two tabs/devices for two roles, or explicit solo rehearsal to switch roles.
Phones need an HTTPS deployment for microphone use. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Models and game rules

Gnani Prisma v3.0 transcribes speech with available scene vocabulary and prior
microphone context. Gnani Timbre v3.0 provides character voices and announcements.
Gemini routes questions to permitted authored answers and translates available
story text. It never chooses the culprit or invents the case truth.

The server controls clues, role access, unlocks and the final two-player decision.
Unfound evidence remains hidden. Discovered evidence is intentionally visible to
both authenticated players. Model calls are bounded and serialized for Gnani;
failed calls do not silently substitute fabricated model outputs. English authored
buttons complete both mysteries without API calls.

## Verification

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
python -m pytest tests -q
npm run build
node scripts/check-presentation.mjs
node scripts/check-voice-capture.mjs
node scripts/check-sound.mjs
```

Paid-provider scripts are opt-in. See [VERIFICATION.md](VERIFICATION.md) for actual
checks and device-testing limitations. Raw keys, microphone audio and local output
files are excluded from Git. Players create or join rooms without an invitation password; room passes and usage caps remain enforced.

## Credits and design research

The Last Announcement is original fiction. The Blue Carbuncle adapts Arthur Conan
Doyle’s 1892 story with fresh dialogue and a different conclusion, credited in the
game. Source: https://www.gutenberg.org/ebooks/1661. Artwork is original SVG; icons
use lucide-react (ISC); font credits remain in the source stylesheets.

Research included We Were Here, Keep Talking and Nobody Explodes, Operation: Tango
and Tick Tock. Those are design references, not sources of copied assets or scripts.
The current revision follows direct player feedback prioritizing clarity over the
previous feature-heavy prototype.

## Mystery-room revision

The shared notebook now has bound pages and stable page selection during live updates. Room markers are numbered, with descriptions outside the scene. Three optional hints are shared by the team and filed in the notebook; the assistant routes questions to authored guidance rather than inventing case facts.

Partners can send a typed or completed spoken message in different selected languages. Prisma transcribes, Gemini translates, and optional Timbre playback reads the recipient version. Originals remain visible. Failed translation delivers the original with a warning, and never speaks an untranslated message as the target language. Hold-to-talk radio is a separate untranslated option. One tab controls each player; a second tab requires an explicit takeover.

For an independent Claude critique, use CLAUDE_REVIEW_BRIEF.md with the current screenshots/source. No Claude review has been performed by this app.

## Blue Carbuncle visual review (v8)

One token theme, self-hosted fonts, viewport-first scene, notebook drawer and dialogue sheet replace the previous stacked UI. Blue Carbuncle has five distinct original SVG compositions. Room links prefill joining, and startup health polling shows a delayed wake-up screen. See UI_VISUAL_PASS.md for scope, checks and the explicit outstanding browser screenshots. The attached review gate keeps story/provider changes for a later round.

Local preview can use a separate backend by setting DO_DUNIYA_DEV_API before npm run dev. The default remains http://127.0.0.1:8011.

Public entry: create a room, copy its invitation link or six-character room code, and have the second player join with their own name. Both ready up, then begin. Old TEST_ACCESS_CODE values are ignored.
