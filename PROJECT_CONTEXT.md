# Do Duniya — project context

Reviewed 11 November 2026. This is a source-based handoff for future development. It describes the current implementation; historical review notes can describe earlier versions.

## Product and gameplay

Do Duniya is a browser-based cooperative mystery for two players with complementary field and records roles. It contains two authored cases: **The Last Announcement**, an original railway mystery, and **The Blue Carbuncle**, an adaptation of Arthur Conan Doyle's story with a changed conclusion. Explicit solo rehearsal allows role switching.

Players create or join a room using an invitation link or six-character code, choose names and languages, ready up, and investigate. Numbered clues and witness characters open interactions directly. Discovered evidence automatically enters both players' notebooks. Players compare findings, select three reconstruction answers, and confirm the proposal together. The backend evaluates answers and supporting evidence against authored case data.

Optional features include a timer, shared notes, three team hints, character voice conversations, translated partner messages, generated speech playback, and separate untranslated push-to-talk radio. Authored English choices allow both cases to be completed without model calls.

## Architecture and source map

| Area | Main files | Responsibility |
| --- | --- | --- |
| Frontend shell | `src/main.tsx` | Startup, room entry, session recovery, API calls, live connection, game state and major UI flows |
| Presentation | `src/theme.css` | Case themes, responsive layout, scene and notebook styling |
| Investigation | `src/game/InvestigationScene.tsx`, `World.tsx`, `CharacterPortrait.tsx` | Room art, clue markers and witness interactions |
| Artwork geometry | `src/game/artwork.ts`, `sceneLayout.ts`, `public/art/` | Asset mapping, camera fitting, clue positions and layout calculations |
| Notebook | `src/game/CaseNotebook.tsx` | Shared evidence and notebook interface |
| Communication | `src/game/PartnerLink.tsx`, `PartnerRadio.tsx`, `VoiceChat.tsx` | Partner messages, raw radio and character speech UI |
| Audio/startup | `src/game/voiceCapture.ts`, `sound.ts`, `serverReady.ts` | Speech segmentation/WAV conversion, browser sound and server wake-up polling |
| Core server | `backend/main.py` | Authentication, rooms, persistence, role-filtered views, actions, WebSockets and provider adapters |
| Case content | `backend/cases.py`, `cast.py` | Authored locations, evidence, dialogue, cast, gates, solutions and case validation |
| Guidance | `backend/guidance.py`, `case_coach.py` | Next objectives and bounded authored hints |
| Partner language | `backend/partner_language.py` | Source-preserving translation and message speech routes |
| Production | `backend/production.py`, `Dockerfile`, `render.yaml` | Same-origin static/API serving, hosting middleware and deployment |
| Verification | `tests/`, `scripts/`, `.github/workflows/` | Backend tests, frontend checks and CI |

Stack: React 19, TypeScript, Vite 7 and lucide-react; Python 3.11 is the documented backend target with FastAPI, Uvicorn, httpx and SQLite. There is no separate frontend application framework or external database service configured.

HTTP `/api` endpoints handle room creation/joining, snapshots, actions, conversations, translation and speech. `/api/rooms/{code}/live` carries live updates and radio traffic. The browser retains its room session in `sessionStorage`; room membership uses per-player tokens. Duplicate controlling tabs require explicit takeover.

## State, persistence and rules to preserve

- The server owns discoveries, role access, unlocks, proposal approval and final evaluation. Scene graphics cannot grant evidence.
- `view()` builds a role-specific snapshot. Undiscovered evidence, locked testimony and the unrevealed solution must remain private. Discovered evidence is deliberately shared; private conversation history remains private.
- SQLite stores serialized rooms and daily provider usage. `DO_DUNIYA_DB` overrides the default `runtime/game.sqlite3`. The server restores rooms younger than 24 hours and rejects expired membership.
- Live rooms, sockets, caches and radio state live in process memory. Production deliberately uses **one worker**. Multiple workers or replicas require a state/broadcast redesign.
- Room creation and joining are public; the old invitation-password requirement is removed. Token authentication, request bounds, entry throttling and provider caps still apply.
- Preserve automatic notebook sharing and direct clue interaction. Historical manual sharing, electrical switches, hiding/keepsakes and a final evidence-selection checklist are no longer the intended player flow, even where compatibility code remains.

