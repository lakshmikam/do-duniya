# Verification — November 9, 2026

## Passed

- TypeScript check and Vite production build.
- 24 backend tests: both case references and playable endings, ownership,
  two-player readiness, maximum two players, private-clue filtering, shared route
  gates, testimony restrictions, duplicate action handling, timer pause,
  unavailable-provider disclosure, malicious/free-form topic isolation, translation
  access checks, invalid audio rejection, joint ending approval, WebSocket snapshot
  filtering and shared provider allowance. Three additional HTTP-mocked tests
  exercised the real Gemini routing, Prisma transcription and Timbre WAV/cache
  adapters, including explicit provider errors. Three additional cases verify
  Gemini quota, access and unavailable-model responses without retries.
- Local browser: created a two-player railway room, joined with a second browser
  tab, readied both, started together, shared archive clues, unlocked the field
  location, confronted Dev, discovered/shared testimony, proposed a reconstruction
  and approved from the other tab. Both received the ending.
- Local browser: completed the Blue Carbuncle in explicitly labelled solo
  rehearsal, switching roles, unlocking the market through the Alpha account,
  confronting Ryder, corroborating the similar geese and submitting the supported
  reconstruction. Attribution and source link appeared in the ending.
- Browser timer pause/resume and key-absent provider controls inspected.
- Desktop landing, setup, investigation, evidence and witness dialog visual checks.

## Observed and corrected

- Generic testimony filtering initially blocked a discoverable Blue Carbuncle
  clue. Gates now distinguish conversation-revealed evidence by case data.
- The initiating player retained the theory dialog after a partner's approval.
  Completed-room state now closes investigation dialogs for that player too.
- An early railway note named the culprit too directly; it now supplies a lead
  without identifying the mover.
- Evidence support originally required one exact trio. Authored alternative
  supporting routes now accept another coherent combination.
- Location visuals now distinguish platform, office, console, archive and passage.

## Not verified / not included

- Live configuration was added later on November 9 (see live checks below).
  Human speech accuracy, Gujarati/Hindi/Hinglish spoken output, real-device
  microphone capture and representative end-to-end latency remain unverified.
- Non-English story rendering is requested passage translation, not a reviewed
  translated case package. The interface remains English; translations are marked
  experimental/unreviewed and retain original English.
- Built-in partner audio is not implemented. Players use an existing voice call.
- The initial viewport override did not resize the desktop. A later 390px iframe
  supplied a genuine narrow viewport for browser checks. Physical-phone hardware,
  mobile microphone permissions and performance remain unverified.
- No human mystery playtest, language review, screen-reader audit, noisy-speech
  evaluation, concurrency/load benchmark or accessibility certification completed.
- The stated case durations are design targets, not measured median play times.
- Single backend process and SQLite persistence. No multi-server scaling,
  public deployment, room abuse controls or physical retention cleanup yet.

## Test environment

Windows, Node 22.18, Python 3.11. Local socket permission was needed for backend
tests and preview servers. npm registry access also required an allowed execution.
Frontend preview: http://127.0.0.1:5175. Backend: http://127.0.0.1:8011.

## Live integration and phone-layout checks — later November 9

User privately added Gemini and one shared Gnani key and authorized testing.
Neither key was displayed or copied to frontend code. The same Gnani key worked
for both services.

- Timbre generated a short English character line; Prisma returned its transcript.
  Observed individual calls: 1.48–2.14 seconds for synthesis and 0.53–0.58 seconds
  for transcription of the generated clip.
- gemini-3.8-flash metadata was available, but two question calls timed out at the
  25-second client deadline, including after lowering reasoning effort.
- gemini-2.5-flash-lite generation returned unavailable-model errors despite
  metadata advertising support. No automatic fallback was used.
- Explicitly selected gemini-3.5-flash-lite after successful question checks.
  Observed isolated question calls: 1.45–1.91 seconds. Individual smoke timings
  are not latency benchmarks or guarantees.
- Short Hindi and Gujarati translations returned successfully. An initial Telugu
  translation succeeded; another failed transiently. A later Telugu speech flow
  translated a character line, synthesized it and transcribed the generated audio.
  That synthesis request included translation and took 4.48 seconds; transcription
  took 0.69 seconds. Synthetic speech only; no language-quality or accuracy claim.
- At the narrow viewport, observed 373px document content/client width and 389px
  window width, with no horizontal page overflow. Inspected setup, lobby,
  investigation, witness dialog and role switching. A free-form UI question was
  routed by Gemini to the expected authored answer. Timbre reached the playing
  state, and the Stop control stopped playback.
- Corrected the mobile heading, enlarged main touch controls, used 16px input
  text, preserved bottom safe-area spacing and restored solo role switching.
- Added cancellation/stale-view guards for translations, question replies and
  narration, and rejection of older-revision room snapshots.

Sanitized outputs: outputs/live-smoke.json and outputs/live-speech-te.json.
The smoke script uses live credits only when explicitly invoked.

## Render publication — November 9

Live at https://do-duniya-test.onrender.com. The user completed Blueprint setup.
External HTTP checks passed for /, /api/health and /api/cases (200, two cases).
Room creation without an invitation returned 403. No paid inference was used for
these hosted checks. Hosted two-player playthrough, actual phone microphone and
hosted model calls are not yet verified. Render free-host limitations still apply.

## Animated presentation revision — November 9

Replaced dashboard-style scenes with colourful vector environments, animated
characters, scene-placed clue interactions and a three-beat opening for each case.
Added original procedural ambience/music and interaction cues. Following explicit
Start with sound, character replies and clues request automatic Timbre playback;
Replay and mute remain. Cached clips, cancellation and background-tab handling
limit unnecessary work. Static artwork is memoized independently of the clock.
31 backend tests and 14 component rendering checks passed. TypeScript and the
production build passed. No paid calls were made during these revision checks.
Browser control remains disabled, so the new animation, visual layout, sound mix
and mobile autoplay have NOT received a live browser walkthrough. These require
user playtesting. See GAMEPLAY.md for implementation and known limitations.
