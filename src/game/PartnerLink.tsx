import { useEffect, useRef, useState } from "react";
import {
  MessagesSquare,
  Send,
  X,
  Link2,
  Mic,
  Square,
  Volume2,
} from "lucide-react";
import { PartnerRadio, RadioPacket } from "./PartnerRadio";
import { NoiseCalibration, SpeechSegmenter, speechWav } from "./voiceCapture";

type Message = {
  comment?: string;
  prompt?: string;
  id: string;
  author: string;
  author_id: string;
  text: string;
  kind: string;
  evidence_id?: string;
  time: number;
  source_language?: string;
  translations?: Record<string, string>;
  translation_error?: string;
};
type Peer = {
  language: string;
  radio_talking?: boolean;
  name: string;
  connected: boolean;
  radio?: boolean;
  scene?: string;
  interviewing?: string;
};
type Props = {
  code: string;
  token: string;
  language: string;
  soundEnabled: boolean;
  unlock: () => Promise<void>;
  you: string;
  peer?: Peer;
  messages: Message[];
  connected: boolean;
  enabled: boolean;
  suppressed: boolean;
  send: (packet: object) => boolean;
  receiver: React.MutableRefObject<((packet: RadioPacket) => void) | null>;
  onMessage: (text: string) => Promise<boolean>;
  onClue: (id: string) => void;
  discussion: string;
};
type Capture =
  | "off"
  | "calibrating"
  | "listening"
  | "hearing"
  | "transcribing"
  | "sending";
const LANGUAGES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  gu: "Gujarati",
  "hi-en": "Hinglish",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  pa: "Punjabi",
  bn: "Bengali",
};