## Models and languages

Configured integrations are Gemini for selecting permitted authored answers, translating accessible text and routing hint intent; Gnani Prisma v3.0 for transcription; and Gnani Timbre v3.0 for generated speech. These are repository integration claims, not independently verified provider availability.

Models must not choose the culprit, invent clues or determine case truth. Provider failures remain visible. Failed partner translation delivers the original with a warning; it must not speak that original as though it were the target-language translation. Raw radio remains untranslated.

Keys stay on the server in private environment configuration. `.env.example` documents `GEMINI_API_KEY`, `GEMINI_MODEL`, `GNANI_API_KEY`, optional separate Prisma/Timbre keys and usage limits. Default limits are 240 calls per UTC day and 120 per room; Gnani calls are serialized. Do not commit credentials, microphone recordings or runtime databases.

Language options in the server are English, Telugu, Hindi, Gujarati, Hinglish, Tamil, Kannada, Malayalam, Marathi, Punjabi and Bengali. The main interface is mostly English; translation quality still needs human review.

## Local development

Use Python 3.11 and Node 22. Install dependencies and privately copy `.env.example` to `.env` if provider features are needed:

```powershell
pip install -r requirements-dev.txt
npm ci
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8011
```

In another terminal, run `npm run dev` and open `http://127.0.0.1:5175`. Vite proxies `/api`, including WebSockets, to port 8011. Set `DO_DUNIYA_DEV_API` before starting Vite to use another backend. Two tabs/devices can take the two roles; solo rehearsal is explicit. Mobile microphone access needs HTTPS.

Production builds the frontend in a Node Docker stage and serves `dist/` through `backend.production:app` in a Python stage. The checked-in Render configuration targets a free Docker web service in Singapore, with `/api/health` as its health check. Durable storage is not configured there; do not assume the local SQLite file survives a host replacement. The README lists a public playtest URL, but its live state was not checked in this review.

## Review findings and practical limits

1. **Documentation has historical drift.** README and older visual notes describe original SVG scenes and avatar movement. The active `World.tsx` uses supplied raster artwork, and current presentation checks enforce no player avatar. `artwork.ts` intentionally reuses some scenes for different locations. Prefer current source and the latest dated visual notes when changing the UI.
2. **Deployment is intentionally single-process.** SQLite persistence does not make WebSocket, radio or cache state shared between workers. Confirm persistence requirements before treating this as a durable production service.
3. **Large orchestration modules increase coupling.** `src/main.tsx` and `backend/main.py` combine several concerns. Future feature work should keep state ownership explicit and can extract focused modules incrementally without changing API contracts.
4. **Automated visual checks have bounded coverage.** Server rendering, geometry and token-contrast checks do not establish real browser layout, microphone permissions, autoplay, mobile keyboard behavior or two-person usability. Older documents record outstanding checks and some later local viewport verification; this review did not perform a browser or phone playtest.
5. **Runtime parity needs attention.** The available local Python resolves to 3.14, while Docker and CI target 3.11. Backend test results from this environment should be identified accordingly.

## Verification for this review

- `npm run build`: passed (TypeScript checking and Vite production bundle).
- Presentation, sound, voice capture, scene layout, theme and startup scripts: all passed. These checks made no paid-provider calls.
- Initial `python -m pytest tests -q`: failed during collection because the generated temporary SQLite database could not be opened. A rerun using workspace-local `TEMP`/`TMP` produced no result after several minutes and was interrupted. Backend tests are **unverified in this review**; the prior documented 66-test pass was not reproduced.
- Live provider, remote deployment, browser and physical-device behavior were not verified.

For the standard full check, use `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` with `python -m pytest tests -q`, then the build and six `node scripts/check-*.mjs` checks named above. Tests clear real provider credentials and isolate their database in `tests/conftest.py`. Paid smoke scripts are separate and opt-in.

## Further context

Read `GAMEPLAY.md` for intended controls, `DEPLOYMENT.md` for hosting, `VERIFICATION.md` for prior checks and limitations, `UI_VISUAL_PASS.md` for dated visual changes, and `public/art/README.md` for asset history. `CLAUDE_REVIEW_BRIEF.md` is a review brief, not proof an independent critique occurred. Those files provide history; validate their claims against current source before relying on them.
