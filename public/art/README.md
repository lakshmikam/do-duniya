# Do Duniya artwork

Room JPEGs and original character illustrations were supplied by the user on 10 November 2026. Room images are preserved unchanged. Eight `*-cutout.png` files were produced from the supplied character illustrations with the built-in image editing tool, requesting transparent backgrounds and preservation of identity, pose, clothing and held objects. They are used as full-body in-scene sprites, not portrait cards. Original JPEGs are retained.

Rooms: platform, station office, relay store, Baker Street and Covent Garden. Station-office/records/console share the supplied station room; hotel/ledger share the Baker Street illustration; Brixton uses the supplied market illustration. These images illustrate the locations; exact evidence remains server-authored.

The supplied seal, docket and key-register images are not used as evidence because embedded dates/names or extra entries contradict the case. Repeated station-room attachments are stored once. Arun appears with his found clue, not as an additional interactive NPC.

## Cutout prompt set

Train (Dev, Leela, Mira, Arun): background-extraction; remove only room/background/frame; preserve the original single full-length character, identity, clothing, pose, drawing style, complete shoes/hands and held objects; transparent alpha, narrow margin, no added scene or shadow.

London (Henry Baker, Breckinridge, James Ryder, Inspector Bradstreet): extract only the named person from their corresponding panel of the supplied four-person sheet; preserve the full body and held objects; remove other people, background, frame, lettering and floor; transparent alpha, no redesign or ground shadow.

The consuming paths are `/art/dev-cutout.png`, `/art/leela-cutout.png`, `/art/mira-cutout.png`, `/art/arun-cutout.png`, `/art/henry-cutout.png`, `/art/dealer-cutout.png`, `/art/james-cutout.png`, `/art/inspector-cutout.png`.

## Wide backgrounds (local preview, 10 November 2026)

Built-in image editing was used to outpaint five backgrounds to approximately 5:2. Each is saved alongside the original as `platform-wide-v2.png`, `station-office-wide-v2.png`, `relay-store-wide-v2.png`, `baker-street-wide-v2.png` and `covent-garden-wide-v2.png`. Actual dimensions are recorded in `src/game/artwork.ts`; the camera uses those dimensions with a uniform contain scale. Source images remain untouched. Generated surfaces and lettering are decorative, not additional evidence.

Prompt set (one edit per original): create a genuinely ultrawide 5:2 room, target 2400 by 960; naturally extend both sides while retaining the entire original room composition and principal props; preserve muted lighting, architecture, weather and period; no crop, zoom, stretching, extra foreground people, clue objects, captions or UI; seamless full frame with no blank bars. The model returned slightly different sizes, so the renderer uses the actual PNG dimensions rather than assuming the requested size.

Character interaction fix: sprite button backgrounds, filters and opacity remain neutral in hover, active, selected, focus and disabled states. Only the small interaction badge changes colour. This prevents generic button hover styling and legacy SVG filters from producing opaque rectangles behind PNG cutouts.


## Level desk (annotated review)

Built-in image edit saved as `baker-street-level-v3.png`: straighten only the foreground desk, with its front edge level and legs vertical; preserve coherent symmetric perspective, the full ultrawide study, muted lighting and existing clue props. No cropping, stretching, added people or UI. Used by the study-backed London locations; original and previous wide versions retained.
