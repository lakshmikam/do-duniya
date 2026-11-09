import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Fingerprint,
  Radio,
  Clock3,
  Users,
  Headphones,
  BookOpen,
  X,
  Check,
  Copy,
  Search,
  MapPin,
  ChevronRight,
  FileText,
  Volume2,
  Pause,
  Play,
  Send,
  Mic,
  Square,
  Lightbulb,
  NotebookPen,
  Link2,
  RefreshCw,
  CheckCircle2,
  Circle,
  LogOut,
  AlertCircle,
  TrainFront,
  Feather,
  Compass,
  LoaderCircle,
} from "lucide-react";
import "./style.css";
import { World, GameCharacter } from "./game/World";
import { Opening } from "./game/Opening";
import { GameSound } from "./game/sound";
import "./game/game.css";

type Case = {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  genre: string;
  duration: number;
  tagline: string;
  description: string;
  brief: string;
  credit: string;
  source: string | null;
  roles: Record<string, { name: string; subtitle: string }>;
};
type Evidence = {
  id: string;
  title: string;
  text: string;
  kind: string;
  role: string;
  location: string;
  shared: boolean;
};
type Character = {
  id: string;
  name: string;
  occupation: string;
  location: string;
  initial: string;
  topics: { id: string; label: string }[];
};
type Room = {
  code: string;
  case: Case;
  status: string;
  solo: boolean;
  you: {
    id: string;
    name: string;
    role: string;
    language: string;
    ready: boolean;
  };
  players: {
    id: string;
    name: string;
    role: string;
    language: string;
    ready: boolean;
    connected: boolean;
  }[];
  locations: {
    id: string;
    name: string;
    description: string;
    locked: boolean;
  }[];
  objects: {
    id: string;
    title: string;
    location: string;
    kind: string;
    discovered: boolean;
  }[];
  characters: Character[];
  evidence: Evidence[];
  shared_count: number;
  total_evidence: number;
  timer: { enabled: boolean; elapsed: number; limit: number; paused: boolean };
  events: { id: string; text: string; time: number }[];
  notes: { id: string; author: string; text: string }[];
  hint: string | null;
  revision: number;
  proposal: {
    by: string;
    answers: Record<string, string>;
    evidence: string[];
    explanation: string;
    approved: string[];
  } | null;
  questions: {
    id: string;
    label: string;
    options: { id: string; label: string }[];
  }[];
  suspects: { id: string; name: string }[];
  providers: { gemini: boolean; prisma: boolean; timbre: boolean };
  result: null | {
    success: boolean;
    supported: boolean;
    checks: { label: string; correct: boolean }[];
    reveal: string;
    timeline: [string, string][];
    required_evidence: Evidence[];
  };
};
const LANGS: Record<string, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
  "hi-en": "Hinglish",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  mr: "मराठी",
  pa: "ਪੰਜਾਬੀ",
  bn: "বাংলা",
};
const API = "/api";
const uid = () => crypto.randomUUID();
async function request(
  path: string,
  body?: unknown,
  token?: string,
  signal?: AbortSignal,
) {
  const response = await fetch(API + path, {
    signal,
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "The server could not complete this request." }));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : "Please check your input and try again.",
    );
  }
  return response.json();
}
function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={"brand " + (small ? "small" : "")}>
      <span className="brand-symbol">
        <i />
        <i />
      </span>
      <span>
        do duniya<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
