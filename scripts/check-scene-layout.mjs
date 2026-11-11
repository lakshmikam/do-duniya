// Geometry/path checks, independent of browser rendering and model calls.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";
const scratch = path.resolve(".local-tools/scene-layout-check");
await fs.mkdir(scratch, { recursive: true });
await fs.writeFile(
  path.join(scratch, "layout.mjs"),
  ts.transpileModule(await fs.readFile("src/game/sceneLayout.ts", "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText,
);
const { sceneLayout, scenePath, playerRect, overlaps } = await import(
  pathToFileURL(path.join(scratch, "layout.mjs"))
);
let scenes = 0,
  routes = 0;
for (const width of [320, 375, 768, 1024])
  for (let objects = 0; objects <= 8; objects++)
    for (let actors = 0; actors <= 3; actors++) {
      const l = sceneLayout(width, objects, actors),
        slots = [...l.objects, ...l.actors],
        rects = slots.map((s) => s.bounds);
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        assert.ok(
          r.left >= 0 &&
            r.top >= 0 &&
            r.left + r.width <= width &&
            r.top + r.height <= l.height,
        );
        for (let j = i + 1; j < rects.length; j++)
          assert.ok(
            !overlaps(r, rects[j], 8),
            `Targets overlap at ${width}px: ${i}/${j}`,
          );
      }
      const points = [l.spawn, ...slots.map((s) => s.approach)];
      for (const p of points) {
        const r = playerRect(p, l.playerWidth, l.playerHeight);
        assert.ok(
          rects.every((b) => !overlaps(r, b, 8)),
          `Player endpoint overlaps target at ${width}px`,
        );
        assert.ok(
          r.left >= 0 &&
            r.top >= 0 &&
            r.left + r.width <= width &&
            p.y <= l.height,
        );
      }
      for (const from of points)
        for (const to of points) {
          let prev = from;
          for (const next of scenePath(from, to, l)) {
            for (let s = 0; s <= 30; s++) {
              const t = s / 30,
                p = {
                  x: prev.x + (next.x - prev.x) * t,
                  y: prev.y + (next.y - prev.y) * t,
                },
                r = playerRect(p, l.playerWidth, l.playerHeight);
              assert.ok(
                rects.every((b) => !overlaps(r, b, 7.9)),
                `Player route crosses target at ${width}px (${objects} objects,${actors} actors)`,
              );
            }
            prev = next;
          }
          routes++;
        }
      scenes++;
    }
console.log(
  `${scenes} scene layouts and ${routes} routes passed at 320/375/768/1024px: no marker, actor, player endpoint or sampled path overlaps.`,
);
// Compact layouts use the counts actually present in authored rooms.
let compact = 0;
for (const width of [320, 375, 768, 1024, 1440])
  for (const height of [200, 240, 300, 420, 600])
    for (const [objects, actors] of [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 0],
      [3, 2],
    ]) {
      const l = sceneLayout(width, objects, actors, height),
        slots = [...l.objects, ...l.actors],
        rects = slots.map((x) => x.bounds);
      assert.ok(
        l.height <= height,
        `Scene exceeds allotted height ${width}x${height}`,
      );
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        assert.ok(
          r.left >= 0 &&
            r.top >= 0 &&
            r.left + r.width <= width &&
            r.top + r.height <= height,
        );
        for (let j = i + 1; j < rects.length; j++)
          assert.ok(
            !overlaps(r, rects[j], 8),
            `Compact target overlap ${width}x${height}`,
          );
      }
      const points = [l.spawn, ...slots.map((x) => x.approach)];
      for (const from of points)
        for (const to of points) {
          let prev = from;
          for (const next of scenePath(from, to, l)) {
            for (let i = 0; i <= 20; i++) {
              const t = i / 20,
                p = {
                  x: prev.x + (next.x - prev.x) * t,
                  y: prev.y + (next.y - prev.y) * t,
                },
                r = playerRect(p, l.playerWidth, l.playerHeight);
              assert.ok(
                rects.every((b) => !overlaps(r, b, 7.9)),
                `Compact movement overlap ${width}x${height}`,
              );
            }
            prev = next;
          }
        }
      compact++;
    }
console.log(
  `${compact} compact layouts fit 200–600px allotted heights at all five requested widths, with collision checks. Not a browser viewport test.`,
);

// New artwork placements: include routes between every available target.
await fs.writeFile(
  path.join(scratch, "artwork.mjs"),
  ts.transpileModule(await fs.readFile("src/game/artwork.ts", "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText,
);
const { ACTOR_FEET, CLUE_PINS } = await import(
  pathToFileURL(path.join(scratch, "artwork.mjs"))
);
let illustratedRoutes = 0;
for (const [location, ids, actors] of [
  ["platform", ["seal", "tracks"], 2],
  ["office", ["note", "receipt"], 0],
  ["relay", ["found", "admission"], 0],
  ["console", ["broadcast", "access"], 1],
  ["records", ["docket", "route", "clock"], 0],
  ["street", ["stone", "alpha"], 1],
  ["market", ["supplier"], 1],
  ["brixton", ["twins"], 1],
  ["hotel", ["arrest", "visitor"], 1],
  ["ledger", ["ryder", "cusack"], 0],
]) {
  const l = sceneLayout(
      1200,
      ids.length,
      actors,
      720,
      ACTOR_FEET[location],
      ids.map((id) => ({
        x: CLUE_PINS[id][0] * 12,
        y: CLUE_PINS[id][1] * 7.2,
      })),
    ),
    targets = [...l.objects, ...l.actors],
    points = [l.spawn, ...targets.map((s) => s.approach)];
  for (const from of points)
    for (const to of points) {
      const route = scenePath(from, to, l);
      assert.ok(
        (from.x === to.x && from.y === to.y) || route.length > 0,
        `No illustrated route in ${location}`,
      );
      let previous = from;
      for (const next of route) {
        for (let i = 0; i <= 30; i++) {
          const t = i / 30,
            r = playerRect(
              {
                x: previous.x + (next.x - previous.x) * t,
                y: previous.y + (next.y - previous.y) * t,
              },
              l.playerWidth,
              l.playerHeight,
            );
          assert.ok(
            targets.every((s) => !overlaps(r, s.bounds, 7.9)),
            `Artwork route overlap in ${location}`,
          );
        }
        previous = next;
      }
      assert.deepEqual(
        previous,
        to,
        `Artwork route must reach the target in ${location}`,
      );
      illustratedRoutes++;
    }
}
console.log(
  `${illustratedRoutes} artwork routes reach their targets without crossing a character or clue.`,
);
