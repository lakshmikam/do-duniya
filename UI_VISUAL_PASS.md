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
