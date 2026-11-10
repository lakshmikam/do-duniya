# Do Duniya: independent critique for Claude

Please critique this working two-player mystery game candidly. Do not simply approve it or invent features you have not seen. Read the source/screens I provide, distinguish observations from assumptions, and propose fixes in priority order.

## Intended experience

Two partners investigate the same fair, authored mystery from different locations and roles. They interview characters, inspect evidence, compare accounts, and jointly submit a reconstruction. Train mystery first; a second scenario adapts the public-domain Blue Carbuncle with attribution. No model invents the solution or changes case truth. Story and timelines must remain consistent.

## What needs the toughest review

- Can two new players explain their roles and what they should discuss within a minute?
- Is the mystery genuinely inferable, with a satisfying payoff, rather than an evidence checklist?
- Do clue titles accidentally reveal their meaning? Identify exact examples.
- Does automatic notebook sharing leave enough reason to talk? It deliberately replaced confusing manual sharing. Suggest concrete communication dependencies without unnecessary steps or inaccessible audio-only puzzles.
- Are hot spots, characters, text, phone controls and notebook readable without overlap at 320/375/768/1024 widths?
- Does the aesthetic feel like a coherent mystery room rather than a generic dashboard? Judge motion by whether it communicates an action, not its quantity.
- Are three optional team hints enough? They should help without naming the culprit or exposing undiscovered evidence.

## Voice and language design

Prisma transcribes speech. Gemini handles constrained intent matching and translation. Timbre speaks characters and partner translations. A partner message keeps the original and displays the recipient-language translation, with optional spoken playback. Completed turns take time; this is not simultaneous interpreting. Raw hold-to-talk is separate and untranslated. Check names, numbers, negation, multilingual mistakes, fallback labels, latency and consent to microphone/playback. Players always retain text access.

## Earlier reviewer concerns to reconsider

Strong rainy scene art, but dark-on-dark titles, clipped toolbar buttons, crowded long hotspot labels, flat notebook cards, repeated guidance, overly revealing titles and front-facing scripted next steps. Other concerns: insufficient fair misdirection, weak finale, repetitive voice clicks, unclear join flow. Some comments may refer to an older revision: verify against the supplied current build.

## Source to inspect

src/main.tsx; src/game/InvestigationScene.tsx; src/game/sceneLayout.ts; src/game/CaseNotebook.tsx; src/game/notebook.css; src/game/mystery.css; src/game/VoiceChat.tsx; src/game/PartnerLink.tsx; backend/cases.py; backend/cast.py; backend/guidance.py; backend/case_coach.py; backend/partner_language.py.
Never request .env files, keys, private invite codes or real personal recordings.

Return: (1) five biggest concrete problems, (2) an example first five minutes for both players, (3) three feasible improvements ordered by benefit/effort, (4) honest unknowns that require playing with two humans. Do not promise contest prizes.
