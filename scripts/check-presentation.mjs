// Component rendering checks, independent of a browser or paid provider calls.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert/strict";

const root = process.cwd(),
  scratch = path.join(root, ".local-tools", "presentation-check");
await fs.mkdir(scratch, { recursive: true });
for (const name of [
  "World",
  "artwork",
  "CharacterPortrait",
  "Opening",
  "InvestigationScene",
  "sceneLayout",
]) {
  const source = await fs.readFile(
    path.join(
      root,
      "src/game",
      name + (["sceneLayout", "artwork"].includes(name) ? ".ts" : ".tsx"),
    ),
    "utf8",
  );
  const output = ts
    .transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace('"./World"', '"./World.js"')
    .replace('"./sceneLayout"', '"./sceneLayout.js"')
    .replace('"./artwork"', '"./artwork.js"')
    .replace('"./CharacterPortrait"', '"./CharacterPortrait.js"');
  await fs.writeFile(path.join(scratch, name + ".js"), output);
}
const { World, GameCharacter } = await import(
  pathToFileURL(path.join(scratch, "World.js"))
);
const { Opening } = await import(
  pathToFileURL(path.join(scratch, "Opening.js"))
);
const { InvestigationScene } = await import(
  pathToFileURL(path.join(scratch, "InvestigationScene.js"))
);
let checks = 0;
for (const blue of [false, true]) {
  const walk = renderToStaticMarkup(
    React.createElement(InvestigationScene, {
      location: blue ? "street" : "platform",
      blue,
      objects: [{ id: "sample", title: "A permitted clue", kind: "object" }],
      characters: [{ id: blue ? "henry" : "dev", name: "Witness" }],
      onInspect: () => {},
      onTalk: () => {},
    }),
  );
  assert.ok(
    walk.includes("Investigate this location") &&
      !walk.includes("Run") &&
      !walk.includes("Hide") &&
      walk.includes("A permitted clue"),
  );
  checks++;
  for (const location of ["platform", "console", "relay", "records"]) {
    const html = renderToStaticMarkup(
      React.createElement(World, { blue, location }),
    );
    assert.ok(
      html.includes('class="scene-artwork"') &&
        html.includes("/art/") &&
        html.includes('alt="'),
    );
    assert.ok(
      !html.includes("<svg"),
      "Room art must use the supplied illustrations",
    );
    checks++;
  }
  const opening = renderToStaticMarkup(
    React.createElement(Opening, {
      blue,
      title: "Case check",
      onBegin: () => {},
      onClose: () => {},
    }),
  );
  assert.ok(
    opening.includes('aria-modal="true"') &&
      opening.includes("Start with sound"),
  );
  assert.ok(
    !opening.includes("Dev used a borrowed key") &&
      !opening.includes("Ryder stole"),
  );
  checks++;
}
for (const id of [
  "dev",
  "leela",
  "mira",
  "arun",
  "henry",
  "dealer",
  "james",
  "inspector",
]) {
  const html = renderToStaticMarkup(
    React.createElement(GameCharacter, { id, talking: true }),
  );
  assert.ok(
    html.includes("talking") &&
      html.includes("character-portrait") &&
      html.includes("/art/"),
  );
  checks++;
}
const source = await fs.readFile(path.join(root, "src/main.tsx"), "utf8");
assert.ok(
  source.includes("<InvestigationScene") &&
    source.includes("setSoundOn(false)"),
);
assert.ok(
  source.includes("clipCache.current") &&
    source.includes("voiceRequest.current?.abort()"),
);
console.log(
  `${checks} presentation renders passed; scene, intro and character packages render without model calls.`,
);
const londonLocations = ["street", "market", "brixton", "hotel", "ledger"];
const londonMarkup = londonLocations.map((location) =>
  renderToStaticMarkup(React.createElement(World, { blue: true, location })),
);
assert.equal(
  new Set(londonMarkup.map((s) => s.match(/alt="([^"]+)"/)[1])).size,
  5,
);
assert.ok(
  londonMarkup.every((s) => s.includes("scene-artwork") && s.includes("/art/")),
);
console.log(
  "All London locations render supplied room art with distinct accessible descriptions; shared source art is documented.",
);

const { ROOM_ART, CHARACTER_ART, fitRoomCamera } = await import(
  pathToFileURL(path.join(scratch, "artwork.js"))
);
for (const art of [
  ...Object.values(ROOM_ART),
  ...Object.values(CHARACTER_ART),
]) {
  assert.ok(
    (await fs.stat(path.join(root, "public", art.src))).size > 10000,
    `Missing supplied art: ${art.src}`,
  );
}
console.log("All mapped room and character illustrations exist.");

for (const art of Object.values(ROOM_ART)) {
  const png = await fs.readFile(path.join(root, "public", art.src));
  assert.equal(
    png.readUInt32BE(16),
    art.width,
    "Camera width must match actual PNG",
  );
  assert.equal(
    png.readUInt32BE(20),
    art.height,
    "Camera height must match actual PNG",
  );
  for (const [width, height] of [
    [375, 260],
    [768, 400],
    [1146, 498],
    [1440, 620],
  ]) {
    const camera = fitRoomCamera(width, height, art.width, art.height);
    assert.ok(
      camera.width * camera.scale <= width + 0.001 &&
        camera.height * camera.scale <= height + 0.001,
      "Entire room must fit the viewport",
    );
    assert.ok(
      Math.abs(camera.width / camera.height - art.width / art.height) < 0.00001,
      "Camera cannot distort the room",
    );
  }
}
const trainScene = renderToStaticMarkup(
  React.createElement(InvestigationScene, {
    location: "platform",
    blue: false,
    objects: [],
    characters: [{ id: "dev", name: "Dev Rao" }],
    onInspect: () => {},
    onTalk: () => {},
  }),
);
assert.ok(
  !trainScene.includes("room-investigator"),
  "Railway case has no player avatar",
);
console.log(
  "PNG dimensions, uncropped camera fitting across four viewport sizes and railway-avatar removal passed.",
);

const blueScene = renderToStaticMarkup(
  React.createElement(InvestigationScene, {
    location: "street",
    blue: true,
    objects: [],
    characters: [{ id: "henry", name: "Henry Baker" }],
    onInspect: () => {},
    onTalk: () => {},
  }),
);
assert.ok(
  !blueScene.includes("room-investigator"),
  "Neither case renders the removed player avatar",
);
console.log(
  "Both cases show only the supplied witness characters, with no player avatar.",
);
