// Audio graph/lifecycle checks. No browser or audio-device audibility claim.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";
const folder = path.resolve(".local-tools/sound-check");
await fs.mkdir(folder, { recursive: true });
await fs.writeFile(
  path.join(folder, "sound.mjs"),
  ts.transpileModule(await fs.readFile("src/game/sound.ts", "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText,
);
const { GameSound } = await import(
  pathToFileURL(path.join(folder, "sound.mjs"))
);
const nodes = [];
const loops = new Set();
function parameter() {
  return {
    value: 0,
    setTargetAtTime(v) {
      this.value = v;
    },
    setValueAtTime(v) {
      this.value = v;
    },
    linearRampToValueAtTime(v) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v) {
      this.value = v;
    },
  };
}
function node() {
  const n = {
    gain: parameter(),
    frequency: parameter(),
    started: false,
    stopped: false,
    connect() {
      return this;
    },
    start() {
      this.started = true;
    },
    stop() {
      this.stopped = true;
    },
  };
  nodes.push(n);
  return n;
}
globalThis.AudioContext = class {
  state = "suspended";
  currentTime = 0;
  sampleRate = 8000;
  destination = {};
  createGain = node;
  createOscillator = node;
  createBufferSource = node;
  createBiquadFilter = node;
  createBuffer(_channels, size) {
    return {
      getChannelData() {
        return new Float32Array(size);
      },
    };
  }
  async resume() {
    this.state = "running";
  }
  async close() {
    this.state = "closed";
  }
};
globalThis.setInterval = (fn) => {
  loops.add(fn);
  return fn;
};
globalThis.clearInterval = (fn) => loops.delete(fn);
const sound = new GameSound();
assert.equal(sound.getState(), "not-started");
await sound.unlock();
assert.equal(sound.getState(), "running");
const master = nodes[0];
sound.startAtmosphere(false);
assert.equal(loops.size, 1);
assert.equal(nodes.filter((n) => n.started && !n.stopped).length, 4);
const first = nodes.filter((n) => n.started && !n.stopped);
sound.startAtmosphere(true);
assert.ok(
  first.every((n) => n.stopped),
  "Scene changes stop the previous rain and drones",
);
assert.equal(loops.size, 1, "Scene changes never layer multiple pulse loops");
const normal = master.gain.value;
sound.duck(true);
assert.ok(master.gain.value < normal);
sound.duck(false);
assert.equal(master.gain.value, normal);
sound.setVolume(0);
assert.equal(master.gain.value, 0);
sound.setVolume(100);
assert.equal(master.gain.value, 0.8, "Volume clamps at 100%");
sound.setMuted(true);
assert.equal(master.gain.value, 0);
sound.stopAtmosphere();
assert.equal(loops.size, 0);
assert.ok(nodes.filter((n) => n.started).every((n) => n.stopped));
sound.dispose();
assert.equal(sound.getState(), "closed");
console.log(
  "Sound graph checks passed: one ambient loop, scene cleanup, mute, duck, volume and disposal.",
);