function SceneArt({ blue = false }: { blue?: boolean; detail?: boolean }) {
  return <World blue={blue} />;
}
function LocationArt({ id, blue }: { id: string; blue: boolean }) {
  return <World location={id} blue={blue} />;
}
function Portrait({ id }: { id: string }) {
  return <GameCharacter id={id} />;
}
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const nodes = Array.from(
          ref.current.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,textarea,select,a[href]",
          ),
        );
        if (!nodes.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-shade"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <header>
          <span className="eyebrow">INVESTIGATION DESK</span>
          <button className="icon" onClick={onClose} aria-label="Close dialog">
            <X size={21} />
          </button>
        </header>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
function App() {
  const [cases, setCases] = useState<Case[]>([]),
    [selected, setSelected] = useState(0),
    [room, setRoom] = useState<Room | null>(null),
    [token, setToken] = useState("");
  const [soundOn, setSoundOn] = useState(false),
    [opening, setOpening] = useState(false),
    [openingSeen, setOpeningSeen] = useState("");
  const soundEngine = useRef<GameSound | null>(null),
    clipCache = useRef(new Map<string, Blob>()),
    voiceElement = useRef<HTMLAudioElement | null>(null),
    introNarrated = useRef(new Set<string>());
  const [autoVoiceBlocked, setAutoVoiceBlocked] = useState(false);
  async function enableSound() {
    soundEngine.current ??= new GameSound();
    try {
      await soundEngine.current.unlock();
      setSoundOn(true);
      setAutoVoiceBlocked(false);
      // Reuse a media element unlocked within this gesture for mobile browsers.
      voiceElement.current ??= new Audio();
      voiceElement.current.src =
        "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQIAAAAAAA==";
      await voiceElement.current.play().catch(() => {});
    } catch {
      setToast("Sound could not start. You can still play with subtitles.");
    }
  }
  const [accessRequired, setAccessRequired] = useState(false),
    [accessCode, setAccessCode] = useState("");
  const [setup, setSetup] = useState<"create" | "join" | null>(null),
    [how, setHow] = useState(false),
    [name, setName] = useState(""),
    [code, setCode] = useState(
      new URLSearchParams(location.search).get("room") || "",
    ),
    [language, setLanguage] = useState("en"),
    [role, setRole] = useState("field"),
    [timed, setTimed] = useState(true),
    [solo, setSolo] = useState(false);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [connected, setConnected] = useState(false),
    [locationId, setLocationId] = useState(""),
    [modal, setModal] = useState<
      "board" | "theory" | "brief" | "settings" | null
    >(null),
    [clue, setClue] = useState<Evidence | null>(null),
    [witness, setWitness] = useState<Character | null>(null),
    [dialogue, setDialogue] = useState(""),
    [question, setQuestion] = useState(""),
    [answerSource, setAnswerSource] = useState("authored"),
    [toast, setToast] = useState(""),
    [now, setNow] = useState(Date.now()),
    [syncAt, setSyncAt] = useState(Date.now()),
    [note, setNote] = useState(""),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [chosen, setChosen] = useState<string[]>([]),
    [explanation, setExplanation] = useState(""),
    [translation, setTranslation] = useState(""),
    [speaking, setSpeaking] = useState(false),
    [recording, setRecording] = useState(false),
    [recordSeconds, setRecordSeconds] = useState(0),
    [voiceBusy, setVoiceBusy] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null),
    media = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    recordStart = useRef(0),
    recordTimeout = useRef<ReturnType<typeof setTimeout> | null>(null),
    receivedRoom = useRef<Room | null>(null);
  const voiceRequest = useRef<AbortController | null>(null),
    viewEpoch = useRef(0),
    audioURL = useRef("");
  function sync(r: Room) {
    const previous = receivedRoom.current;
    if (previous?.code === r.code && r.revision < previous.revision) return;
    receivedRoom.current = r;
    setRoom(r);
    setSyncAt(Date.now());
  }
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (room?.status === "completed") {
      setModal(null);
      setWitness(null);
      setClue(null);
    }
  }, [room?.status]);
  useEffect(() => {
    request("/cases")
      .then(setCases)
      .catch((e) => setError(e.message));
    request("/health")
      .then((d) => setAccessRequired(Boolean(d.access_required)))
      .catch(() => {});
    const saved = sessionStorage.getItem("duniya-session");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        request("/rooms/" + s.code, undefined, s.token)
          .then((r) => {
            setToken(s.token);
            sync(r);
          })
          .catch(() => sessionStorage.removeItem("duniya-session"));
      } catch {
        sessionStorage.removeItem("duniya-session");
      }
    }
  }, []);
  useEffect(() => {
    if (!room || !token) return;
    let stopped = false;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      socket = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/rooms/${room.code}/live`,
      );
      socket.onopen = () => {
        socket?.send(JSON.stringify({ token }));
        setConnected(true);
      };
      socket.onmessage = (e) => {
        try {
          sync(JSON.parse(e.data));
        } catch {}
      };
      socket.onclose = () => {
        setConnected(false);
        if (!stopped) retry = setTimeout(connect, 2000);
      };
    };
    connect();
    const poll = setInterval(() => {
      request("/rooms/" + room.code, undefined, token)
        .then(sync)
        .catch(() => {});
    }, 6000);
    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(poll);
      socket?.close();
    };
  }, [room?.code, token]);
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      if (media.current?.state === "recording")
        setRecordSeconds(Math.floor((Date.now() - recordStart.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!room) return;
    const available = room.locations.filter((l) => !l.locked);
    if (!available.some((l) => l.id === locationId))
      setLocationId(available[0]?.id || "");
  }, [
    room?.you.role,
    room?.locations.map((l) => l.id + String(l.locked)).join(","),
  ]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    viewEpoch.current++;
    voiceRequest.current?.abort();
    setVoiceBusy(false);
    setTranslation("");
    audio.current?.pause();
    if (audioURL.current) {
      URL.revokeObjectURL(audioURL.current);
      audioURL.current = "";
    }
    setSpeaking(false);
  }, [
    clue?.id,
    witness?.id,
    dialogue,
    room?.you.language,
    modal,
    room?.code,
    room?.status,
    soundOn,
  ]);
  useEffect(() => {
    const running = room?.status === "playing";
    if (running && room.code !== openingSeen) {
      setOpening(true);
      setOpeningSeen(room.code);
    }
  }, [room?.status, room?.code, openingSeen]);
  useEffect(() => {
    if (!soundEngine.current) return;
    soundEngine.current.setMuted(!soundOn);
    if (soundOn && room?.status === "playing" && !opening)
      soundEngine.current.startAtmosphere(room.case.id === "blue-carbuncle");
    else soundEngine.current.stopAtmosphere();
    return () => soundEngine.current?.stopAtmosphere();
  }, [soundOn, room?.status, room?.case.id, opening]);
  useEffect(() => {
    soundEngine.current?.duck(speaking);
  }, [speaking]);
  useEffect(() => {
    if (
      !soundOn ||
      !room?.providers.timbre ||
      room.status !== "playing" ||
      opening
    )
      return;
    const isIntro =
      !witness && !clue && !introNarrated.current.has(room.code) && !modal;
    const text = witness
      ? dialogue
      : clue?.text || (isIntro ? room.case.brief : "");
    if (!text) return;
    const t = setTimeout(() => {
      if (isIntro) introNarrated.current.add(room.code);
      void listen(text, witness?.id || "", true);
    }, 180);
    return () => clearTimeout(t);
  }, [
    soundOn,
    witness?.id,
    dialogue,
    clue?.id,
    room?.you.language,
    room?.status,
    opening,
  ]);
  useEffect(() => {
    if (toast) soundEngine.current?.cue("clue");
  }, [toast]);
  useEffect(() => {
    if (locationId) soundEngine.current?.cue("travel");
  }, [locationId]);
  useEffect(() => {
    if (room?.status === "completed") soundEngine.current?.cue("reveal");
  }, [room?.status]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) {
        soundEngine.current?.stopAtmosphere();
        audio.current?.pause();
        voiceRequest.current?.abort();
        setSpeaking(false);
        setVoiceBusy(false);
      } else if (soundOn && room?.status === "playing" && !opening) {
        soundEngine.current?.startAtmosphere(room.case.id === "blue-carbuncle");
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [soundOn, room?.status, room?.case.id, opening]);
  useEffect(() => () => soundEngine.current?.dispose(), []);
  useEffect(
    () => () => {
      audio.current?.pause();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (recordTimeout.current) clearTimeout(recordTimeout.current);
    },
    [],
  );
  async function enter() {
    setBusy(true);
    setError("");
    try {
      const data =
        setup === "join"
          ? await request("/join", {
              code: code.trim().toUpperCase(),
              name: name || "Investigator",
              language,
              access_code: accessCode,
            })
          : await request("/rooms", {
              case_id: cases[selected].id,
              name: name || "Investigator",
              role,
              language,
              timed,
              solo,
              access_code: accessCode,
            });
      setToken(data.token);
      sync(data.room);
      sessionStorage.setItem(
        "duniya-session",
        JSON.stringify({ code: data.room.code, token: data.token }),
      );
      setSetup(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function act(kind: string, extra: Record<string, unknown> = {}) {
    if (!room) return;
    setError("");
    setBusy(true);
    try {
      const r = await request(
        `/rooms/${room.code}/action`,
        { kind, request_id: uid(), ...extra },
        token,
      );
      sync(r);
      return r as Room;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function cancelRecording() {
    if (recordTimeout.current) clearTimeout(recordTimeout.current);
    if (media.current?.state === "recording") {
      media.current.onstop = null;
      media.current.stop();
    }
    stream.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }
  function leave() {
    audio.current?.pause();
    cancelRecording();
    receivedRoom.current = null;
    sessionStorage.removeItem("duniya-session");
    setRoom(null);
    setToken("");
    setModal(null);
    setWitness(null);
    setClue(null);
    setError("");
  }
  async function inspect(id: string) {
    const r = await act("inspect", { target: id });
    if (r) {
      setClue(r.evidence.find((e) => e.id === id) || null);
    }
  }
  async function ask(topic = "") {
    if (!room || !witness) return;
    const epoch = viewEpoch.current;
    setBusy(true);
    setError("");
    try {
      const data = await request(
        `/rooms/${room.code}/ask`,
        { character: witness.id, topic, question },
        token,
      );
      if (epoch !== viewEpoch.current) return;
      setDialogue(data.text);
      setAnswerSource(data.provider);
      setQuestion("");
      if (data.evidence)
        setToast("A new testimony was added to your notebook.");
      request("/rooms/" + room.code, undefined, token)
        .then(sync)
        .catch(() => {});
    } catch (e) {
      if (epoch === viewEpoch.current) setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function translate(text: string) {
    if (!room) return;
    const epoch = viewEpoch.current,
      controller = new AbortController();
    voiceRequest.current?.abort();
    voiceRequest.current = controller;
    setVoiceBusy(true);
    setError("");
    try {
      const data = await request(
        `/rooms/${room.code}/translate`,
        { text },
        token,
        controller.signal,
      );
      if (epoch === viewEpoch.current) setTranslation(data.text);
    } catch (e) {
      if (!controller.signal.aborted && epoch === viewEpoch.current)
        setError((e as Error).message);
    } finally {
      if (epoch === viewEpoch.current) setVoiceBusy(false);
    }
  }
  async function listen(text: string, character = "", automatic = false) {
    if (!room) return;
    if (speaking && !automatic) {
      audio.current?.pause();
      setSpeaking(false);
      return;
    }
    const epoch = viewEpoch.current,
      controller = new AbortController();
    voiceRequest.current?.abort();
    voiceRequest.current = controller;
    setVoiceBusy(true);
    setError("");
    try {
      const cacheKey = room.you.language + "|" + character + "|" + text;
      let blob = clipCache.current.get(cacheKey);
      if (!blob) {
        const r = await fetch(`/api/rooms/${room.code}/speech`, {
          signal: controller.signal,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text, character }),
        });
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.detail);
        }
        blob = await r.blob();
        if (clipCache.current.size >= 30) clipCache.current.clear();
        clipCache.current.set(cacheKey, blob);
      }
      if (epoch !== viewEpoch.current) return;
      const url = URL.createObjectURL(blob);
      if (audioURL.current) URL.revokeObjectURL(audioURL.current);
      audioURL.current = url;
      audio.current?.pause();
      const a = voiceElement.current || new Audio();
      voiceElement.current = a;
      a.src = url;
      audio.current = a;
      a.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      a.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
        setError("Audio playback failed. The text remains available.");
      };
      await a.play();
      if (epoch !== viewEpoch.current) {
        a.pause();
        return;
      }
      setSpeaking(true);
    } catch (e) {
      if (!controller.signal.aborted && epoch === viewEpoch.current) {
        if (automatic) {
          setAutoVoiceBlocked(true);
          setToast(
            "Voice paused. Tap Replay voice, or continue with subtitles.",
          );
        } else setError((e as Error).message);
      }
    } finally {
      if (epoch === viewEpoch.current) setVoiceBusy(false);
    }
  }
  async function record() {
    if (!room || recording) {
      media.current?.stop();
      return;
    }
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const recorder = new MediaRecorder(s);
      media.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        if (recordTimeout.current) clearTimeout(recordTimeout.current);
        s.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setVoiceBusy(true);
        try {
          const wav = await toWav(
            new Blob(chunks, { type: recorder.mimeType }),
          );
          const form = new FormData();
          form.append("audio", wav, "question.wav");
          const r = await fetch(`/api/rooms/${room.code}/transcribe`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.detail);
          setQuestion(d.text);
          setToast("Prisma transcript ready. Review it before asking.");
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setVoiceBusy(false);
        }
      };
      recorder.start();
      recordStart.current = Date.now();
      setRecordSeconds(0);
      setRecording(true);
      recordTimeout.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 20000);
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(
        "Microphone access is unavailable. You can type your question instead.",
      );
    }
  }
  function soundControls(text: string, character = "") {
    return (
      <div className="sound-controls">
        <button
          className="text-button"
          disabled={voiceBusy || !room?.providers.timbre}
          title={
            !room?.providers.timbre
              ? "Configure the server’s Gnani key to enable voice"
              : ""
          }
          onClick={() => listen(text, character)}
        >
          {voiceBusy ? (
            <LoaderCircle className="spin" size={15} />
          ) : speaking ? (
            <Square size={15} />
          ) : (
            <Volume2 size={15} />
          )}{" "}
          {speaking
            ? "Stop voice"
            : voiceBusy
              ? "Preparing voice…"
              : "Replay voice"}
        </button>
        {room?.you.language !== "en" && (
          <button
            className="text-button"
            disabled={voiceBusy || !room?.providers.gemini}
            onClick={() => translate(text)}
          >
            Read in {LANGS[room?.you.language || "en"]}
          </button>
        )}
      </div>
    );
  }
  const caseItem = cases[selected];
  if (!room)
    return (
      <>
        <div className="landing">
          <nav className="landing-nav">
            <Mark />
            <span className="nav-caption">AN INVESTIGATION FOR TWO</span>
            <button className="text-button" onClick={() => setHow(true)}>
              How to play <ArrowUpRight size={16} />
            </button>
          </nav>
          <main>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="little-line" /> A COOPERATIVE VOICE MYSTERY
                </div>
                <h1>
                  Two detectives.
                  <br />
                  <em>One big mystery.</em>
                </h1>
                <p>
                  A midnight train. A vanished station master.
                  <br />
                  Your friend has the other half of the story.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary"
                    disabled={!caseItem}
                    onClick={() => {
                      setSolo(false);
                      setSetup("create");
                    }}
                  >
                    Play the mystery <ArrowUpRight size={19} />
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setSetup("join")}
                  >
                    Join with a code
                  </button>
                </div>
                <div className="hero-foot">
                  <span>
                    <Users size={15} /> 2 investigators
                  </span>
                  <span>
                    <Headphones size={15} /> Your language. Your voice.
                  </span>
                </div>
              </div>
              <div className={"hero-art " + (selected === 1 ? "blue" : "")}>
                <SceneArt blue={selected === 1} />
                <div className="art-top">
                  <span>CASE FILE / {caseItem?.number || "01"}</span>
                  <Fingerprint size={27} />
                </div>
                <div className="art-bottom">
                  <span className="eyebrow">{caseItem?.eyebrow}</span>
                  <h2>{caseItem?.title || "The Last Announcement"}</h2>
                  <span className="art-caption">
                    Some stories need two sides.
                  </span>
                </div>
                <div className="ticket">
                  <span>ADMIT TWO</span>
                  <span>DO DUNIYA INVESTIGATIONS</span>
                  <span>№ 0047</span>
                </div>
              </div>
            </section>
            <section className="case-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THE CASEBOOK</span>
                  <h2>Every story has another side.</h2>
                </div>
                <span className="case-count">02 CASES · ONE PARTNER</span>
              </div>
              <div className="case-grid">
                {cases.map((c, i) => (
                  <button
                    key={c.id}
                    className={
                      "case-card " + (selected === i ? "selected" : "")
                    }
                    onClick={() => setSelected(i)}
                  >
                    <div className="case-mini">
                      <SceneArt blue={i === 1} />
                      <span>{c.number}</span>
                    </div>
                    <div className="case-card-copy">
                      <div className="eyebrow">
                        {i === 0
                          ? "AN ORIGINAL MYSTERY"
                          : "AFTER ARTHUR CONAN DOYLE"}
                      </div>
                      <h3>{c.title}</h3>
                      <p>{c.description}</p>
                      <div className="case-meta">
                        <span>
                          <Clock3 size={14} /> {c.duration} min target
                        </span>
                        <span>
                          {selected === i ? "Selected" : "Select case"}{" "}
                          {selected === i ? (
                            <Check size={16} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className="principles">
              <div>
                <span className="step">01 /</span>
                <h3>Different perspectives.</h3>
                <p>
                  Explore separate places. Hold different clues. Neither of you
                  has the whole picture.
                </p>
              </div>
              <div>
                <span className="step">02 /</span>
                <h3>Real conversation.</h3>
                <p>
                  Question witnesses in your own words. Compare notes with your
                  partner.
                </p>
              </div>
              <div>
                <span className="step">03 /</span>
                <h3>Your reconstruction.</h3>
                <p>
                  Follow the evidence. Build a theory. Agree on what really
                  happened.
                </p>
              </div>
            </section>
          </main>
          <footer className="landing-footer">
            <Mark small />
            <span>Made for curious minds. Better together.</span>
            <button
              className="text-button"
              onClick={() => {
                setSolo(true);
                setSetup("create");
              }}
            >
              Play solo · explore both roles <ArrowUpRight size={14} />
            </button>
          </footer>
        </div>
        {error && (
          <div className="global-error" role="alert">
            <AlertCircle size={18} />
            {error}
            <button
              className="icon"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {setup && (
          <Modal
            title={
              setup === "join" ? "Meet your other half." : "Open a new case."
            }
            onClose={() => setSetup(null)}
          >
            <p className="muted">
              {setup === "join"
                ? "Enter the six-character code your partner shared."
                : `${caseItem?.title} · ${solo ? "Solo rehearsal: switch roles to explore both perspectives." : "Your partner will join the other investigation role."}`}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enter();
              }}
            >
              {accessRequired && (
                <label>
                  Private test access code
                  <input
                    required
                    type="password"
                    autoComplete="off"
                    value={accessCode}
                    maxLength={128}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="The invitation code shared by your host"
                  />
                </label>
              )}
              <label>
                Your name
                <input
                  value={name}
                  maxLength={32}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  autoComplete="nickname"
                />
              </label>
              {setup === "join" ? (
                <label>
                  Room code
                  <input
                    className="code-input"
                    required
                    minLength={6}
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                  />
                </label>
              ) : (
                <>
                  <label>
                    Your perspective
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {Object.entries(caseItem?.roles || {}).map(([key, r]) => (
                        <option key={key} value={key}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={timed}
                      onChange={(e) => setTimed(e.target.checked)}
                    />
                    <span>
                      Investigation countdown
                      <small>
                        Can be paused. You may continue in overtime.
                      </small>
                    </span>
                  </label>
                </>
              )}
              <label>
                Your language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {Object.entries(LANGS).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                      {id === "en" ? " · authored original" : " · experimental"}
                    </option>
                  ))}
                </select>
              </label>
              <p className="smallprint">
                English story text is authored. Other languages use on-demand
                Gemini translations when configured; they have not been
                human-reviewed.
              </p>
              <button
                className="primary full"
                disabled={busy || (!caseItem && setup === "create")}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}{" "}
                {setup === "join"
                  ? "Join investigation"
                  : "Create investigation"}
              </button>
            </form>
          </Modal>
        )}
        {how && (
          <Modal title="You’re better together." onClose={() => setHow(false)}>
            <ol className="how-list">
              <li>
                <strong>Choose a case and a perspective.</strong>
                <p>
                  Invite your partner with a room code. They get the other role.
                </p>
              </li>
              <li>
                <strong>Investigate separately. Think together.</strong>
                <p>
                  Inspect leads, question witnesses and explicitly share useful
                  evidence.
                </p>
              </li>
              <li>
                <strong>Agree on a reconstruction.</strong>
                <p>
                  Attach at least three shared clues. Both players approve the
                  final theory.
                </p>
              </li>
            </ol>
            <div className="paper-note">
              Use your usual voice call to talk to your partner. The in-game
              microphone speaks to witnesses, not to your friend. Text play
              works without API keys.
            </div>
          </Modal>
        )}
      </>
    );

  const activeLocation = room.locations.find((l) => l.id === locationId);
  const progress = room.shared_count / room.total_evidence;
  const elapsed =
    room.timer.elapsed +
    (room.status === "playing" ? Math.max(0, (now - syncAt) / 1000) : 0);
  const remaining = room.timer.enabled ? room.timer.limit - elapsed : elapsed;
  const timeLabel = `${remaining < 0 ? "+" : ""}${String(Math.floor(Math.abs(remaining) / 60)).padStart(2, "0")}:${String(Math.floor(Math.abs(remaining) % 60)).padStart(2, "0")}`;
  const currentWitness = witness
    ? room.characters.find((c) => c.id === witness.id)
    : undefined;
  const shownClue = clue
    ? room.evidence.find((e) => e.id === clue.id) || clue
    : null;
  return (
    <div className={"game " + (room.status === "paused" ? "game-paused" : "")}>
      <header className="game-header">
        <button
          className="brand-button"
          onClick={() => setModal("brief")}
          aria-label="Open case briefing"
        >
          <Mark small />
        </button>
        <div className="game-title">
          <span className="eyebrow">CASE {room.case.number}</span>
          <strong>{room.case.title}</strong>
        </div>
        <div className="game-header-right">
          <button
            className={"sound-toggle " + (soundOn ? "enabled" : "")}
            onClick={() => {
              if (soundOn) {
                setSoundOn(false);
                audio.current?.pause();
                setSpeaking(false);
              } else void enableSound();
            }}
            aria-pressed={soundOn}
          >
            {soundOn ? "♫ Sound on" : "♫ Enable sound"}
          </button>
          <span className={"connection " + (connected ? "online" : "")}>
            <i />
            {connected ? "Live room" : "Reconnecting"}
          </span>
          <button
            className="room-code"
            onClick={() => {
              navigator.clipboard
                ?.writeText(room.code)
                .then(() => setToast("Room code copied."))
                .catch(() => setToast("Room code: " + room.code));
            }}
          >
            {room.code}
            <Copy size={13} />
          </button>
          <button
            className="icon"
            onClick={() => setModal("settings")}
            aria-label="Settings and language"
          >
            <Compass size={21} />
          </button>
        </div>
      </header>
      {error && (
        <div className="inline-error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button
            className="icon"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}
      {opening && room.status === "playing" && (
        <Opening
          blue={room.case.id === "blue-carbuncle"}
          title={room.case.title}
          onClose={() => setOpening(false)}
          onBegin={(sound) => {
            if (sound) void enableSound();
            else setSoundOn(false);
            setOpening(false);
          }}
        />
      )}
      {room.status === "lobby" ? (
        <main className="lobby">
          <div className="lobby-cover">
            <SceneArt blue={room.case.id === "blue-carbuncle"} />
            <span className="eyebrow">CASE FILE / {room.case.number}</span>
            <h1>{room.case.title}</h1>
          </div>
          <div className="lobby-content">
            <span className="eyebrow">BEFORE WE BEGIN</span>
            <h2>
              {room.solo
                ? "Take both perspectives."
                : "Your investigation starts with two."}
            </h2>
            <p>{room.case.brief}</p>
            <div className="player-list">
              {["field", "archive"].map((r) => {
                const p = room.players.find((p) => p.role === r);
                return (
                  <div className="player-card" key={r}>
                    <span className="role-symbol">
                      {r === "field" ? <Search /> : <Radio />}
                    </span>
                    <div>
                      <span className="eyebrow">{room.case.roles[r].name}</span>
                      <strong>
                        {p
                          ? p.name
                          : room.solo
                            ? "Available when you switch roles"
                            : "Waiting for your partner…"}
                        {p?.id === room.you.id && " (you)"}
                      </strong>
                      <small>
                        {p ? LANGS[p.language] : room.case.roles[r].subtitle}
                      </small>
                    </div>
                    {p &&
                      (p.ready ? (
                        <CheckCircle2 className="ready" size={23} />
                      ) : (
                        <Circle size={23} />
                      ))}
                  </div>
                );
              })}
            </div>
            <div className="paper-note">
              <Headphones size={19} />
              <span>
                Keep your usual call open to talk to your partner. In-game voice
                is for witness questions.{" "}
                {room.solo &&
                  "Solo rehearsal lets you switch roles; it is not a simulated teammate."}
              </span>
            </div>
            <div className="lobby-buttons">
              <button
                className={room.you.ready ? "secondary" : "primary"}
                disabled={busy}
                onClick={() => act("ready")}
              >
                {room.you.ready ? (
                  <Check size={18} />
                ) : (
                  <Fingerprint size={18} />
                )}{" "}
                {room.you.ready ? "Ready — click to undo" : "I’m ready"}
              </button>
              <button
                className="primary"
                disabled={
                  busy ||
                  !room.players.every((p) => p.ready) ||
                  (!room.solo && room.players.length < 2)
                }
                onClick={() => act("start")}
              >
                Begin case <ArrowRight size={18} />
              </button>
            </div>
            <p className="smallprint">
              {room.timer.enabled
                ? `${room.case.duration}-minute countdown · pause anytime · continue in overtime`
                : "Untimed investigation"}{" "}
              · Fictional story
            </p>
          </div>
        </main>
      ) : room.status === "completed" ? (
        <main className="ending">
          <span className="eyebrow">CASE FILE {room.case.number} / CLOSED</span>
          <h1>
            {room.result?.success
              ? "Case solved.\nBetter together."
              : "Every clue has a place."}
          </h1>
          <p className="ending-intro">
            {room.result?.success
              ? "Your reconstruction connected the people, the method and the evidence."
              : "Your theory is recorded. Here is how the evidence fits together."}
          </p>
          <div className="ending-grid">
            <section>
              <h2>What really happened</h2>
              <p>{room.result?.reveal}</p>
              {room.result && soundControls(room.result.reveal)}
              <div className="checks">
                {room.result?.checks.map((c) => (
                  <div key={c.label}>
                    {c.correct ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={18} />
                    )}
                    <span>{c.label}</span>
                    <small>
                      {c.correct ? "Established" : "Revisit this conclusion"}
                    </small>
                  </div>
                ))}
                <div>
                  {room.result?.supported ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                  <span>Evidence supports the reconstruction</span>
                </div>
              </div>
              <h3>Decisive evidence</h3>
              {room.result?.required_evidence.map((e) => (
                <p className="decisive" key={e.id}>
                  <strong>{e.title}</strong>
                  <br />
                  {e.text}
                </p>
              ))}
            </section>
            <aside>
              <span className="eyebrow">THE COMPLETE TIMELINE</span>
              {room.result?.timeline.map(([time, text]) => (
                <div className="timeline-event" key={time}>
                  <span>{time}</span>
                  <p>{text}</p>
                </div>
              ))}
              <div className="ending-time">
                <Clock3 size={17} /> {Math.floor(elapsed / 60)} minutes
                investigating together
              </div>
            </aside>
          </div>
          <div className="ending-credit">
            {room.case.credit}
            {room.case.source && (
              <a href={room.case.source} target="_blank" rel="noreferrer">
                Read the original source <ArrowUpRight size={14} />
              </a>
            )}
          </div>
          <button className="primary" onClick={leave}>
            Back to the casebook <ArrowRight size={18} />
          </button>
        </main>
      ) : (
        <>
          <div className="investigation-layout">
            <aside className="location-rail">
              <div className="role-heading">
                <span className="eyebrow">YOUR PERSPECTIVE</span>
                <h3>{room.case.roles[room.you.role].name}</h3>
                <p>{room.case.roles[room.you.role].subtitle}</p>
                {room.solo && (
                  <button
                    className="mobile-role-switch icon"
                    disabled={busy || room.status !== "playing"}
                    onClick={() => {
                      act("switch");
                      setWitness(null);
                    }}
                    aria-label="Switch perspective"
                    title="Switch perspective"
                  >
                    <RefreshCw size={18} />
                  </button>
                )}
              </div>
              <span className="eyebrow rail-label">LOCATIONS</span>
              <nav aria-label="Investigation locations">
                {room.locations.map((l, i) => (
                  <button
                    key={l.id}
                    disabled={l.locked || room.status === "paused"}
                    className={locationId === l.id ? "active" : ""}
                    onClick={() => {
                      setLocationId(l.id);
                      setWitness(null);
                    }}
                  >
                    <span className="location-number">0{i + 1}</span>
                    <span>
                      {l.name}
                      <small>
                        {l.locked
                          ? "Follow a shared lead"
                          : "Available to explore"}
                      </small>
                    </span>
                    {!l.locked && <ChevronRight size={15} />}
                  </button>
                ))}
              </nav>
              <div className="rail-bottom">
                <Fingerprint size={34} />
                <p>
                  Look closely.
                  <br />
                  Someone else has the other half.
                </p>
                {room.solo && (
                  <button
                    className="text-button"
                    disabled={busy || room.status !== "playing"}
                    onClick={() => {
                      act("switch");
                      setWitness(null);
                    }}
                  >
                    Switch perspective <RefreshCw size={14} />
                  </button>
                )}
              </div>
            </aside>
            <main className="scene-column">
              <div className="scene-topline">
                <span>
                  <MapPin size={14} /> {activeLocation?.name}
                </span>
                <span className="eyebrow">
                  {room.solo ? "SOLO REHEARSAL" : "COOPERATIVE INVESTIGATION"}
                </span>
              </div>
              <div className="scene-picture" key={locationId}>
                <div className="scene-chapter">
                  CHAPTER{" "}
                  {Math.max(
                    1,
                    room.locations.findIndex((l) => l.id === locationId) + 1,
                  )}{" "}
                  · EXPLORE THE SCENE
                </div>
                <LocationArt
                  id={locationId}
                  blue={room.case.id === "blue-carbuncle"}
                />
                <div className="scene-vignette" />
                <div className="scene-title">
                  <span className="eyebrow">{room.case.eyebrow}</span>
                  <h1>{activeLocation?.name}</h1>
                  <p>{activeLocation?.description}</p>
                </div>
                <div
                  className="scene-hotspots"
                  aria-label="Things to investigate in this scene"
                >
                  {room.objects
                    .filter((o) => o.location === locationId)
                    .map((o, i) => (
                      <button
                        key={o.id}
                        className={
                          "scene-hotspot hotspot-" +
                          i +
                          (o.discovered ? " discovered" : "")
                        }
                        disabled={busy || room.status !== "playing"}
                        onClick={() =>
                          o.discovered
                            ? setClue(
                                room.evidence.find((e) => e.id === o.id) ||
                                  null,
                              )
                            : inspect(o.id)
                        }
                      >
                        <span>
                          {o.discovered ? (
                            <Check size={22} />
                          ) : o.kind === "audio" ? (
                            <Radio size={24} />
                          ) : (
                            <Search size={24} />
                          )}
                        </span>
                        <strong>{o.title}</strong>
                        <small>
                          {o.discovered ? "Review clue" : "Investigate"}
                        </small>
                      </button>
                    ))}
                </div>
                <div className="scene-cast">
                  {room.characters
                    .filter((c) => c.location === locationId)
                    .map((c) => (
                      <button
                        key={c.id}
                        className="scene-person"
                        disabled={room.status !== "playing"}
                        onClick={() => {
                          soundEngine.current?.cue("tap");
                          setWitness(c);
                          setDialogue(c.initial);
                          setAnswerSource("authored");
                          setQuestion("");
                        }}
                      >
                        <GameCharacter id={c.id} />
                        <span>
                          {c.name}
                          <small>Tap to talk</small>
                        </span>
                      </button>
                    ))}
                </div>
                <span className="scene-label">
                  {soundOn
                    ? "♫ ATMOSPHERE ON"
                    : "ENABLE SOUND FOR THE FULL EXPERIENCE"}
                </span>
              </div>
              <section className="leads">
                <div className="leads-heading">
                  <span className="eyebrow">LOOK A LITTLE CLOSER</span>
                  <span>
                    {
                      room.objects.filter((o) => o.location === locationId)
                        .length
                    }{" "}
                    leads
                  </span>
                </div>
                <div className="lead-grid">
                  {room.objects
                    .filter((o) => o.location === locationId)
                    .map((o, i) => (
                      <button
                        className={"lead-card " + (o.discovered ? "found" : "")}
                        key={o.id}
                        disabled={busy || room.status !== "playing"}
                        onClick={() =>
                          o.discovered
                            ? setClue(
                                room.evidence.find((e) => e.id === o.id) ||
                                  null,
                              )
                            : inspect(o.id)
                        }
                      >
                        <span className="lead-illustration">
                          {o.kind === "audio" ? (
                            <Radio size={29} />
                          ) : o.kind === "object" ? (
                            <Fingerprint size={29} />
                          ) : o.kind === "testimony" ? (
                            <Users size={29} />
                          ) : (
                            <FileText size={29} />
                          )}
                        </span>
                        <span>
                          <small>
                            {o.kind.toUpperCase()} / 0{i + 1}
                          </small>
                          <strong>{o.title}</strong>
                          <em>
                            {o.discovered
                              ? "Open your discovery"
                              : "Inspect this lead"}{" "}
                            <ArrowUpRight size={13} />
                          </em>
                        </span>
                        {o.discovered && (
                          <Check className="lead-check" size={15} />
                        )}
                      </button>
                    ))}
                </div>
              </section>
              <section className="witnesses">
                <span className="eyebrow">PEOPLE HERE</span>
                <div className="witness-grid">
                  {room.characters
                    .filter((c) => c.location === locationId)
                    .map((c) => (
                      <button
                        className="witness-card"
                        key={c.id}
                        disabled={room.status !== "playing"}
                        onClick={() => {
                          setWitness(c);
                          setDialogue(c.initial);
                          setAnswerSource("authored");
                          setQuestion("");
                        }}
                      >
                        <Portrait id={c.id} />
                        <span>
                          <strong>{c.name}</strong>
                          <small>{c.occupation}</small>
                          <em>
                            Start a conversation <ArrowRight size={14} />
                          </em>
                        </span>
                      </button>
                    ))}
                  {!room.characters.some((c) => c.location === locationId) && (
                    <p className="muted small">
                      Some answers are in the evidence. Inspect the available
                      leads, then compare notes with your partner.
                    </p>
                  )}
                </div>
              </section>
            </main>
            <aside className="case-sidebar">
              <div className="clock-box">
                <span className="eyebrow">
                  {room.timer.enabled
                    ? remaining < 0
                      ? "OVERTIME · KEEP INVESTIGATING"
                      : "INVESTIGATION CLOCK"
                    : "TIME INVESTIGATING"}
                </span>
                <div className="clock-value">
                  <span>{timeLabel}</span>
                  <button
                    className="icon"
                    onClick={() => act("pause")}
                    disabled={busy}
                    aria-label={
                      room.status === "paused"
                        ? "Resume investigation"
                        : "Pause investigation"
                    }
                  >
                    {room.status === "paused" ? (
                      <Play size={20} />
                    ) : (
                      <Pause size={20} />
                    )}
                  </button>
                </div>
                <p>
                  {room.status === "paused"
                    ? "Paused for both investigators."
                    : room.timer.enabled
                      ? "A little urgency. No abrupt endings."
                      : "Take the time the case needs."}
                </p>
              </div>
              <section className="sidebar-section">
                <span className="eyebrow">THE QUESTION</span>
                <h3>
                  {room.case.id === "last-announcement"
                    ? "Who borrowed the truth?"
                    : "How did a jewel become dinner?"}
                </h3>
                <p>
                  {room.case.id === "last-announcement"
                    ? "Trace the announcement. Find Arun. Explain the missing consignment."
                    : "Follow the bird. Connect the hotel theft. Test the accusation."}
                </p>
                <button
                  className="text-button"
                  onClick={() => setModal("brief")}
                >
                  Read case briefing <ArrowUpRight size={14} />
                </button>
              </section>
              <section className="sidebar-section">
                <div className="sidebar-label">
                  <span className="eyebrow">SHARED EVIDENCE</span>
                  <strong>
                    {room.shared_count}
                    <small>/{room.total_evidence}</small>
                  </strong>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${progress * 100}%` }} />
                </div>
                <p>
                  Your private discoveries stay private until you share them.
                </p>
                <button
                  className="secondary full"
                  onClick={() => setModal("board")}
                >
                  <Link2 size={16} /> Open evidence board
                </button>
              </section>
              <section className="sidebar-section partner-section">
                <span className="eyebrow">YOUR OTHER PERSPECTIVE</span>
                {room.players
                  .filter((p) => p.id !== room.you.id)
                  .map((p) => (
                    <div className="partner" key={p.id}>
                      <span
                        className={"avatar " + (p.connected ? "online" : "")}
                      >
                        {p.name[0]}
                      </span>
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.connected ? "Connected" : "Not connected"} ·{" "}
                          {LANGS[p.language]}
                        </small>
                      </span>
                    </div>
                  ))}
                {room.solo && (
                  <p>
                    Solo rehearsal. Switch perspectives to inspect the other
                    half.
                  </p>
                )}
                <div className="activity" aria-live="polite">
                  {room.events
                    .slice(-3)
                    .reverse()
                    .map((e) => (
                      <p key={e.id}>
                        <span />
                        {e.text}
                      </p>
                    ))}
                </div>
              </section>
              <button
                className="text-button hint-button"
                disabled={busy || room.status !== "playing"}
                onClick={() => act("hint")}
              >
                <Lightbulb size={16} /> A nudge, not the answer
              </button>
              {room.hint && (
                <div className="hint">
                  <p>{room.hint}</p>
                  {soundControls(room.hint)}
                </div>
              )}
            </aside>
          </div>
          <footer className="game-toolbar">
            <span>
              <i className="status-dot" />
              {room.status === "paused"
                ? "INVESTIGATION PAUSED"
                : "THE CASE IS OPEN"}
              <small> · {LANGS[room.you.language]}</small>
            </span>
            <div>
              <button onClick={() => setModal("board")}>
                <NotebookPen size={17} /> Evidence & notes{" "}
                <span>{room.evidence.length}</span>
              </button>
              <button
                className="theory-button"
                disabled={room.status !== "playing"}
                onClick={() => setModal("theory")}
              >
                <Fingerprint size={17} />{" "}
                {room.proposal
                  ? "Review reconstruction"
                  : "Build your reconstruction"}
                <ArrowRight size={16} />
              </button>
            </div>
          </footer>
          {room.status === "paused" && (
            <div className="pause-banner" role="status">
              <Pause size={18} /> The investigation is paused for both players.
              <button onClick={() => act("pause")} disabled={busy}>
                Resume <Play size={14} />
              </button>
            </div>
          )}
        </>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      {shownClue && (
        <Modal title={shownClue.title} onClose={() => setClue(null)}>
          <div className="document-meta">
            <span>{shownClue.kind.toUpperCase()}</span>
            <span>EVIDENCE / {shownClue.id.toUpperCase()}</span>
          </div>
          <div className="evidence-paper">
            <span className="paper-stamp">
              DO DUNIYA / CASE {room.case.number}
            </span>
            <p>{shownClue.text}</p>
          </div>
          {soundControls(shownClue.text)}
          {translation && (
            <div className="translation" lang={room.you.language}>
              <small>GEMINI TRANSLATION · UNREVIEWED</small>
              <p>{translation}</p>
            </div>
          )}
          <button
            className={"full " + (shownClue.shared ? "secondary" : "primary")}
            disabled={busy || shownClue.shared || room.status !== "playing"}
            onClick={async () => {
              await act("share", { target: shownClue.id });
              setToast("Evidence shared with your partner.");
            }}
          >
            {shownClue.shared ? <Check size={17} /> : <Send size={17} />}{" "}
            {shownClue.shared
              ? "On your shared board"
              : "Share with your partner"}
          </button>
          <p className="smallprint">
            Sharing makes this clue visible to both investigators.
          </p>
        </Modal>
      )}
      {witness && currentWitness && (
        <Modal
          title={currentWitness.name}
          onClose={() => {
            cancelRecording();
            setWitness(null);
          }}
        >
          <div className="conversation-person">
            <GameCharacter id={currentWitness.id} talking={speaking} />
            <div>
              <span className="eyebrow">{currentWitness.occupation}</span>
              <p>Ask about a lead. Present evidence when you have it.</p>
            </div>
          </div>
          <div className="speech-bubble" key={dialogue}>
            <span className="speaker-name">{currentWitness.name}</span>
            <blockquote className="dialogue">{dialogue}</blockquote>
            <div className={"voice-wave " + (speaking ? "active" : "")}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <i key={i} />
              ))}
              <small>
                {voiceBusy
                  ? "Preparing their reply…"
                  : speaking
                    ? "Speaking…"
                    : soundOn
                      ? "Voice plays automatically"
                      : "Subtitles · sound is off"}
              </small>
            </div>
          </div>
          <div className="dialogue-source">
            {answerSource === "authored"
              ? "AUTHORED STORY DIALOGUE"
              : "GEMINI TOPIC INTERPRETATION · AUTHORED ANSWER"}
          </div>
          {!soundOn && (
            <button className="primary full" onClick={() => void enableSound()}>
              <Headphones size={18} /> Enable automatic character voices
            </button>
          )}
          {autoVoiceBlocked && (
            <p className="smallprint">
              Your browser or voice service paused playback. Replay below;
              subtitles remain available.
            </p>
          )}
          {soundControls(dialogue, currentWitness.id)}
          {translation && (
            <div className="translation" lang={room.you.language}>
              <small>GEMINI TRANSLATION · UNREVIEWED</small>
              <p>{translation}</p>
            </div>
          )}
          <div className="topics">
            {currentWitness.topics.map((t) => (
              <button
                disabled={busy || room.status !== "playing"}
                key={t.id}
                onClick={() => ask(t.id)}
              >
                {t.label}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
          <form
            className="question-form"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <label htmlFor="question">
              Ask in your own words{" "}
              <small>Gemini interprets your question</small>
            </label>
            <div>
              <input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                placeholder={
                  room.providers.gemini
                    ? "What would you like to ask?"
                    : "Configure Gemini to ask freely; topics above work now."
                }
              />
              <button
                type="button"
                className={"icon mic " + (recording ? "recording" : "")}
                disabled={
                  voiceBusy ||
                  !room.providers.prisma ||
                  room.status !== "playing"
                }
                onClick={record}
                aria-label={
                  recording ? "Stop recording" : "Record a question with Prisma"
                }
              >
                {recording ? <Square size={18} /> : <Mic size={18} />}
              </button>
              <button
                className="icon send"
                disabled={
                  busy ||
                  voiceBusy ||
                  !question.trim() ||
                  !room.providers.gemini ||
                  room.status !== "playing"
                }
                aria-label="Ask witness"
              >
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            {recording && (
              <span className="record-label">
                Recording {recordSeconds}s / 20s · click stop to transcribe
              </span>
            )}
            <p className="smallprint">
              Review a voice transcript before sending. Unrelated questions
              won’t invent new story facts.
            </p>
          </form>
        </Modal>
      )}
      {modal === "brief" && (
        <Modal title={room.case.title} onClose={() => setModal(null)}>
          <span className="eyebrow">{room.case.eyebrow}</span>
          <p className="brief-body">{room.case.brief}</p>
          {soundControls(room.case.brief)}
          {translation && (
            <div className="translation" lang={room.you.language}>
              <small>UNREVIEWED GEMINI TRANSLATION</small>
              <p>{translation}</p>
            </div>
          )}
          <div className="paper-note">
            Your perspective:{" "}
            <strong>{room.case.roles[room.you.role].name}</strong>. Discover,
            share, compare, then reconstruct the events together.
          </div>
          <p className="smallprint">{room.case.credit}</p>
          {room.case.source && (
            <a
              href={room.case.source}
              target="_blank"
              rel="noreferrer"
              className="text-button"
            >
              Original source · contains spoilers <ArrowUpRight size={14} />
            </a>
          )}
        </Modal>
      )}
      {modal === "settings" && (
        <Modal
          title="Your investigation settings."
          onClose={() => setModal(null)}
        >
          <label>
            Story language
            <select
              value={room.you.language}
              onChange={(e) => act("language", { target: e.target.value })}
            >
              {Object.entries(LANGS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                  {id === "en" ? " · original" : " · experimental"}
                </option>
              ))}
            </select>
          </label>
          <p className="smallprint">
            Use “Read in…” on a passage for on-demand translation. Original
            English remains visible. Interface labels are currently English.
          </p>
          <div className="provider-list">
            {Object.entries(room.providers).map(([id, enabled]) => (
              <div key={id}>
                <span>
                  {id === "gemini"
                    ? "Gemini · question interpretation"
                    : id === "prisma"
                      ? "Prisma · speech recognition"
                      : "Timbre · spoken performance"}
                </span>
                <small>
                  {enabled
                    ? "Key configured · not quality-verified"
                    : "Not configured"}
                </small>
              </div>
            ))}
          </div>
          <div className="paper-note">
            Keys belong in the server’s .env file. Text topics and the entire
            mystery work without provider calls. Built-in partner calling is not
            included; use your usual call.
          </div>
          <button className="secondary full" onClick={leave}>
            <LogOut size={16} /> Leave this device’s session
          </button>
          <p className="smallprint">
            Leaving clears your local pass. Keep this tab open if you want to
            reconnect as the same player.
          </p>
        </Modal>
      )}
      {modal === "board" && (
        <Modal
          wide
          title="The evidence between you."
          onClose={() => setModal(null)}
        >
          <p className="muted">
            Private discoveries are marked. Share what your partner needs; no
            theory is automatically declared true.
          </p>
          <div className="board-grid">
            {room.evidence.map((e) => (
              <button
                className={"board-card " + (e.shared ? "shared" : "")}
                key={e.id}
                onClick={() => {
                  setModal(null);
                  setClue(e);
                }}
              >
                <span className="eyebrow">
                  {e.shared ? "SHARED EVIDENCE" : "YOUR PRIVATE DISCOVERY"}
                </span>
                <h3>{e.title}</h3>
                <p>{e.text}</p>
                <span>
                  {e.shared ? <Link2 size={14} /> : <Fingerprint size={14} />}{" "}
                  {e.shared ? "Both perspectives" : "Only you can see this"}{" "}
                  <ArrowUpRight size={14} />
                </span>
              </button>
            ))}
            {!room.evidence.length && (
              <div className="empty-state">
                <Search size={32} />
                <h3>Start by looking closely.</h3>
                <p>
                  Inspect a lead in your current location. It will appear here.
                </p>
              </div>
            )}
          </div>
          <section className="notes-section">
            <h3>Working theories</h3>
            <p className="smallprint">
              These are your notes, not confirmed facts.
            </p>
            {room.notes.map((n) => (
              <div className="note" key={n.id}>
                <span className="eyebrow">{n.author}</span>
                <p>{n.text}</p>
              </div>
            ))}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await act("note", { text: note });
                if (r) setNote("");
              }}
            >
              <label htmlFor="note">Add a shared theory</label>
              <textarea
                id="note"
                maxLength={1200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What connects these discoveries?"
              />
              <button
                className="secondary"
                disabled={busy || !note.trim() || room.status !== "playing"}
              >
                <Send size={15} /> Add note
              </button>
            </form>
          </section>
        </Modal>
      )}
      {modal === "theory" && (
        <Modal
          wide
          title={
            room.proposal
              ? "A theory needs two signatures."
              : "What really happened?"
          }
          onClose={() => setModal(null)}
        >
          {room.proposal ? (
            <>
              <p className="muted">
                Proposed by {room.proposal.by}. Review the claims and evidence
                before agreeing. Agreement closes the case and reveals the
                solution.
              </p>
              <div className="proposal-paper">
                <h3>
                  {
                    room.suspects.find(
                      (s) => s.id === room.proposal?.answers.culprit,
                    )?.name
                  }
                </h3>
                {room.questions.map((q) => (
                  <p key={q.id}>
                    <strong>{q.label}</strong>
                    <br />
                    {
                      q.options.find(
                        (o) => o.id === room.proposal?.answers[q.id],
                      )?.label
                    }
                  </p>
                ))}
                <p>{room.proposal.explanation}</p>
                <div className="evidence-tags">
                  {room.proposal.evidence.map((id) => (
                    <span key={id}>
                      {room.evidence.find((e) => e.id === id)?.title}
                    </span>
                  ))}
                </div>
              </div>
              <div className="lobby-buttons">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => act("withdraw")}
                >
                  Return to the investigation
                </button>
                <button
                  className="primary"
                  disabled={
                    busy || room.proposal.approved.includes(room.you.id)
                  }
                  onClick={async () => {
                    const r = await act("approve");
                    if (r?.status === "completed") setModal(null);
                  }}
                >
                  {room.proposal.approved.includes(room.you.id)
                    ? "Waiting for your partner"
                    : "Agree & reveal the truth"}
                  <Check size={17} />
                </button>
              </div>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await act("propose", {
                  answers,
                  evidence: chosen,
                  text: explanation,
                });
                if (r?.status === "completed") setModal(null);
              }}
            >
              <p className="muted">
                Build a complete explanation and attach at least three shared
                clues. Your partner must agree before the reveal.
              </p>
              <label>
                Who is responsible?
                <select
                  required
                  value={answers.culprit || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, culprit: e.target.value })
                  }
                >
                  <option value="">Choose a person</option>
                  {room.suspects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {room.questions.map((q) => (
                <label key={q.id}>
                  {q.label}
                  <select
                    required
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  >
                    <option value="">Choose your explanation</option>
                    {q.options.map((o) => (
                      <option value={o.id} key={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label>
                Your reasoning
                <textarea
                  value={explanation}
                  maxLength={1200}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain how the evidence fits together…"
                />
              </label>
              <fieldset>
                <legend>Supporting evidence · choose at least three</legend>
                <div className="evidence-choices">
                  {room.evidence
                    .filter((e) => e.shared)
                    .map((e) => (
                      <label className="check-label" key={e.id}>
                        <input
                          type="checkbox"
                          checked={chosen.includes(e.id)}
                          onChange={() =>
                            setChosen(
                              chosen.includes(e.id)
                                ? chosen.filter((id) => id !== e.id)
                                : [...chosen, e.id],
                            )
                          }
                        />
                        <span>{e.title}</span>
                      </label>
                    ))}
                </div>
                {room.shared_count < 3 && (
                  <p className="smallprint">
                    Share more discoveries before submitting a theory.
                  </p>
                )}
              </fieldset>
              <button
                className="primary full"
                disabled={busy || chosen.length < 3}
              >
                Submit for {room.solo ? "the reveal" : "your partner’s review"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
async function toWav(blob: Blob) {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > 22)
      throw new Error("Please keep recordings under 20 seconds.");
    const target = 16000;
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * target),
      target,
    );
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const result = await offline.startRendering();
    const samples = result.getChannelData(0);
    const bytes = new ArrayBuffer(44 + samples.length * 2),
      view = new DataView(bytes);
    const str = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++)
        view.setUint8(offset + i, s.charCodeAt(i));
    };
    str(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    str(8, "WAVE");
    str(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, target, true);
    view.setUint32(28, target * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++)
      view.setInt16(
        44 + i * 2,
        Math.max(-1, Math.min(1, samples[i])) *
          (samples[i] < 0 ? 32768 : 32767),
        true,
      );
    return new Blob([bytes], { type: "audio/wav" });
  } finally {
    await context.close();
  }
}
createRoot(document.getElementById("root")!).render(<App />);