export function PartnerLink(props: Props) {
  const latest = useRef(props);
  latest.current = props;
  const [open, setOpen] = useState(false),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [seen, setSeen] = useState(0),
    [error, setError] = useState(""),
    [capture, setCapture] = useState<Capture>("off"),
    [hear, setHear] = useState(false),
    [playing, setPlaying] = useState(false),
    [preparing, setPreparing] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null),
    audioURL = useRef(""),
    playbackEpoch = useRef(0),
    playbackRequest = useRef<AbortController | null>(null),
    processing = useRef(false),
    queue = useRef<string[]>([]),
    hearRef = useRef(false),
    handled = useRef(new Set(props.messages.map((m) => m.id))),
    captureEpoch = useRef(0),
    capturing = useRef(false),
    phase = useRef<Capture>("off"),
    captureRequest = useRef<AbortController | null>(null),
    mic = useRef<MediaStream | null>(null),
    context = useRef<AudioContext | null>(null),
    processor = useRef<ScriptProcessorNode | null>(null),
    detector = useRef<SpeechSegmenter | null>(null),
    captureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = props.messages.at(-1)?.id;
  const differentLanguages =
    !!props.peer && props.peer.language !== props.language;

  function setPhase(value: Capture) {
    phase.current = value;
    setCapture(value);
  }
  function releaseMic() {
    capturing.current = false;
    if (captureTimer.current) clearTimeout(captureTimer.current);
    processor.current?.disconnect();
    processor.current = null;
    mic.current?.getTracks().forEach((t) => t.stop());
    mic.current = null;
    void context.current?.close().catch(() => {});
    context.current = null;
    detector.current = null;
  }
  function stopCapture() {
    captureEpoch.current++;
    captureRequest.current?.abort();
    releaseMic();
    setPhase("off");
  }
  function stopPlayback() {
    playbackEpoch.current++;
    playbackRequest.current?.abort();
    audio.current?.pause();
    if (audioURL.current) URL.revokeObjectURL(audioURL.current);
    audioURL.current = "";
    queue.current = [];
    processing.current = false;
    setPlaying(false);
    setPreparing(false);
  }
  function stopAll() {
    stopCapture();
    stopPlayback();
    hearRef.current = false;
    setHear(false);
  }
  async function post(
    path: string,
    body: object | FormData,
    signal: AbortSignal,
  ) {
    const p = latest.current,
      form = body instanceof FormData;
    const response = await fetch(`/api/rooms/${p.code}/${path}`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${p.token}`,
        ...(form ? {} : { "Content-Type": "application/json" }),
      },
      body: form ? body : JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.json();
      throw new Error(
        typeof detail.detail === "string"
          ? detail.detail
          : "Partner voice is unavailable. Messages still work.",
      );
    }
    return response;
  }
  async function unlockAudio() {
    const epoch = playbackEpoch.current;
    audio.current ??= new Audio();
    const url = URL.createObjectURL(speechWav(new Float32Array(1600), 16000));
    audio.current.src = url;
    try {
      await Promise.all([audio.current.play(), latest.current.unlock()]);
      return epoch === playbackEpoch.current;
    } catch {
      setError(
        "Audio could not start. Read messages here, or try Hear messages again.",
      );
      return false;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function drain() {
    if (
      processing.current ||
      !queue.current.length ||
      phase.current !== "off" ||
      latest.current.suppressed ||
      !latest.current.enabled ||
      document.hidden
    )
      return;
    processing.current = true;
    const epoch = playbackEpoch.current,
      controller = new AbortController();
    playbackRequest.current = controller;
    try {
      while (queue.current.length && epoch === playbackEpoch.current) {
        const id = queue.current.shift()!;
        setPreparing(true);
        const response = await post(
          "partner-speech",
          { message_id: id },
          controller.signal,
        );
        const blob = await response.blob();
        if (epoch !== playbackEpoch.current) return;
        const url = URL.createObjectURL(blob);
        audioURL.current = url;
        const player = audio.current!;
        player.src = url;
        setPreparing(false);
        setPlaying(true);
        await new Promise<void>((resolve, reject) => {
          player.onended = () => resolve();
          player.onerror = () =>
            reject(
              new Error(
                "Spoken message playback failed. The text remains available.",
              ),
            );
          controller.signal.addEventListener(
            "abort",
            () => reject(new DOMException("Cancelled", "AbortError")),
            { once: true },
          );
          void player.play().catch(reject);
        });
        URL.revokeObjectURL(url);
        audioURL.current = "";
        setPlaying(false);
      }
    } catch (e) {
      if (epoch === playbackEpoch.current && !controller.signal.aborted) {
        setError((e as Error).message);
        hearRef.current = false;
        setHear(false);
        queue.current = [];
      }
    } finally {
      if (epoch === playbackEpoch.current) {
        processing.current = false;
        setPlaying(false);
        setPreparing(false);
      }
    }
  }
  async function enableHearing() {
    setError("");
    stopPlayback();
    if (await unlockAudio()) {
      hearRef.current = true;
      setHear(true);
    }
  }
  async function readMessage(id: string) {
    if (phase.current !== "off" || latest.current.suppressed) return;
    setError("");
    stopPlayback();
    if (await unlockAudio()) {
      queue.current = [id];
      void drain();
    }
  }
  async function sendTurn(samples: Float32Array, rate: number, epoch: number) {
    if (!capturing.current || epoch !== captureEpoch.current) return;
    releaseMic();
    setPhase("transcribing");
    const controller = new AbortController();
    captureRequest.current = controller;
    try {
      const form = new FormData();
      form.append("audio", speechWav(samples, rate), "partner-turn.wav");
      form.append("character", "partner");
      const data = await (
        await post("transcribe", form, controller.signal)
      ).json();
      if (epoch !== captureEpoch.current) return;
      const heard = String(data.text || "").trim();
      setText(heard);
      if (!heard || heard.length > 600) {
        setError(
          heard
            ? "This turn is over 600 characters. Shorten the draft before sending."
            : "No clear speech was found. Try again or type your message.",
        );
        return;
      }
      setPhase("sending");
      const sent = await latest.current.onMessage(heard);
      if (epoch !== captureEpoch.current) return;
      if (sent) setText((current) => (current === heard ? "" : current));
      else
        setError(
          "Your spoken message was not sent. The transcript is kept as a draft.",
        );
    } catch (e) {
      if (epoch === captureEpoch.current && !controller.signal.aborted)
        setError((e as Error).message);
    } finally {
      if (epoch === captureEpoch.current) setPhase("off");
    }
  }
  async function startCapture() {
    if (
      phase.current !== "off" ||
      latest.current.suppressed ||
      !latest.current.enabled
    )
      return;
    stopPlayback();
    setError("");
    const epoch = ++captureEpoch.current;
    capturing.current = true;
    setPhase("calibrating");
    try {
      const ctx = new AudioContext();
      context.current = ctx;
      const resumed = ctx.resume();
      await Promise.all([resumed, latest.current.unlock()]);
      if (epoch !== captureEpoch.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (epoch !== captureEpoch.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mic.current = stream;
      const source = ctx.createMediaStreamSource(stream),
        node = ctx.createScriptProcessor(2048, 1, 1),
        silent = ctx.createGain();
      silent.gain.value = 0;
      source.connect(node);
      node.connect(silent);
      silent.connect(ctx.destination);
      processor.current = node;
      const calibration = new NoiseCalibration(ctx.sampleRate),
        segmenter = new SpeechSegmenter(ctx.sampleRate, 1700);
      detector.current = segmenter;
      node.onaudioprocess = (event) => {
        if (!capturing.current || epoch !== captureEpoch.current) return;
        const samples = event.inputBuffer.getChannelData(0);
        if (!calibration.complete) {
          calibration.feed(samples);
          if (calibration.complete) {
            segmenter.setNoiseFloor(calibration.floor);
            setPhase("listening");
          }
          return;
        }
        const result = segmenter.feed(samples);
        const next = segmenter.hearing ? "hearing" : "listening";
        if (phase.current !== next) setPhase(next);
        if (result.audio) void sendTurn(result.audio, ctx.sampleRate, epoch);
      };
      captureTimer.current = setTimeout(() => {
        const data = detector.current?.flush();
        if (data) void sendTurn(data, ctx.sampleRate, epoch);
        else {
          stopCapture();
          setError(
            "No completed turn was found. Try a shorter clear sentence, or type it.",
          );
        }
      }, 20000);
    } catch (e) {
      if (epoch === captureEpoch.current) {
        stopCapture();
        setError(
          (e as Error).name === "NotAllowedError"
            ? "Allow the microphone to speak to your partner."
            : "Microphone unavailable. Type your message instead.",
        );
      }
    }
  }
  useEffect(() => {
    const show = () => setOpen(true),
      hide = () => {
        if (document.hidden) stopAll();
      };
    window.addEventListener("partner-open", show);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("partner-open", show);
      document.removeEventListener("visibilitychange", hide);
      stopAll();
    };
  }, []);
  useEffect(() => {
    if (open) setSeen(Date.now() / 1000);
  }, [open, last]);
  useEffect(() => {
    if (!props.enabled || props.suppressed || !props.soundEnabled) stopAll();
  }, [props.enabled, props.suppressed, props.soundEnabled]);
  useEffect(() => {
    stopAll();
  }, [props.language, props.code]);
  useEffect(() => {
    for (const message of props.messages) {
      if (handled.current.has(message.id)) continue;
      handled.current.add(message.id);
      const source = message.source_language || "en";
      if (
        hearRef.current &&
        message.author_id !== props.you &&
        message.kind === "message" &&
        (source === props.language || message.translations?.[props.language]) &&
        !props.suppressed &&
        phase.current === "off" &&
        !document.hidden
      )
        queue.current.push(message.id);
    }
    queue.current = queue.current.slice(-5);
    if (handled.current.size > 200)
      handled.current = new Set(props.messages.map((m) => m.id));
    if (audio.current) void drain();
  }, [last, props.messages, props.language, props.suppressed]);

  const unread = props.messages.filter(
    (m) => m.author_id !== props.you && m.time > seen,
  ).length;
  const captureLabel: Record<Capture, string> = {
    off: "Speak and translate",
    calibrating: "Quiet moment · checking room noise…",
    listening: "Your turn · speak, then pause",
    hearing: "Listening · pause to send",
    transcribing: "Understanding your message…",
    sending: "Sending your partner’s translation…",
  };
  return (
    <aside
      className={"partner-dock " + (open ? "expanded" : "")}
      data-partner-dock
      aria-label="Partner communication"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        className="partner-dock-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MessagesSquare size={20} />
        <span>
          {props.peer?.name || "Your partner"}
          <small>
            {props.peer?.connected && props.peer.interviewing
              ? "Speaking with " + props.peer.interviewing
              : props.peer?.connected
                ? props.peer.scene || "Connected to your investigation"
                : "Waiting for connection"}
          </small>
        </span>
        {unread > 0 && <b>{unread}</b>}
        {open && <X size={17} />}
      </button>
      <div className="partner-dock-body" hidden={!open}>
        <p className="partner-discussion">
          <strong>What to discuss</strong>
          <span>“{props.discussion}”</span>
          <small>
            Ask in your language. Keep your partner’s meaning in view.
          </small>
        </p>
        <section
          className="partner-language-tools"
          aria-label="Partner language relay"
        >
          <p>
            {differentLanguages
              ? `${LANGUAGES[props.language] || props.language} ↔ ${LANGUAGES[props.peer!.language] || props.peer!.language}`
              : "Speak or type to your partner"}
            <small>
              {differentLanguages
                ? "Messages translate for your partner. Originals stay available."
                : "Spoken turns become messages; no radio button to hold."}
            </small>
          </p>
          <div className="partner-language-actions">
            <button
              type="button"
              disabled={
                !props.enabled || props.suppressed || busy || capture !== "off"
              }
              onClick={() => void startCapture()}
            >
              <Mic size={16} />
              {capture === "off"
                ? differentLanguages
                  ? "Speak and translate"
                  : "Speak a message"
                : captureLabel[capture]}
            </button>
            {capture !== "off" && (
              <button type="button" onClick={stopCapture}>
                <Square size={14} />
                Cancel
              </button>
            )}
            <button
              type="button"
              aria-pressed={hear}
              disabled={!props.enabled || props.suppressed || capture !== "off"}
              onClick={() => {
                if (hear) {
                  hearRef.current = false;
                  setHear(false);
                  stopPlayback();
                } else void enableHearing();
              }}
            >
              <Volume2 size={16} />
              {hear ? "Hear messages: on" : "Hear messages"}
            </button>
          </div>
          {(capture !== "off" || preparing || playing) && (
            <span className="partner-relay-status" role="status">
              {capture !== "off"
                ? captureLabel[capture]
                : preparing
                  ? "Preparing spoken relay…"
                  : "Reading the message…"}
            </span>
          )}
          <small>
            One turn at a time. Pause to send; processing can take a few
            seconds. AI relay voices are not your partner’s actual voice.
          </small>
        </section>
        <details className="optional-radio">
          <summary>Original-voice radio (optional, no translation)</summary>
          {capture !== "off" || hear || playing || preparing ? (
            <p className="partner-mode-note">
              Raw radio pauses while the translated relay is active. Turn Hear
              messages off to switch back.
            </p>
          ) : (
            <PartnerRadio
              send={props.send}
              receiver={props.receiver}
              connected={props.connected}
              enabled={props.enabled}
              suppressed={props.suppressed}
              partnerReady={!!props.peer?.radio && !props.peer?.interviewing}
              partnerTalking={props.peer?.radio_talking}
              soundEnabled={props.soundEnabled}
              unlock={props.unlock}
              partnerBusy={
                props.peer?.connected ? props.peer.interviewing : undefined
              }
            />
          )}
        </details>
        <div
          className="partner-messages"
          role="log"
          aria-label="Shared partner messages"
          aria-live="polite"
        >
          {props.messages.length === 0 ? (
            <p className="empty-partner">
              Ask the question above. New clues appear in both notebooks
              automatically.
            </p>
          ) : (
            props.messages.slice(-15).map((message) => {
              const incoming = message.author_id !== props.you,
                translated = incoming
                  ? message.translations?.[props.language]
                  : undefined;
              const source = message.source_language || "en",
                untranslated =
                  incoming && source !== props.language && !translated;
              return (
                <article key={message.id} className={incoming ? "" : "mine"}>
                  <small>{incoming ? message.author : "YOU"}</small>
                  {message.kind === "clue" ? (
                    <button
                      className="shared-clue-message"
                      onClick={() => props.onClue(message.evidence_id!)}
                    >
                      <Link2 size={15} />
                      <span>
                        Added to both notebooks<strong>{message.text}</strong>
                      </span>
                    </button>
                  ) : (
                    <>
                      <p lang={translated ? props.language : source}>
                        {translated || message.text}
                      </p>
                      {translated && (
                        <details className="partner-original">
                          <summary>
                            Original · {LANGUAGES[source] || source}
                          </summary>
                          <p lang={source}>{message.text}</p>
                        </details>
                      )}
                      {translated && (
                        <small className="partner-translation-note">
                          AI translation ·{" "}
                          {LANGUAGES[props.language] || props.language}
                        </small>
                      )}
                      {!incoming &&
                        props.peer &&
                        message.translations?.[props.peer.language] && (
                          <details className="partner-original">
                            <summary>
                              Your partner receives ·{" "}
                              {LANGUAGES[props.peer.language] ||
                                props.peer.language}
                            </summary>
                            <p lang={props.peer.language}>
                              {message.translations[props.peer.language]}
                            </p>
                          </details>
                        )}
                      {(untranslated ||
                        (!incoming && message.translation_error)) && (
                        <small className="partner-translation-warning">
                          {(!incoming && message.translation_error
                            ? "Translation unavailable; your partner received the original."
                            : message.translation_error) ||
                            "Original message · no translation for your language is available."}
                        </small>
                      )}
                      {!untranslated &&
                        (source === props.language ||
                          !!message.translations?.[props.language]) && (
                          <button
                            className="partner-read"
                            type="button"
                            disabled={
                              props.suppressed ||
                              capture !== "off" ||
                              !props.enabled
                            }
                            onClick={() => void readMessage(message.id)}
                          >
                            <Volume2 size={13} />
                            {translated ? "Read translation" : "Read message"}
                          </button>
                        )}
                    </>
                  )}
                </article>
              );
            })
          )}
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              !text.trim() ||
              busy ||
              phase.current !== "off" ||
              text.length > 600
            )
              return;
            setBusy(true);
            setError("");
            try {
              if (await props.onMessage(text)) setText("");
              else setError("Message not sent. Your draft is still here.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="partner-message">Talk to your partner</label>
          <div>
            <input
              id="partner-message"
              maxLength={600}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I found something. Can you check…"
              disabled={!props.enabled || capture !== "off"}
            />
            <button
              aria-label="Send partner message"
              disabled={
                busy ||
                !text.trim() ||
                text.length > 600 ||
                !props.enabled ||
                capture !== "off"
              }
            >
              <Send size={18} />
            </button>
          </div>
        </form>
        {error && (
          <p className="partner-relay-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}
