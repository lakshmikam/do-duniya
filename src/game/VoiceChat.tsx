import { useEffect, useRef, useState } from "react";
import { Mic, Square, Headphones, Send } from "lucide-react";
import { SpeechSegmenter, speechWav } from "./voiceCapture";

type Phase =
  | "off"
  | "starting"
  | "listening"
  | "hearing"
  | "transcribing"
  | "thinking"
  | "speaking";
type Props = {
  code: string;
  token: string;
  character: string;
  name: string;
  language: string;
  enabled: boolean;
  available: boolean;
  soundEnabled: boolean;
  onActive: (active: boolean) => void;
  onSpeaking: (speaking: boolean) => void;
  onReply: (text: string, translated: string) => void;
  onRefresh: () => void;
  unlock: () => Promise<void>;
};
export function VoiceChat(props: Props) {
  const [phase, setPhase] = useState<Phase>("off"),
    [error, setError] = useState(""),
    [transcript, setTranscript] = useState(""),
    [turns, setTurns] = useState(0),
    [level, setLevel] = useState(0),
    [pauseMs, setPauseMs] = useState(1100);
  const latest = useRef(props);
  latest.current = props;
  const active = useRef(false),
    held = useRef(false),
    turnCount = useRef(0),
    generation = useRef(0),
    stream = useRef<MediaStream | null>(null),
    context = useRef<AudioContext | null>(null),
    processor = useRef<ScriptProcessorNode | null>(null),
    segment = useRef<SpeechSegmenter | null>(null),
    controller = useRef<AbortController | null>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    audioURL = useRef(""),
    lastPaint = useRef(0);
  function stop() {
    active.current = false;
    generation.current++;
    held.current = false;
    controller.current?.abort();
    audio.current?.pause();
    if (audioURL.current) URL.revokeObjectURL(audioURL.current);
    audioURL.current = "";
    processor.current?.disconnect();
    processor.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void context.current?.close();
    context.current = null;
    segment.current = null;
    latest.current.onSpeaking(false);
    latest.current.onActive(false);
    setPhase("off");
    setLevel(0);
  }
  function interrupt() {
    generation.current++;
    controller.current?.abort();
    audio.current?.pause();
    if (audioURL.current) URL.revokeObjectURL(audioURL.current);
    audioURL.current = "";
    latest.current.onSpeaking(false);
    segment.current?.reset();
    held.current = false;
    setPhase("listening");
  }
  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (!props.enabled) stop();
  }, [props.enabled]);
  useEffect(() => {
    if (!props.soundEnabled && active.current) stop();
  }, [props.soundEnabled]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  async function post(
    path: string,
    body: object | FormData,
    signal: AbortSignal,
  ) {
    const p = latest.current;
    const form = body instanceof FormData;
    const r = await fetch(`/api/rooms/${p.code}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${p.token}`,
        ...(form ? {} : { "Content-Type": "application/json" }),
      },
      body: form ? body : JSON.stringify(body),
      signal,
    });
    if (!r.ok) {
      const d = await r.json();
      throw new Error(d.detail || "Voice service unavailable.");
    }
    return r;
  }
  async function turn(samples: Float32Array, rate: number) {
    if (!active.current || held.current) return;
    held.current = true;
    const id = generation.current,
      c = new AbortController();
    controller.current = c;
    try {
      setPhase("transcribing");
      const form = new FormData();
      form.append("audio", speechWav(samples, rate), "turn.wav");
      const heard = await (await post("transcribe", form, c.signal)).json();
      if (id !== generation.current) return;
      setTranscript(heard.text);
      setPhase("thinking");
      const reply = await (
        await post(
          "ask",
          {
            character: latest.current.character,
            question: heard.text.slice(0, 500),
          },
          c.signal,
        )
      ).json();
      latest.current.onRefresh();
      let translated = "";
      if (latest.current.language !== "en")
        translated = (
          await (await post("translate", { text: reply.text }, c.signal)).json()
        ).text;
      if (id !== generation.current) return;
      latest.current.onReply(reply.text, translated);
      const response = await post(
        "speech",
        { text: reply.text, character: latest.current.character },
        c.signal,
      );
      const blob = await response.blob();
      if (id !== generation.current) return;
      const url = URL.createObjectURL(blob);
      audioURL.current = url;
      const player = audio.current!;
      player.src = url;
      setPhase("speaking");
      latest.current.onSpeaking(true);
      await new Promise<void>((resolve, reject) => {
        player.onended = () => resolve();
        player.onerror = () =>
          reject(new Error("Playback failed. End chat and try again."));
        c.signal.addEventListener(
          "abort",
          () => reject(new DOMException("Cancelled", "AbortError")),
          { once: true },
        );
        void player.play().catch(reject);
      });
      URL.revokeObjectURL(url);
      audioURL.current = "";
      if (id !== generation.current) return;
      latest.current.onSpeaking(false);
      turnCount.current++;
      setTurns(turnCount.current);
      if (turnCount.current >= 12) {
        stop();
        setError(
          "Chat paused after 12 turns. Start again to continue; your evidence stays.",
        );
        return;
      }
      // Keep the microphone gated until the final output echo has decayed.
      await new Promise((resolve) => setTimeout(resolve, 450));
      if (id !== generation.current) return;
      segment.current?.reset();
      held.current = false;
      setPhase("listening");
    } catch (e) {
      if (id !== generation.current) return;
      stop();
      if (!c.signal.aborted) setError((e as Error).message);
      else if ((e as Error).name !== "AbortError")
        setError((e as Error).message);
    }
  }
  async function start() {
    if (active.current) return;
    setError("");
    setTranscript("");
    setTurns(0);
    turnCount.current = 0;
    active.current = true;
    const id = ++generation.current;
    setPhase("starting");
    latest.current.onActive(true);
    try {
      // Unlock this capture context and this exact playback element inside the
      // original click, before permission/network awaits lose mobile activation.
      const ctx = new AudioContext();
      context.current = ctx;
      const resumed = ctx.resume();
      audio.current = new Audio();
      const silentURL = URL.createObjectURL(
        speechWav(new Float32Array(1600), 16000),
      );
      audio.current.src = silentURL;
      const unlocked = audio.current
        .play()
        .catch(() => {})
        .finally(() => URL.revokeObjectURL(silentURL));
      await Promise.all([resumed, unlocked, latest.current.unlock()]);
      if (id !== generation.current) return;
      const s = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (id !== generation.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      const source = ctx.createMediaStreamSource(s),
        node = ctx.createScriptProcessor(2048, 1, 1),
        silent = ctx.createGain();
      silent.gain.value = 0;
      source.connect(node);
      node.connect(silent);
      silent.connect(ctx.destination);
      processor.current = node;
      const detector = new SpeechSegmenter(ctx.sampleRate, pauseMs);
      segment.current = detector;
      setPhase("listening");
      node.onaudioprocess = (e) => {
        if (!active.current || held.current) return;
        const result = detector.feed(e.inputBuffer.getChannelData(0));
        if (performance.now() - lastPaint.current > 120) {
          setLevel(Math.min(1, result.level * 12));
          setPhase(detector.hearing ? "hearing" : "listening");
          lastPaint.current = performance.now();
        }
        if (result.idle) {
          stop();
          setError(
            "Microphone paused after 45 seconds of silence. Start chat when ready.",
          );
        } else if (result.audio) void turn(result.audio, ctx.sampleRate);
      };
    } catch (e) {
      if (id === generation.current) {
        stop();
        setError(
          (e as Error).name === "NotAllowedError"
            ? "Allow microphone access to start voice chat."
            : (e as Error).message,
        );
      }
    }
  }
  const labels: Record<Phase, string> = {
    off: "Voice conversation",
    starting: "Connecting your microphone…",
    listening: "Your turn · speak naturally",
    hearing: "Listening · pause to send",
    transcribing: "Understanding what you said…",
    thinking: `${props.name} is considering your question…`,
    speaking: `${props.name} is speaking…`,
  };
  return (
    <section
      className={"voice-chat " + (phase !== "off" ? "active" : "")}
      aria-label="Hands-free character conversation"
    >
      <div className="voice-chat-heading">
        <Headphones size={20} />
        <strong role="status">{labels[phase]}</strong>
        {phase !== "off" && (
          <span className="mic-level" aria-hidden="true">
            <i style={{ transform: `scaleX(${Math.max(0.04, level)})` }} />
          </span>
        )}
      </div>
      <p>
        {phase === "off"
          ? "Speak, pause for a moment, and hear their reply. No Send button needed."
          : "The mic waits while the character speaks. End chat stops the microphone."}
      </p>
      {phase === "off" && (
        <label className="pause-preference">
          Time to think before sending{" "}
          <select
            value={pauseMs}
            onChange={(e) => setPauseMs(Number(e.target.value))}
          >
            <option value={1100}>Short pause · 1.1s</option>
            <option value={1700}>Relaxed pause · 1.7s</option>
            <option value={2300}>Extra time · 2.3s</option>
          </select>
        </label>
      )}
      {transcript && (
        <div className="voice-transcript">
          <small>YOU SAID</small>
          <span>{transcript}</span>
        </div>
      )}
      <div className="voice-chat-actions">
        {phase === "off" ? (
          <button
            className="primary"
            disabled={!props.enabled || !props.available}
            onClick={() => void start()}
          >
            <Mic size={18} />
            Start voice chat
          </button>
        ) : (
          <>
            <button className="secondary" onClick={stop}>
              <Square size={16} />
              End chat
            </button>
            {phase === "speaking" && (
              <button className="text-button" onClick={interrupt}>
                <Mic size={15} />
                Interrupt · my turn
              </button>
            )}
            {phase === "hearing" && (
              <button
                className="text-button"
                onClick={() => {
                  const data = segment.current?.flush();
                  if (data && context.current)
                    void turn(data, context.current.sampleRate);
                }}
              >
                <Send size={15} />
                Finish my turn
              </button>
            )}
            <small>{turns}/12 turns</small>
          </>
        )}
      </div>
      {error && (
        <p className="voice-chat-error" role="alert">
          {error}
        </p>
      )}
      <small className="smallprint">
        Pause detection runs on your device. Completed turns go to Prisma,
        Gemini and Timbre. Headphones help in noisy rooms.
      </small>
    </section>
  );
}
