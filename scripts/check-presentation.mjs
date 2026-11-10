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
  "BlueWorld",
  "Opening",
  "InvestigationScene",
  "sceneLayout",
]) {
  const source = await fs.readFile(
    path.join(
      root,
      "src/game",
      name + (name === "sceneLayout" ? ".ts" : ".tsx"),
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
    .replace('"./BlueWorld"', '"./BlueWorld.js"');
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
      html.includes("<svg") &&
        (blue
          ? html.includes("carbuncle-world")
          : html.includes("world-weather")),
    );
    assert.equal(
      (html.match(/id="/g) || []).length,
      new Set([...html.matchAll(/id="([^"]+)"/g)].map((x) => x[1])).size,
      "SVG paint identifiers must be unique",
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
for (const id of ["dev", "leela", "mira", "james"]) {
  const html = renderToStaticMarkup(
    React.createElement(GameCharacter, { id, talking: true }),
  );
  assert.ok(html.includes("talking") && html.includes("character-mouth"));
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
  new Set(londonMarkup.map((s) => s.match(/aria-label="([^"]+)"/)[1])).size,
  5,
);
assert.ok(
  londonMarkup.every(
    (s) => s.includes("carbuncle-world") && s.includes("<svg"),
  ),
);
console.log(
  "Five distinct Blue Carbuncle SVG sets render with unique accessible descriptions.",
);
