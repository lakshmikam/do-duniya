import fs from "node:fs/promises";
import assert from "node:assert/strict";
import postcss from "postcss";
const css = await fs.readFile("src/theme.css", "utf8"),
  root = postcss.parse(css);
const train = {},
  blue = {};
root.walkRules((r) => {
  if (r.selector.includes(":root") && !r.selector.includes(" "))
    r.walkDecls((d) => {
      if (d.prop.startsWith("--")) train[d.prop] = d.value;
    });
  if (
    r.selector === "[data-case='blue-carbuncle']" ||
    r.selector === '[data-case="blue-carbuncle"]'
  )
    r.walkDecls((d) => (blue[d.prop] = d.value));
});
const luminance = (hex) => {
  const a = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const pairs = [
  ...["--bg-0", "--bg-1", "--bg-2"].flatMap((bg) =>
    ["--ink", "--ink-dim", "--accent", "--clue"].map((fg) => [fg, bg]),
  ),
  ["--button-ink", "--accent"],
  ["--button-ink", "--clue"],
  ["--paper-ink", "--paper"],
  ["--paper-dim", "--paper"],
];
let count = 0;
for (const [name, palette] of [
  ["train", train],
  ["carbuncle", { ...train, ...blue }],
])
  for (const [fg, bg] of pairs) {
    const a = luminance(palette[fg]),
      b = luminance(palette[bg]),
      ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    console.log(`${name}: ${fg}/${bg} ${ratio.toFixed(2)}:1`);
    assert.ok(ratio >= 4.5, "AA body pair failed");
    count++;
  }
assert.ok(!/Baloo|IBM Plex|@import/.test(css));
assert.ok(!/font-size:\s*(?:[0-9]|1[01])px\b/.test(css));
assert.equal((css.match(/@font-face/g) || []).length, 2);
for (const file of [
  "src/style.css",
  "src/game/game.css",
  "src/game/investigation-scene.css",
  "src/game/mystery.css",
  "src/game/notebook.css",
  "src/game/partner-language.css",
])
  assert.equal(
    await fs
      .stat(file)
      .then(() => true)
      .catch(() => false),
    false,
  );
console.log(
  `${count} semantic text/background pairs pass AA. This is not a rendered contrast audit of gradients, SVG art or disabled controls.`,
);
