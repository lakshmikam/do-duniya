import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import assert from "node:assert/strict";
const dir = path.resolve(".local-tools/startup-check");
await fs.mkdir(dir, { recursive: true });
await fs.writeFile(
  path.join(dir, "ready.mjs"),
  ts.transpileModule(await fs.readFile("src/game/serverReady.ts", "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText,
);
const { waitForServer } = await import(
  pathToFileURL(path.join(dir, "ready.mjs"))
);
const native = globalThis.setTimeout;
globalThis.setTimeout = (f, n, ...args) => native(f, Math.min(n, 20), ...args);
try {
  let calls = 0,
    slow = 0;
  globalThis.fetch = async () => {
    calls++;
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await waitForServer(() => slow++, new AbortController().signal);
  assert.equal(calls, 1);
  assert.equal(slow, 0);
  calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls < 3) throw Error("sleeping");
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await waitForServer(() => slow++, new AbortController().signal);
  assert.equal(calls, 3);
  assert.equal(slow, 1);
  const stop = new AbortController();
  globalThis.fetch = async () => {
    throw Error("offline");
  };
  native(() => stop.abort(), 5);
  await waitForServer(() => {}, stop.signal);
  assert.ok(stop.signal.aborted);
  console.log(
    "Startup checks passed: immediate readiness, visible cold-start polling, transient errors and cancellation.",
  );
} finally {
  globalThis.setTimeout = native;
}
