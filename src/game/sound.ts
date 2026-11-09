/** Original procedural soundtrack. No downloaded music or hidden audio uploads. */
export class GameSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: AudioBufferSourceNode | null = null;
  private pulse: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private enabled = false;
  private volume = 0.65;
  private speaking = false;
  private drones: OscillatorNode[] = [];

  async unlock() {
    this.context ??= new AudioContext();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.gain.value = this.volume * 0.8;
      this.master.connect(this.context.destination);
    }
    await this.context.resume();
    this.enabled = true;
  }

  setMuted(muted: boolean) {
    this.enabled = !muted;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(
        muted ? 0 : this.volume * (this.speaking ? 0.27 : 0.8),
        this.context.currentTime,
        0.08,
      );
    }
  }

  duck(speaking: boolean) {
    this.speaking = speaking;
    if (this.context && this.master && this.enabled)
      this.master.gain.setTargetAtTime(
        this.volume * (speaking ? 0.27 : 0.8),
        this.context.currentTime,
        0.15,
      );
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.setMuted(!this.enabled);
  }

  getState() {
    return this.context?.state || "not-started";
  }

  cue(kind: "tap" | "clue" | "travel" | "reveal") {
    if (!this.enabled || !this.context || !this.master) return;
    const frequencies =
      kind === "clue"
        ? [293.66, 349.23, 440]
        : kind === "reveal"
          ? [261.63, 329.63, 392, 523.25]
          : kind === "travel"
            ? [146.83, 220]
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
      samples[i] = ((seed / 2147483647) * 2 - 1) * 0.52;
    }
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = blue ? 750 : 1900;
    gain.gain.value = blue ? 0.28 : 0.38;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.ambience = source;
    // A sustained, slightly detuned minor bed gives phone speakers audible
    // midrange tension; it does not depend on sub-bass reproduction.
    for (const [frequency, level] of [
      [110, 0.05],
      [165, 0.033],
      [220.7, 0.027],
    ]) {
      const oscillator = ctx.createOscillator(),
        envelope = ctx.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, ctx.currentTime);
      envelope.gain.linearRampToValueAtTime(level, ctx.currentTime + 2);
      oscillator.connect(envelope).connect(this.master);
      oscillator.start();
      this.drones.push(oscillator);
    }
    this.step = 0;
    this.pulse = setInterval(() => {
      if (!this.enabled || !this.context) return;
      const notes = blue
        ? [146.83, 220, 174.61, 164.81, 146.83, 233.08, 220, 164.81]
        : [146.83, 220, 155.56, 196, 146.83, 233.08, 174.61, 155.56];
      this.tone(
        notes[this.step++ % notes.length],
        this.context.currentTime,
        2.3,
        0.14,
      );
      if (this.step % 6 === 0) this.thunder();
    }, 1700);
  }
  private thunder() {
    if (!this.context || !this.master || !this.enabled) return;
    const ctx = this.context,
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      level = ctx.createGain();
    source.buffer = noise;
    filter.type = "lowpass";
    filter.frequency.value = 350;
    level.gain.setValueAtTime(0, ctx.currentTime);
    level.gain.linearRampToValueAtTime(0.19, ctx.currentTime + 0.5);
    level.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.9);
    source.connect(filter).connect(level).connect(this.master);
    source.start();
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
    this.drones.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    });
    this.drones = [];
  }
  dispose() {
    this.stopAtmosphere();
    void this.context?.close();
  }
}
