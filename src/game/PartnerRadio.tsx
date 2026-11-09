import { useEffect, useRef, useState } from "react";
import { Radio, Mic, Square } from "lucide-react";
import { speechBuffer } from "./voiceCapture";
export type RadioPacket = {
  type: string;
  audio?: string;
  from?: string;
  granted?: boolean;
  request_id?: string;
};
type Props = {
  send: (packet: object) => boolean;
  receiver: React.MutableRefObject<((packet: RadioPacket) => void) | null>;
  connected: boolean;
  enabled: boolean;
  suppressed: boolean;
  partnerReady: boolean;
  partnerBusy?: string;
  soundEnabled: boolean;
  partnerTalking?: boolean;
  unlock: () => Promise<void>;
};
export function PartnerRadio(props: Props) {
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false),
    [talking, setTalking] = useState(false),
    [receiving, setReceiving] = useState(false),
    [error, setError] = useState("");
  const ctx = useRef<AudioContext | null>(null),
    mic = useRef<MediaStream | null>(null),
    node = useRef<ScriptProcessorNode | null>(null),
    active = useRef(false),
    holding = useRef(false),
    epoch = useRef(0),
    sources = useRef(new Set<AudioBufferSourceNode>()),
    nextPlay = useRef(0),
    receiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    transmitTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    flush = useRef<(() => void) | null>(null);
  const floorWait = useRef<{
    id: string;
    resolve: (granted: boolean) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  function release() {
    flush.current?.();
    flush.current = null;
    holding.current = false;
    epoch.current++;
    setTalking(false);
    if (transmitTimer.current) clearTimeout(transmitTimer.current);
    node.current?.disconnect();
    node.current = null;
    mic.current?.getTracks().forEach((t) => t.stop());
    mic.current = null;
    if (floorWait.current) {
      clearTimeout(floorWait.current.timer);
      floorWait.current.resolve(false);
      floorWait.current = null;
    }
    latest.current.send({ type: "radio_end" });
  }
  function stop() {
    active.current = false;
    release();
    setReady(false);
    setReceiving(false);
    for (const source of sources.current) {
      try {
        source.stop();
      } catch {
        /* ended */
      }
    }
    sources.current.clear();
    if (receiveTimer.current) clearTimeout(receiveTimer.current);
    void ctx.current?.close().catch(() => {});
    ctx.current = null;
    nextPlay.current = 0;
    latest.current.send({ type: "radio_state", enabled: false });
  }
  useEffect(() => {
    const receive = (packet: RadioPacket) => {
      if (packet.type === "radio_control") {
        const pending = floorWait.current;
        if (pending && pending.id === packet.request_id) {
          clearTimeout(pending.timer);
          floorWait.current = null;
          pending.resolve(!!packet.granted);
        }
        return;
      }
      const context = ctx.current;
      if (
        !active.current ||
        holding.current ||
        !context ||
        latest.current.suppressed ||
        !packet.audio
      )
        return;
      try {
        const raw = atob(packet.audio),
          buffer = context.createBuffer(1, raw.length / 2, 16000),
          samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
          const n = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
          samples[i] = (n > 32767 ? n - 65536 : n) / 32768;
        }
        if (nextPlay.current > context.currentTime + 1.2) {
          for (const queued of sources.current) {
            try {
              queued.stop();
            } catch {
              /* ended */
            }
          }
          sources.current.clear();
          nextPlay.current = context.currentTime;
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        sources.current.add(source);
        source.onended = () => sources.current.delete(source);
        nextPlay.current = Math.max(
          context.currentTime + 0.06,
          nextPlay.current,
        );
        source.start(nextPlay.current);
        nextPlay.current += buffer.duration;
        setReceiving(true);
        if (receiveTimer.current) clearTimeout(receiveTimer.current);
        receiveTimer.current = setTimeout(() => setReceiving(false), 650);
      } catch {
        setError(
          "A radio packet was interrupted. Partner messages still work.",
        );
      }
    };
    latest.current.receiver.current = receive;
    const hide = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", hide);
    return () => {
      latest.current.receiver.current = null;
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", hide);
      stop();
    };
  }, []);
  useEffect(() => {
    if (!props.enabled || !props.connected) stop();
  }, [props.enabled, props.connected]);
  useEffect(() => {
    if (!props.soundEnabled) stop();
  }, [props.soundEnabled]);
  useEffect(() => {
    if (props.suppressed) {
      release();
      for (const source of sources.current) {
        try {
          source.stop();
        } catch {
          /* ended */
        }
      }
      sources.current.clear();
      nextPlay.current = 0;
    }
  }, [props.suppressed]);
  async function enable() {
    if (ctx.current) return;
    setError("");
    const id = ++epoch.current;
    try {
      ctx.current = new AudioContext();
      await Promise.all([ctx.current.resume(), latest.current.unlock()]);
      if (id !== epoch.current) return;
      active.current = true;
      setReady(true);
      latest.current.send({ type: "radio_state", enabled: true });
    } catch {
      setError("Radio audio could not start. Try again or send a message.");
    }
  }
  async function transmit() {
    if (
      !active.current ||
      holding.current ||
      latest.current.suppressed ||
      !ctx.current
    )
      return;
    holding.current = true;
    const id = ++epoch.current;
    setError("");
    try {
      await ctx.current.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (id !== epoch.current || !holding.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mic.current = stream;
      const granted = await new Promise<boolean>((resolve) => {
        const request = String(id);
        const timer = setTimeout(() => {
          floorWait.current = null;
          resolve(false);
        }, 3000);
        floorWait.current = { id: request, resolve, timer };
        if (
          !latest.current.send({ type: "radio_claim", request_id: request })
        ) {
          clearTimeout(timer);
          floorWait.current = null;
          resolve(false);
        }
      });
      if (id !== epoch.current) return;
      if (!granted) {
        release();
        setError(
          "Your partner has the radio. Release, then try again when they finish.",
        );
        return;
      }
      const context = ctx.current!;
      const processor = context.createScriptProcessor(2048, 1, 1),
        silent = context.createGain();
      silent.gain.value = 0;
      context.createMediaStreamSource(stream).connect(processor);
      processor.connect(silent);
      silent.connect(context.destination);
      node.current = processor;
      setTalking(true);
      let chunks: Float32Array[] = [],
        length = 0;
      const sendChunk = () => {
        if (!length) return;
        const joined = new Float32Array(length);
        let at = 0;
        for (const c of chunks) {
          joined.set(c, at);
          at += c.length;
        }
        chunks = [];
        length = 0;
        const bytes = new Uint8Array(
          speechBuffer(joined, context.sampleRate),
          44,
        );
        let binary = "";
        for (const b of bytes) binary += String.fromCharCode(b);
        if (!latest.current.send({ type: "radio", audio: btoa(binary) }))
          setError("Radio connection paused. Reconnect before talking.");
      };
      flush.current = sendChunk;
      processor.onaudioprocess = (e) => {
        if (!holding.current || id !== epoch.current) return;
        const data = e.inputBuffer.getChannelData(0).slice();
        chunks.push(data);
        length += data.length;
        if (length < context.sampleRate * 0.18) return;
        sendChunk();
      };
      transmitTimer.current = setTimeout(release, 20000);
    } catch (e) {
      if (id === epoch.current) {
        release();
        setError(
          (e as Error).name === "NotAllowedError"
            ? "Allow the microphone to talk to your partner."
            : "Microphone unavailable. Partner messages still work.",
        );
      }
    }
  }
  return (
    <section
      className={"partner-radio " + (receiving ? "receiving" : "")}
      aria-label="Partner walkie-talkie"
    >
      <div>
        <Radio size={18} />
        <strong>
          {talking
            ? "Your partner can hear you"
            : props.partnerTalking
              ? "Your partner has the radio"
              : receiving
                ? "Your partner is talking"
                : ready
                  ? "Partner radio on"
                  : "Partner walkie-talkie"}
        </strong>
      </div>
      {!ready ? (
        <button
          className="secondary full"
          disabled={!props.connected || !props.enabled}
          onClick={() => void enable()}
        >
          Enable partner radio
        </button>
      ) : (
        <>
          <button
            className={"radio-transmit " + (talking ? "transmitting" : "")}
            disabled={
              !props.partnerReady ||
              props.partnerTalking ||
              props.suppressed ||
              !props.enabled
            }
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              void transmit();
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                void transmit();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") release();
            }}
            onBlur={release}
          >
            <Mic size={19} />
            {talking ? "Release to listen" : "Hold to talk"}
          </button>
          <button className="text-button" onClick={stop}>
            <Square size={13} />
            Turn radio off
          </button>
        </>
      )}
      <small>
        {props.suppressed
          ? "Character conversation in progress. End it to use partner radio."
          : props.partnerBusy
            ? "Your partner is speaking with " +
              props.partnerBusy +
              ". Send a message or wait for them."
            : ready && !props.partnerReady
              ? "Ask your partner to enable their radio too."
              : "Both players enable radio, then hold to talk. Audio is live and is not saved."}
      </small>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
