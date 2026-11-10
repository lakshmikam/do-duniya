# Shared test deployment

Prepared for a single Render web service using Docker. The container builds the
existing React client and serves it from the existing FastAPI game engine.
Same-origin HTTPS supports browser microphone access and WebSocket multiplayer.
No backend rewrite or fake hosted voice adapter is involved.

## Current state

Live test deployment: https://do-duniya-test.onrender.com
Private repository: https://github.com/lakshmikam/do-duniya
The user deployed the prepared Blueprint through Render on November 9.
Verified HTTPS page, health and two-case catalog all returned HTTP 200.
Unauthenticated room creation returned HTTP 403: invitation protection is active.
Hosted two-device multiplayer and live provider calls remain to be tested using
the user's test invitation. No invitation or credentials are recorded here.

## Hosting settings

- Free test instance, one worker, region Singapore.
- Dockerfile in the project root; Render assigns the listening PORT.
- Health endpoint: /api/health.
- Runtime-only secrets: GEMINI_API_KEY, GNANI_API_KEY and TEST_ACCESS_CODE.
- Reasoning model: gemini-3.5-flash-lite.
- Hosted call ceilings: 240 globally per UTC day, 120 per room. Automatic story
  translation and narration use these shared ceilings too. These are request
  counts, not provider credit or currency guarantees; no automatic retry occurs.
- Keys are never build arguments and are excluded from Git and Docker context.
- The test access code is required for room creation and joining. Existing room
  passes remain valid if the invitation rotates. Never use an API key as an invite.

Choose only free resources unless the user authorizes a paid plan. A free Render
instance can sleep after inactivity, take time to wake up and lose its SQLite
rooms and usage ledger on restart/redeploy. This is appropriate for a coordinated
test, not durable production. Keep the invitation private. Do not claim that a
local daily call counter is a monetary billing cap or survives an ephemeral host.

## Verification before sharing

1. Confirm the published HTTPS health endpoint and page both respond.
2. Check that anonymous room creation fails without the test access code.
3. Create and join a room from separate browser sessions with that code.
4. Ready both players; start; verify private clues and evidence sharing.
5. Verify WebSocket updates, timer pause/resume and reconnect.
6. Test one bounded synthetic model/voice interaction on the actual host.
7. Share the URL, invitation code and exact free-host limitations with both testers.

## Git history plan

User requested small, legible commits and pushes. They subsequently approved
creating the private GitHub repository first, then deploying and verifying.
The initially empty repository is now private at lakshmikam/do-duniya.
Seven component commits exist; the list below was the planning breakdown. Group the first history by purpose:

1. build: scaffold React and FastAPI development setup
2. content: add original railway case and credited Doyle adaptation
3. feat: add authoritative rooms and cooperative investigation engine
4. feat: add Gemini and Gnani voice integration
5. feat: add casebook and investigation interface
6. fix: improve phone controls and cancel stale media requests
7. test: cover story integrity, provider contracts and deployment boundaries
8. deploy: package invite-only HTTPS testing and CI
9. docs: add runbook, verification limits and contributor guidance

The existing files will be organized into truthful component commits. Do not
invent a historical day-by-day development timeline, fake test results for an
intermediate commit, backdate commits or publish secrets. Each push will contain
a coherent group. Existing mixed frontend/provider files may be split by module
before committing rather than pretending independent features already live in
separate files.

Render's standard source-deploy flow requires a Git repository before building.
The user approved this order explicitly. Do not claim that a public URL or remote
exists until it has actually been created and verified.

## Files excluded from publication

.env, runtime game databases, ownership passes, provider credentials, node_modules,
local outputs containing model responses and temporary archives. The checked-in
.env.example contains names and blank values only.

References:
- https://render.com/docs/deploy-fastapi
- https://render.com/docs/docker
- https://render.com/docs/free

## Public entry update

The invitation-password gate was removed at the user’s request. TEST_ACCESS_CODE is no longer used, even if a historical Render value remains. Create/join stays rate limited; private player bearer passes and provider call ceilings remain. There is no need to share API keys with players. Older invite-only descriptions above are historical.
