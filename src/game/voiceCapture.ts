/** Local pause detection. Silence is never uploaded; only completed speech turns. */
export class SpeechSegmenter {
  private chunks: Float32Array[] = [];
  private preRoll: Float32Array[] = [];
  private voiced = 0;
  private quiet = 0;
  private elapsed = 0;
  private idle = 0;
  private noise = 0.003;
  hearing = false;
  constructor(
    readonly sampleRate: number,
    readonly pauseMs = 1100,
  ) {}
  reset() {
    this.chunks = [];
    this.preRoll = [];
    this.voiced = 0;
    this.quiet = 0;
    this.elapsed = 0;
    this.idle = 0;
    this.hearing = false;
  }
  feed(samples: Float32Array): {
    level: number;
    audio?: Float32Array;
    idle?: boolean;
  } {
    const ms = (samples.length / this.sampleRate) * 1000;
    const level = Math.sqrt(
      samples.reduce((sum, n) => sum + n * n, 0) / samples.length,
    );
    const speech = level > Math.max(0.012, this.noise * 3);
    if (!speech && !this.hearing)
      this.noise = Math.min(0.012, this.noise * 0.97 + level * 0.03);
    if (!this.hearing) {
      this.idle += ms;
      this.preRoll.push(samples.slice());
      while (
        this.preRoll.length >
        Math.ceil((this.sampleRate * 0.25) / samples.length)
      )
        this.preRoll.shift();
      if (!speech) return { level, idle: this.idle >= 45000 };
      this.hearing = true;
      this.chunks = this.preRoll;
      this.preRoll = [];
    } else this.chunks.push(samples.slice());
    this.elapsed += ms;
    if (speech) {
      this.voiced += ms;
      this.quiet = 0;
    } else this.quiet += ms;
    if (this.elapsed >= 18000 || this.quiet >= this.pauseMs) {
      const audio = this.flush();
      return { level, audio: audio || undefined };
    }
    return { level };
  }
  flush(): Float32Array | null {
    if (this.voiced < 300) {
      this.reset();
      return null;
    }
    const size = this.chunks.reduce((n, c) => n + c.length, 0),
      result = new Float32Array(size);
    let at = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, at);
      at += chunk.length;
    }
    this.reset();
    return result;
  }
}

export function speechWav(samples: Float32Array, sampleRate: number): Blob {
  const rate = 16000,
    ratio = sampleRate / rate,
    size = Math.floor(samples.length / ratio);
  const buffer = new ArrayBuffer(44 + size * 2),
    v = new DataView(buffer);
  function ascii(at: number, text: string) {
    for (let i = 0; i < text.length; i++)
      v.setUint8(at + i, text.charCodeAt(i));
  }
  ascii(0, "RIFF");
  v.setUint32(4, 36 + size * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ascii(36, "data");
  v.setUint32(40, size * 2, true);
  for (let i = 0; i < size; i++) {
    const start = Math.floor(i * ratio),
      end = Math.min(
        samples.length,
        Math.max(start + 1, Math.floor((i + 1) * ratio)),
      );
    let value = 0;
    for (let j = start; j < end; j++) value += samples[j];
    value = Math.max(-1, Math.min(1, value / (end - start)));
    v.setInt16(44 + i * 2, value * (value < 0 ? 32768 : 32767), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
