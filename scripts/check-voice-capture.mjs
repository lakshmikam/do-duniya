// Deterministic pause/encoding checks; not a substitute for real mic testing.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import assert from "node:assert/strict";
const folder = path.resolve(".local-tools/capture-check");
await fs.mkdir(folder, { recursive: true });
await fs.writeFile(
  path.join(folder, "capture.mjs"),
  ts.transpileModule(await fs.readFile("src/game/voiceCapture.ts", "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText,
);
const { SpeechSegmenter, speechWav } = await import(
  pathToFileURL(path.join(folder, "capture.mjs"))
);
const silence = new Float32Array(1600),
  speech = new Float32Array(1600).fill(0.1);
const d = new SpeechSegmenter(16000);
let result;
for (let i = 0; i < 30; i++) {
  result = d.feed(silence);
  assert.ok(!result.audio);
}
for (let i = 0; i < 5; i++) {
  result = d.feed(speech);
  assert.ok(!result.audio);
}
for (let i = 0; i < 10; i++) {
  result = d.feed(silence);
  assert.ok(!result.audio, "Short pauses must not submit a turn");
}
result = d.feed(silence);
assert.ok(result.audio, "A completed pause submits once");
assert.equal(d.hearing, false);
for (let i = 0; i < 20; i++)
  assert.ok(
    !d.feed(silence).audio,
    "Silence after a turn never duplicates the turn",
  );
d.reset();
d.feed(speech);
for (let i = 0; i < 12; i++)
  assert.ok(!d.feed(silence).audio, "Short clicks do not become questions");
d.reset();
for (let i = 0; i < 451; i++) result = d.feed(silence);
assert.ok(result.idle);
d.reset();
for (let i = 0; i < 180; i++) result = d.feed(speech);
assert.ok(result.audio, "Long speech is capped at 18 seconds");
const wav = await speechWav(
    new Float32Array(48000).fill(0.25),
    48000,
  ).arrayBuffer(),
  v = new DataView(wav);
assert.equal(new TextDecoder().decode(wav.slice(0, 4)), "RIFF");
assert.equal(v.getUint32(24, true), 16000);
assert.equal(v.getUint16(22, true), 1);
assert.equal(v.getUint32(40, true), 32000);
assert.equal(v.getInt16(44, true), 8191);
console.log(
  "Pause detection checks passed: silence, short pauses, short clicks, one submission, idle timeout, max duration and 16k mono WAV.",
);
