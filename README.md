# Do Duniya

Two investigators. Different information. One authored truth.

React/TypeScript/Vite client and FastAPI server. Two playable, fictional cases:

1. **The Last Announcement** — an original railway mystery.
2. **The Blue Carbuncle** — a cooperative adaptation of Arthur Conan Doyle's 1892
   story, with original dialogue and explicitly invented gameplay records.

## Start locally

Python 3.11+ and Node 22+ recommended. In this project directory:

```powershell
python -m pip install -r requirements-dev.txt
npm install
```

Run these in separate terminals:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8011
```

```powershell
npm run dev
```

Open http://127.0.0.1:5175. Create a room in one browser tab. Join using its code
in a second tab, or use a separate browser profile. Each tab has its own session
pass. The default server is localhost-only: another laptop cannot reach it until
an appropriate network hosting arrangement is configured. No public deployment
or built-in voice call is included. Use an existing call for partner conversation.

Solo rehearsal explicitly lets one person switch roles; it is not an AI partner.
Rooms persist in runtime/game.sqlite3. Passes persist in per-tab sessionStorage;
refresh reconnects the same pass. Leaving clears that device's pass. Rooms expire
after 24 hours; physical database deletion is not yet scheduled. Use one backend
worker: the current live-room registry and event delivery are process-local.

## Models and secrets

Copy .env.example to .env and add keys privately. Restart the backend afterward.
Never put keys in frontend code or commit .env.

- GEMINI_API_KEY, GEMINI_MODEL: free-form question routing and requested passage
  translation. Model is configurable; default gemini-3.5-flash-lite. Account/model
  availability must be checked with the user's credentials. No Evon adapter is
  used in this release.
- GNANI_API_KEY, or separate GNANI_PRISMA_KEY / GNANI_TIMBRE_KEY: Prisma v3.0
  transcription and Timbre v3.0 narration. Character voices use Avinash/Shivani.
- PROVIDER_DAILY_LIMIT / ROOM_PROVIDER_LIMIT: shared request ceilings reserved
  before calls, including failed attempts. These are call limits, not guaranteed
  monetary caps. No automatic retry. Translation plus narration can use two calls.

Without keys the mysteries remain playable through **authored English topics**.
They are visibly labelled authored, never represented as model inference. Voice
controls and free-form questions are disabled when their keys are absent.

Gemini 3.5 Flash-Lite and the shared Gnani key were live-smoke-tested November 9;
see VERIFICATION.md for scope and failures. `python scripts/live_smoke.py` makes
live requests and uses credits; ordinary tests do not. Closing a conversation
cancels pending playback and translation display. A dispatched provider request
may still charge even when the browser cancels waiting for it.

English is the authored original. Ten further language/mix options are exposed
as experimental, with automatic Gemini story translation and original text preserved.
The interface is English. No human multilingual review or performance benchmark
has been completed. No language quality guarantee is implied by provider support.

Open http://127.0.0.1:5175/device-preview.html for a narrow browser-frame preview.
This tests responsive layout, not physical-phone microphone behaviour. A separate
phone needs an appropriate hosted HTTPS endpoint for voice access; the current
localhost URL belongs to the laptop, not to the phone.

Microphone questions are limited to 20 seconds, converted locally to mono PCM WAV,
then explicitly transcribed on stop. The transcript remains editable before it
is sent as a witness question. Closing the witness discards active recording.

## Story and multiplayer integrity

- Full truth, clues and reveal conditions live on the server.
- Each player's snapshot contains only their accessible evidence and shared clues.
- Both players ready before starting; both approve a reconstruction before ending.
- Only discovered evidence can be shared; only shared evidence can support a theory.
- Required testimony must be earned through the permitted conversation.
- Gemini receives only currently permitted topic labels when interpreting a
  question, not the full solution. It chooses an allowed topic; authored text
  supplies the answer. Unknown questions do not create new facts.
- Final claims are selected explicitly. Prose reasoning is stored for the players,
  not falsely described as automatically graded.
- Timer uses server elapsed time, pauses for both players and continues in overtime.
- State-changing requests have bounded idempotency history; HTTP and WebSocket
  events carry revisions. Server state persists in SQLite.

## Shared HTTPS testing

The root Dockerfile builds React and runs `backend.production:app`, serving the
game and API together. `render.yaml` prepares a free, invite-only Render test
instance. This packaging has not yet been published. See DEPLOYMENT.md for
account requirements, verification steps and ephemeral-storage limitations.

Production secrets belong in the hosting dashboard, not Git. Configure
TEST_ACCESS_CODE to require an invitation when creating or joining a room.
The existing local development URL remains unchanged.

## Add a case

Add a package to backend/cases.py and register it in CASES. It supplies its own
roles, locations, evidence, witnesses, permitted topics, gates, conclusion choices,
solution, timeline, hints and attribution. The engine does not need a railway
scenario. validate_cases checks references; each package also needs a playthrough
test and human story review. Larger deployments should replace process-local
rooms with shared state and event delivery, add room-creation abuse limits, and
implement proper retention before public exposure.

## Checks

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'
python -m pytest tests -q
npm run build
```

Tests use synthetic game interactions and mock interpretation, not paid models.
See VERIFICATION.md for actual checks and outstanding limitations.

## Credits

The Blue Carbuncle source: https://www.gutenberg.org/ebooks/1661
Project Gutenberg identifies that edition as public domain in the USA. The 1892
story is by Arthur Conan Doyle (1859–1930). This game uses fresh dialogue and
illustrations, not modern adaptations, audiobook recordings or translations.
Our cooperative records and conclusion differ from the original and are credited
in-game. No endorsement or affiliation is claimed.

Illustrations are project-native SVG. Icons: lucide-react (ISC). Fonts: Google
Fonts DM Sans, IBM Plex Mono and Libre Caslon Display, with local system fallbacks.

## Animated mystery presentation

See GAMEPLAY.md for the scene-based redesign. Cases now open with a story sequence;
choose Start with sound to enable automatic character voices, ambient audio and
sound effects, or Play quietly for subtitles. Click characters and labelled clue
markers inside the scene. Mute is in the header; Replay voice is optional recovery,
not the normal next step. Browser/device playback policies can still require a
second gesture. Existing provider caps apply to automatic narration too.

`node scripts/check-presentation.mjs` checks the static component rendering without
opening a browser or using model credits. It does not replace a visual playtest.
