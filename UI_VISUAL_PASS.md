# Visual review round — Blue Carbuncle v8

The live `/release.json` initially returned `mystery-room-v7`, matching commit61b221b. The older screenshot labels were not the current source.

## A — Shared visual system

Replaced six stylesheets with `src/theme.css`, removed unused selector groups and consolidated duplicate declarations. All UI paint is centralized in theme tokens; SVG art retains its own paint. Cases switch via `data-case`. Two self-hosted WOFF2 families (DM Sans and Libre Caslon Display), with font-display swap and bundled OFL licenses. Removed Baloo/IBM Plex/external font imports. Fixed wrapping on the actual `.game-toolbar` and its inner controls. Chrome is dark; paper is used for evidence/notebook pages. Display names capitalize the first letter without changing saved names.

Files: src/theme.css; public/fonts/\*; removed src/style.css and five src/game CSS files; imports in main.tsx, InvestigationScene.tsx, CaseNotebook.tsx and PartnerLink.tsx.

Contrast:32 semantic text/background combinations pass WCAG AA4.5:1. Lowest checked combination: Blue Carbuncle new-evidence rose against raised green4.95:1. No failed checked combinations. This is not a computed-render audit of every inherited rule, disabled opacity, SVG, overlay or gradient.

Screenshots: none. Local browser automation reports “Local browser use is disabled in Work settings.” Requested320/375/768/1024/1440 screenshots for both cases are outstanding. No visual approval claimed.

## B — Scene-first layout

The investigation fills100dvh. Locations become phone tabs; chapter and location details expand over the room. People/object lists overlay the room, rather than stacking below it. Scene geometry measures available height; compact approach paths preserve collision gaps. Partner Link stays above the nonmodal notebook drawer and remains in its keyboard navigation. Conversations are bottom sheets with persistent input, voice control and question chips; longer speech scrolls inside its own panel. Clue reader has one main Back to the scene button and a short notebook toast.

Added room invitation links (?room=CODE), copy-link control, health polling and a delayed wake-up screen. Existing reconnect state remains visible. Blue Carbuncle is the default selection for this visual review.

Files: src/main.tsx; src/game/sceneLayout.ts; InvestigationScene.tsx; CaseNotebook.tsx; serverReady.ts; src/theme.css.

Checks:125 compact scene geometries at five requested widths and200/240/300/420/600 allotted heights, including targets/endpoints/sampled movement.144 original layouts/7,224 routes still pass. Startup checks cover immediate readiness, transient failures, delayed loading and cancellation. These are not full-page viewport screenshots. Very short/zoomed screens and actual dialog fit need device review.

Screenshots: none; same browser-access limitation as A. Local user-facing preview opened on port5176; visual inspection is not claimed.

## E — Blue Carbuncle environments

Five original SVG compositions: Baker Street interior, Covent Garden stalls, Brixton goose yard, mahogany hotel record room and overhead supplier ledger. Gaslight pools/vignettes, bottle-green chrome, gold controls, jewel-blue details and a small jewel marker motif. Source attribution remains in briefing/ending and appears unobtrusively in the investigation.

Files: src/game/BlueWorld.tsx; World.tsx; InvestigationScene.tsx; main.tsx; theme.css. Distinct composition/accessible-label SSR checks pass.

Screenshots: none; same limitation as A.

## Review boundary

The attached brief explicitly says: “Start with the /release.json check, then Part A, and wait for my review before Part C.” This round implements the visual/layout work and Blue Carbuncle artwork. Parts C (story/gates/finale changes) and D (audio pre-generation/provider retries) have not been applied. Case text, solutions, provider logic, authentication and WebSocket/API shapes are unchanged. No new paid-provider calls were made for this round.

Remaining review: browser screenshots at all five widths for both cases; two-person playtest; long translated passages; mobile keyboard/autoplay. The work does not claim these passed.


## 10 November 2026 - wide room assets and transparent sprite interaction

Five user-supplied room images were outpainted with the built-in image editor to approximately 5:2. Originals are retained; generated PNGs and prompts are documented in public/art/README.md. Camera aspect follows actual PNG dimensions instead of a fixed 1200-by-720 image. Uniform contain scaling preserves the full composition without stretching. Clue pins were repositioned for the new art. No clue text or unlock rules changed.

Sprite buttons remain transparent and unfiltered during hover, press, selection, focus and disabled dialogue states. Selection and keyboard focus use the small circular badge. Market spawn selection chooses a clear point when a foreground witness occupies the former spawn.

Local Chrome checks: full platform and station-office compositions visible. Dev and Leela dialogue opens/closes. Leela stayed transparent while selected, hovered and focused: computed background rgba(0,0,0,0), opacity 1, filter none. Measured stage: 1146.34 by 498.72 CSS pixels; camera: 1146 by 458.28, entirely contained. Camera-fitting tests cover four viewport dimensions; these are geometry checks, not phone browser or language reviews. No speech-provider requests or deployment performed.


## Annotated review - sidebar tools, taller witnesses and compact height

Removed the player avatar from both stories and the obsolete walk-to-interact delay. Witness cutouts are 20 percent larger with the same floor anchor and preserved proportions. Notebook and case-building controls now live in a non-scrolling sidebar section; locations scroll separately, and the obsolete bottom toolbar is removed. Existing solve readiness gates remain intact. The short-height desktop layout reduces heading/navigation padding to preserve room height.

Regenerated the study desk with a level front edge and vertical legs, preserving the room, clue props and ultrawide framing. New asset and prompt are recorded in public/art/README.md. Notebook layout uses a wider index, fixed section tabs, and independent reading/list scrolling.

Verified in the in-app browser at exactly 1276 by 551 CSS pixels: no document overflow, no avatar, both sidebar tools within viewport (notebook bottom 426.67, case-building bottom 478.67). The notebook opens entirely within the viewport. This is a local preview, with no deployment or speech-provider calls.


## 11 November 2026 - commit and release checks

Approved UI changes are being published to main in separate artwork, renderer, sidebar/notebook, and release-record commits. Local verification: 66 backend tests pass; production build passes; presentation/asset/camera checks, scene geometry, startup, sound, voice capture and theme checks pass. This records local checks, not a claim that a remote CI run has completed. Render follows main automatically. Screenshots and local test outputs are excluded from Git.
