/** Original procedural soundtrack. No downloaded music or hidden audio uploads. */
export class GameSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: AudioBufferSourceNode | null = null;
  private pulse: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private enabled = false;

  async unlock() {
    this.context ??= new AudioContext();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.context.destination);
    }
    await this.context.resume();
    this.enabled = true;
  }

  setMuted(muted: boolean) {
    this.enabled = !muted;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(
        muted ? 0 : 0.22,
        this.context.currentTime,
        0.08,
      );
    }
  }

  duck(speaking: boolean) {
    if (this.context && this.master && this.enabled)
      this.master.gain.setTargetAtTime(
        speaking ? 0.055 : 0.22,
        this.context.currentTime,
        0.15,
      );
  }

  cue(kind: "tap" | "clue" | "travel" | "reveal") {
    if (!this.enabled || !this.context || !this.master) return;
    const frequencies =
      kind === "clue"
        ? [523.25, 659.25, 783.99]
        : kind === "reveal"
          ? [261.63, 329.63, 392, 523.25]
          : kind === "travel"
            ? [196, 293.66]
            : [440];
    frequencies.forEach((f, i) =>
      this.tone(
        f,
        this.context!.currentTime + i * 0.085,
        kind === "tap" ? 0.05 : 0.42,
        kind === "tap" ? 0.12 : 0.22,
      ),
    );
  }

  private tone(
    frequency: number,
    at: number,
    duration: number,
    volume: number,
  ) {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator(),
      envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(envelope).connect(this.master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
  }

  startAtmosphere(blue: boolean) {
    this.stopAtmosphere();
    if (!this.enabled || !this.context || !this.master) return;
    const ctx = this.context;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    // Seeded soft noise, filtered into distant rain / wind.
    let seed = 47;
    for (let i = 0; i < samples.length; i++) {
      seed = (seed * 16807) % 2147483647;
      samples[i] = ((seed / 2147483647) * 2 - 1) * 0.28;
    }
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = blue ? 750 : 1900;
    gain.gain.value = blue ? 0.16 : 0.23;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.ambience = source;
    this.step = 0;
    this.pulse = setInterval(() => {
      if (!this.enabled || !this.context) return;
      const notes = blue
        ? [146.83, 220, 261.63, 220, 164.81, 246.94, 293.66, 220]
        : [130.81, 196, 261.63, 196, 155.56, 233.08, 293.66, 196];
      this.tone(
        notes[this.step++ % notes.length],
        this.context.currentTime,
        1.1,
        0.09,
      );
    }, 700);
  }
  stopAtmosphere() {
    if (this.pulse) clearInterval(this.pulse);
    this.pulse = null;
    try {
      this.ambience?.stop();
    } catch {
      /* already stopped */
    }
    this.ambience = null;
  }
  dispose() {
    this.stopAtmosphere();
    void this.context?.close();
  }
}
