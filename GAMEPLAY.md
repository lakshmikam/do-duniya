# Animated game presentation

The original casebook/dashboard presentation was replaced after user playtest
feedback. The mystery facts and cooperative server rules remain authored.

## What changed

- Native colourful SVG environments: train platform, London streets, record room,
  broadcast console and relay passage. Rain/snow, lamps and tape reels animate
  with CSS rather than a continuous React rerender loop.
- Expressive vector characters breathe, blink and animate during spoken replies.
- Leads and characters are placed inside the scene as labelled, keyboard-accessible
  interaction points. A supporting evidence board remains available.
- Three-beat case opening establishes the incident and each player's purpose.
- A single Start with sound action enables original synthesized ambience, a quiet
  musical pulse, clue/travel/reveal cues and automatic Timbre witness/clue reading.
- Voice volume is separate from the procedural soundtrack. The soundtrack ducks
  under character speech. Mute, pause and tab hiding stop playback/ambience.
- Reusable media element for mobile playback, a bounded in-browser clip cache,
  pending-request cancellation and original text subtitles. Browser autoplay or
  quota failures remain visible, with Replay voice available. No automatic retry.
- No downloaded commercial music, copied game characters or Subway Surfers assets.
  Its expressive, colourful energy was the user's reference, not a licence to copy.

## Connected investigation and sound revision

Each perspective now receives a state-derived next lead. Its action moves to a
location, opens an available witness, shares a discovered clue or opens the board.
When a partner's record is needed, the objective says which record connects the
two trails. Solo rehearsal offers Switch perspective at that point. The guide
does not send hidden clue text or propose the final solution.

Atmosphere now combines rain/wind, sustained minor drones, slow minor notes and
occasional thunder. Midrange tones are included for small speakers. The header
has an independent atmosphere slider. The full briefing no longer starts a long,
invisible voiceover that ducks this mix after the opening. Character/clue voices
still play automatically after Start with sound; background volume ducks only
while their audio plays.

Dialogue and evidence now display the same translation that Timbre receives,
with expandable English originals. Scene descriptions, available question labels
and next objectives translate automatically too; general interface chrome remains
mostly English. Native next-lead action labels cover Hindi, Telugu and Gujarati.
Translations remain unreviewed drafts. Wrong Indic scripts or changed numeric
times/quantities are rejected; failures retain the English original. The glossary
distinguishes courier pickup paperwork from museum collections.

Provider call ceilings were expanded for a multilingual playthrough while
remaining bounded: 120 requests per room and 240 per server UTC day by default.
Failed attempts count; cached translations/audio avoid repeated upstream calls.

## Remaining limits

This is a 2D point-and-click cooperative mystery, not a 3D runner or free-walking
world. Buttons remain for navigation, conversation choices, accessibility and
evidence review. Story-opening panels advance explicitly; there is no response
timer. The shared investigation clock continues while an opening is viewed.

Timbre calls may incur latency or exhaust the configured request allowance.
Automatic voice only begins after an explicit sound gesture. Some mobile browsers
can still require another playback gesture; Replay voice is the recovery path.
Text remains playable if voices are unavailable. Cancelling browser waiting does
not guarantee cancellation of already-billed upstream generation.

## Verification

- Production TypeScript/Vite build and 31 backend regressions.
- 14 static React renders of both worlds, location variants, character variants and
  opening panels; no model calls. These are component checks, not visual QA.
- Live browser walkthrough and sound-device checks are pending because computer
  browser access is currently disabled. Do not report the animation, sound mix,
  mobile autoplay or redesigned visual layout as user-tested until observed.

Implementation: src/game/World.tsx, Opening.tsx, sound.ts, game.css and integration
in src/main.tsx. No API secrets or gameplay solution moved to browser assets.
