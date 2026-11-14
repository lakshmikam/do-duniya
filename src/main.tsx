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
import "./theme.css";
import { World, GameCharacter } from "./game/World";
import { CharacterPortrait } from "./game/CharacterPortrait";
import { Opening } from "./game/Opening";
import { GameSound } from "./game/sound";
import { VoiceChat } from "./game/VoiceChat";
import { waitForServer } from "./game/serverReady";
import { speechWav } from "./game/voiceCapture";
import { PartnerLink } from "./game/PartnerLink";
import { InvestigationScene } from "./game/InvestigationScene";
import type { RadioPacket } from "./game/PartnerRadio";

import { CaseNotebook } from "./game/CaseNotebook";
import { WitnessChallenge, type Statement } from "./game/WitnessChallenge";

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
  emotion?: string;
  demeanor?: string;
  stage?: number;
  clamped?: boolean;
  voice_profile?: { voice: string; tone: string };
  id: string;
  name: string;
  occupation: string;
  location: string;
  initial: string;
  topics: { id: string; label: string }[];
};
type Room = {
  statements?: Statement[];
  story_banner?: string;
  epilogue?: {
    question: string;
    options: { id: string; label: string }[];
    your_choice?: string;
    votes: { name: string; choice?: string }[];
    agreed: boolean;
    text?: string;
    closing?: string;
  };
  objective?: {
    phase: string;
    text: string;
    chapter: number;
    chapter_title: string;
    team_question: string;
    partner_task: string;
    communication: string;
    ready: boolean;
    action: {
      kind: string;
      label: string;
      topic?: string;
      target?: string;
      location?: string;
      evidence_id?: string;
    };
    source_ids: string[];
  };
  code: string;
  can_solve: boolean;
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
    radio?: boolean;
    radio_talking?: boolean;
    scene?: string;
    interviewing?: string;
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
  cooperation?: { service_gate?: boolean; store_latch?: boolean };
  scene_audio?: {
    id: string;
    location: string;
    title: string;
    text: string;
    caption: string;
  }[];
  messages?: {
    comment?: string;
    prompt?: string;
    id: string;
    author: string;
    author_id: string;
    text: string;
    kind: string;
    evidence_id?: string;
    time: number;
  }[];
  coach_hints?: { id: string; text: string; by?: string }[];
  hints_remaining?: number;
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
function Modal({
  title,
  children,
  onClose,
  wide = false,
  variant = "",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  variant?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const nodes = [
          ...Array.from(
            ref.current.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input,textarea,select,a[href]",
            ),
          ),
          ...Array.from(
            document.querySelectorAll<HTMLElement>(
              "[data-partner-dock] button:not(:disabled),[data-partner-dock] input:not(:disabled)",
            ),
          ),
        ].filter((n) => n.getClientRects().length > 0);
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
      className={"modal-shade " + variant}
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
const storyTranslations = new Map<string, string>();
function StoryText({
  text,
  room,
  token,
}: {
  text: string;
  room: Room;
  token: string;
}) {
  const key = room.you.language + "|" + text;
  const [translated, setTranslated] = useState<{
    key: string;
    text: string;
  } | null>(null);
  useEffect(() => {
    if (room.you.language === "en" || !room.providers.gemini) return;
    const cached = storyTranslations.get(key);
    if (cached) {
      setTranslated({ key, text: cached });
      return;
    }
    const controller = new AbortController();
    request(`/rooms/${room.code}/translate`, { text }, token, controller.signal)
      .then((d) => {
        if (storyTranslations.size > 200) storyTranslations.clear();
        storyTranslations.set(key, d.text);
        setTranslated({ key, text: d.text });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [key, room.code, room.providers.gemini, token]);
  return (
    <span lang={translated?.key === key ? room.you.language : "en"}>
      {translated?.key === key ? translated.text : text}
    </span>
  );
}
function Mission({ room, token }: { room: Room; token: string }) {
  const o = room.objective!;
  return (
    <details className="chapter-bar">
      <summary>
        <span className="chapter-number">
          {String(o.chapter).padStart(2, "0")} / 03
        </span>
        <strong>{o.chapter_title}</strong>
        <span className="chapter-more">Case details</span>
      </summary>
      <div className="chapter-popover">
        <p>
          <StoryText text={o.team_question} room={room} token={token} />
        </p>
        <p className="muted">
          {room.case.roles[room.you.role].subtitle} Compare your observations
          with your partner’s account.
        </p>
      </div>
    </details>
  );
}

function App() {
  const [waking, setWaking] = useState(false);
  const [cases, setCases] = useState<Case[]>([]),
    [selected, setSelected] = useState(1),
    [room, setRoom] = useState<Room | null>(null),
    [token, setToken] = useState("");
  const [soundOn, setSoundOn] = useState(false),
    [opening, setOpening] = useState(false),
    [openingSeen, setOpeningSeen] = useState("");
  const soundEngine = useRef<GameSound | null>(null),
    clipCache = useRef(new Map<string, Blob>()),
    voiceElement = useRef<HTMLAudioElement | null>(null);
  const [ambienceVolume, setAmbienceVolume] = useState(65);
  const [autoVoiceBlocked, setAutoVoiceBlocked] = useState(false);
  const [voiceChatActive, setVoiceChatActive] = useState(false);
  const [sessionConflict, setSessionConflict] = useState<
      "occupied" | "moved" | null
    >(null),
    [connectionEpoch, setConnectionEpoch] = useState(0);
  const takeOver = useRef(false),
    snapshotFingerprint = useRef("");
  const liveSocket = useRef<WebSocket | null>(null),
    radioReceiver = useRef<((packet: RadioPacket) => void) | null>(null);
  function sendLive(packet: object) {
    const s = liveSocket.current;
    if (!s || s.readyState !== WebSocket.OPEN || s.bufferedAmount > 64000)
      return false;
    s.send(JSON.stringify(packet));
    return true;
  }
  async function enableSound() {
    soundEngine.current ??= new GameSound();
    try {
      await soundEngine.current.unlock();
      soundEngine.current.cue("travel");
      setSoundOn(true);
      setAutoVoiceBlocked(false);
      // Reuse a media element unlocked within this gesture for mobile browsers.
      voiceElement.current ??= new Audio();
      const silentURL = URL.createObjectURL(
        speechWav(new Float32Array(1600), 16000),
      );
      voiceElement.current.src = silentURL;
      await voiceElement.current
        .play()
        .catch(() => {})
        .finally(() => URL.revokeObjectURL(silentURL));
    } catch {
      setToast("Sound could not start. You can still play with subtitles.");
    }
  }

  const [setup, setSetup] = useState<"create" | "join" | null>(null),
    [how, setHow] = useState(false),
    [name, setName] = useState(""),
    [code, setCode] = useState(
      new URLSearchParams(location.search).get("room") || "",
    ),
    [language, setLanguage] = useState("en"),
    [role, setRole] = useState("field"),
    [timed, setTimed] = useState(false),
    [solo, setSolo] = useState(false);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [connected, setConnected] = useState(false),
    [locationId, setLocationId] = useState(""),
    [modal, setModal] = useState<
      "board" | "theory" | "brief" | "settings" | "coach" | null
    >(null),
    [clue, setClue] = useState<Evidence | null>(null),
    [witness, setWitness] = useState<Character | null>(null),
    [dialogue, setDialogue] = useState(""),
    [question, setQuestion] = useState(""),
    [toast, setToast] = useState(""),
    [now, setNow] = useState(Date.now()),
    [syncAt, setSyncAt] = useState(Date.now()),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [explanation, setExplanation] = useState(""),
    [translation, setTranslation] = useState(""),
    [speaking, setSpeaking] = useState(false),
    [recording, setRecording] = useState(false),
    [recordSeconds, setRecordSeconds] = useState(0),
    [voiceBusy, setVoiceBusy] = useState(false);
  const [coachBusy, setCoachBusy] = useState(false),
    [coachReply, setCoachReply] = useState(""),
    [coachQuestion, setCoachQuestion] = useState("");
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
    const fingerprint = JSON.stringify({
      ...r,
      timer: { ...r.timer, elapsed: 0 },
    });
    if (snapshotFingerprint.current === fingerprint) return;
    snapshotFingerprint.current = fingerprint;
    receivedRoom.current = r;
    setRoom(r);
    setSyncAt(Date.now());
    setNow(Date.now());
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
    const initial = new AbortController();
    void waitForServer(() => setWaking(true), initial.signal)
      .then(async () => {
        if (initial.signal.aborted) return;
        setWaking(false);
        const catalog = await request("/cases");
        if (initial.signal.aborted) return;
        setCases(catalog);
        const saved = sessionStorage.getItem("duniya-session");
        if (saved && !invite) {
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
      })
      .catch((e) => {
        if (!initial.signal.aborted) setError(e.message);
      });
    const invite = new URLSearchParams(window.location.search).get("room");
    if (invite && /^[A-Z2-9]{6}$/i.test(invite)) {
      setCode(invite.toUpperCase());
      setSetup("join");
    }
    return () => initial.abort();
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
      liveSocket.current = socket;
      socket.onopen = () => {
        socket?.send(JSON.stringify({ token, take_over: takeOver.current }));
      };
      socket.onmessage = (e) => {
        try {
          const packet = JSON.parse(e.data);
          if (
            packet.type === "session_in_use" ||
            packet.type === "session_moved"
          ) {
            stopped = true;
            setConnected(false);
            setOpening(false);
            setSessionConflict(
              packet.type === "session_moved" ? "moved" : "occupied",
            );
            cancelRecording();
            voiceRequest.current?.abort();
            audio.current?.pause();
            setSpeaking(false);
            if (packet.room) sync(packet.room);
            socket?.close();
            return;
          }
          if (packet.type === "radio" || packet.type === "radio_control")
            radioReceiver.current?.(packet);
          else if (packet.code && packet.you) {
            takeOver.current = false;
            setConnected(true);
            sync(packet);
          }
        } catch {}
      };
      socket.onclose = () => {
        setConnected(false);
        if (!stopped) retry = setTimeout(connect, 2000);
      };
    };
    connect();
    const poll = setInterval(() => {
      if (stopped) return;
      request("/rooms/" + room.code, undefined, token)
        .then(sync)
        .catch(() => {});
    }, 6000);
    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(poll);
      socket?.close();
      liveSocket.current = null;
    };
  }, [room?.code, token, connectionEpoch]);
  useEffect(() => {
    if (room && connected)
      sendLive({
        type: "presence",
        location: locationId,
        character: voiceChatActive || speaking ? witness?.id || "" : "",
      });
  }, [
    room?.code,
    connected,
    locationId,
    voiceChatActive,
    witness?.id,
    speaking,
  ]);
  useEffect(() => {
    const t = setInterval(() => {
      const current = receivedRoom.current;
      if (current?.timer.enabled && current.status === "playing")
        setNow(Date.now());
      if (media.current?.state === "recording")
        setRecordSeconds(Math.floor((Date.now() - recordStart.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!room || room.status !== "playing" || sessionConflict) return;
    const pulse = setInterval(() => {
      void request(`/rooms/${room.code}/pulse`, {}, token)
        .then(sync)
        .catch(() => {});
    }, 15000);
    return () => clearInterval(pulse);
  }, [room?.code, room?.status, token, sessionConflict]);
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
    if (!witness || !room) return;
    const live = room.characters.find((c) => c.id === witness.id);
    if (live) {
      setDialogue(live.initial);
      setTranslation("");
    }
  }, [witness?.id, room?.characters.find((c) => c.id === witness?.id)?.stage]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    viewEpoch.current++;
    voiceRequest.current?.abort();
    setVoiceBusy(false);
    if (!voiceChatActive) setTranslation("");
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
    if (running && connected && !sessionConflict && room.code !== openingSeen) {
      setOpening(true);
      setOpeningSeen(room.code);
    }
  }, [room?.status, room?.code, openingSeen, connected, sessionConflict]);
  useEffect(() => {
    if (!soundEngine.current) return;
    soundEngine.current.setMuted(!soundOn);
    if (soundOn && room?.status === "playing" && !opening)
      soundEngine.current.startAtmosphere(room.case.id === "blue-carbuncle");
    else soundEngine.current.stopAtmosphere();
    return () => soundEngine.current?.stopAtmosphere();
  }, [soundOn, room?.status, room?.case.id, opening]);
  useEffect(() => {
    soundEngine.current?.duck(speaking || voiceChatActive);
  }, [speaking, voiceChatActive]);
  useEffect(() => {
    if (!room || voiceChatActive || room.status !== "playing" || opening)
      return;
    const text = witness ? dialogue : clue?.text || "";
    if (!text) return;
    const t = setTimeout(() => {
      if (soundOn && room.providers.timbre)
        void listen(text, witness?.id || "", true);
      else if (room.you.language !== "en" && room.providers.gemini)
        void translate(text);
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
            })
          : await request("/rooms", {
              case_id: cases[selected].id,
              name: name || "Investigator",
              role,
              language,
              timed,
              solo,
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
    setSessionConflict(null);
    snapshotFingerprint.current = "";
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
      setToast("Added to your notebook.");
    }
  }
  async function ask(topic = "") {
    if (!room || !witness) return;
    const epoch = viewEpoch.current;
    setBusy(true);
    setError("");
    try {
      const data = await request(
        `/rooms/${room.code}/talk`,
        { character: witness.id, topic, question },
        token,
      );
      if (epoch !== viewEpoch.current) return;
      setDialogue(data.text);
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
      if (room.you.language !== "en") {
        const translated = await request(
          `/rooms/${room.code}/translate`,
          { text },
          token,
          controller.signal,
        );
        if (epoch !== viewEpoch.current) return;
        setTranslation(translated.text);
      }
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
            (e as Error).name === "NotAllowedError"
              ? "Tap Replay voice to allow audio in this browser."
              : "Voice unavailable: " + (e as Error).message,
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
  if (waking && !room)
    return (
      <div className="wake-screen" role="status" aria-live="polite">
        <LoaderCircle size={36} className="spin" />
        <h1>Waking the casebook…</h1>
        <p>
          The test server is starting. Your invitation is safe. This can take
          about a minute.
        </p>
      </div>
    );
  const caseItem = cases[selected];
  if (!room)
    return (
      <>
        <div className="landing" data-case={caseItem?.id || "blue-carbuncle"}>
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
                  {caseItem?.id === "blue-carbuncle"
                    ? "A stolen jewel. A missing goose. Two trails that meet in the fog."
                    : "A midnight train. A vanished station master. Your friend has the other half of the story."}
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
                    Create room <ArrowUpRight size={19} />
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
                    <Search size={15} /> Explore
                  </span>
                  <span>
                    <Mic size={15} /> Compare accounts
                  </span>
                  <span>
                    <Fingerprint size={15} /> Solve together
                  </span>
                </div>
                <div className="hero-foot" hidden>
                  <span>
                    <Users size={15} /> 2 investigators
                  </span>
                  <span>
                    <Headphones size={15} /> Your language. Your voice.
                  </span>
                </div>
              </div>
              <div
                aria-label="Selected case illustration"
                className={"hero-art " + (selected === 1 ? "blue" : "")}
              >
                <SceneArt blue={selected === 1} />
                <div className="art-top">
                  <span>CASE FILE / {caseItem?.number || "01"}</span>
                  <Fingerprint size={27} />
                </div>
                <div className="art-bottom" hidden>
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
                  Follow your task and question witnesses. Every clue either
                  player finds appears in both notebooks automatically.
                </p>
              </li>
              <li>
                <strong>Agree on a reconstruction.</strong>
                <p>
                  Choose your answers together. Your notebook is included
                  automatically; both players confirm.
                </p>
              </li>
            </ol>
            <div className="paper-note">
              The game suggests a question to ask your partner. Send it with one
              tap, type your own message, or use the optional radio.
            </div>
          </Modal>
        )}
      </>
    );

  const activeLocation = room.locations.find((l) => l.id === locationId);

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
    <div
      data-case={room.case.id}
      className={"game " + (room.status === "paused" ? "game-paused" : "")}
    >
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
          <span className="role-chip">
            You: {room.you.role === "field" ? "Field" : "Records"}
          </span>
        </div>
        <div className="game-header-right">
          {room.timer.enabled &&
            ["playing", "paused"].includes(room.status) && (
              <button
                className="room-code"
                title={
                  room.status === "paused"
                    ? "Resume the game"
                    : "Pause the game for both players"
                }
                disabled={busy}
                onClick={() => void act("pause")}
              >
                <Clock3 size={14} />
                {timeLabel}
                {room.status === "paused" ? (
                  <Play size={13} />
                ) : (
                  <Pause size={13} />
                )}
              </button>
            )}
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
            aria-label={soundOn ? "Mute sound" : "Enable sound"}
          >
            <Headphones size={18} />
            <span className="sound-label">
              {soundOn ? "Sound on" : "Enable sound"}
            </span>
          </button>
          {soundOn && (
            <label
              className="ambience-control"
              title="Background atmosphere volume"
            >
              <span>Atmosphere</span>
              <input
                aria-label="Background atmosphere volume"
                type="range"
                min="0"
                max="100"
                value={ambienceVolume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAmbienceVolume(v);
                  soundEngine.current?.setVolume(v / 100);
                }}
              />
            </label>
          )}
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
        <button
          className="icon invite-copy"
          title="Copy invitation link"
          aria-label="Copy invitation link"
          onClick={() => {
            const url = new URL(window.location.href);
            url.search = "";
            url.searchParams.set("room", room.code);
            if (!navigator.clipboard) {
              setError("Copy this room code: " + room.code);
              return;
            }
            void navigator.clipboard
              .writeText(url.toString())
              .then(() => setToast("Invitation link copied"))
              .catch(() => setError("Copy this room code: " + room.code));
          }}
        >
          <Link2 size={18} />
        </button>
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
          role={room.you.role}
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
                Once you start, Partner Link gives you live messages and a
                hold-to-talk radio inside the game.{" "}
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
          {room.result?.success && room.epilogue && (
            <section
              className="story-epilogue"
              aria-label="Choose the ending together"
            >
              <span className="eyebrow">ONE LAST DECISION / OPTIONAL</span>
              <h2>{room.epilogue.question}</h2>
              {room.epilogue.agreed ? (
                <>
                  <p>{room.epilogue.text}</p>
                  <blockquote>{room.epilogue.closing}</blockquote>
                </>
              ) : (
                <>
                  <p>
                    The facts are settled. Choose how your report closes the
                    case. Both investigators must agree.
                  </p>
                  <div className="epilogue-options">
                    {room.epilogue.options.map((o) => (
                      <button
                        key={o.id}
                        className={
                          room.epilogue?.your_choice === o.id
                            ? "primary"
                            : "secondary"
                        }
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            sync(
                              await request(
                                `/rooms/${room.code}/epilogue`,
                                { choice: o.id },
                                token,
                              ),
                            );
                          } catch (e) {
                            setError((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {o.label}
                        {room.epilogue?.your_choice === o.id
                          ? " · your choice"
                          : ""}
                      </button>
                    ))}
                  </div>
                  <p className="smallprint">
                    {room.epilogue.votes
                      .map(
                        (v) =>
                          `${v.name}: ${room.epilogue?.options.find((o) => o.id === v.choice)?.label || "considering"}`,
                      )
                      .join(" · ")}
                  </p>
                </>
              )}
            </section>
          )}
          {!room.result?.success && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => void act("reopen")}
            >
              <RefreshCw size={17} />
              Revisit the evidence · keep our discoveries
            </button>
          )}
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
                      {l.locked && <small>Unreached</small>}
                    </span>
                    {!l.locked && <ChevronRight size={15} />}
                  </button>
                ))}
              </nav>
              <div className="rail-tools" aria-label="Investigation tools">
                <button onClick={() => setModal("board")}>
                  <NotebookPen size={17} /> Our notebook{" "}
                  <span
                    key={room.evidence.length}
                    className={
                      room.evidence.length
                        ? "evidence-count new-count"
                        : "evidence-count"
                    }
                  >
                    {room.evidence.length}
                  </span>
                </button>
                <button
                  className="theory-button"
                  disabled={room.status !== "playing" || !room.can_solve}
                  onClick={() => setModal("theory")}
                >
                  <Fingerprint size={17} />{" "}
                  {room.proposal
                    ? "Check your partner’s answers"
                    : room.can_solve
                      ? "Solve the case together"
                      : "Build your case"}
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="rail-status">
                <span>
                  <i className="status-dot" />
                  {room.status === "paused"
                    ? "INVESTIGATION PAUSED"
                    : "THE CASE IS OPEN"}
                  <small> · {LANGS[room.you.language]}</small>
                </span>
              </div>
              <div className="rail-bottom">
                <Fingerprint size={34} />

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
              {room.objective && <Mission room={room} token={token} />}
              <div className="scene-topline">
                <span>
                  <MapPin size={14} /> {activeLocation?.name}
                </span>
                <span className="eyebrow">
                  {room.solo ? "SOLO REHEARSAL" : "COOPERATIVE INVESTIGATION"}
                </span>
              </div>
              <div className="scene-summary">
                <h1>{activeLocation?.name}</h1>
                <details className="location-description">
                  <summary>Look around</summary>
                  <p>
                    {activeLocation && (
                      <StoryText
                        text={activeLocation.description}
                        room={room}
                        token={token}
                      />
                    )}
                  </p>
                </details>
              </div>
              {room.story_banner && (
                <details className="story-dispatch">
                  <summary>Latest dispatch</summary>
                  <p>{room.story_banner}</p>
                  <small>
                    The clock adds atmosphere. Your investigation can continue.
                  </small>
                </details>
              )}
              <InvestigationScene
                key={room.code + "|" + room.you.role + "|" + locationId}
                location={locationId}
                blue={room.case.id === "blue-carbuncle"}
                playerName={
                  room.you.name.charAt(0).toLocaleUpperCase() +
                  room.you.name.slice(1)
                }
                objects={room.objects
                  .filter((o) => o.location === locationId)
                  .map((o) =>
                    o.id === "found" && !o.discovered
                      ? { ...o, title: "Open the store door" }
                      : o,
                  )}
                characters={room.characters.filter(
                  (c) => c.location === locationId,
                )}
                disabled={
                  busy ||
                  !!sessionConflict ||
                  opening ||
                  room.status !== "playing" ||
                  !!(witness || clue || modal)
                }
                onInspect={(id) => {
                  const o = room.objects.find((o) => o.id === id);
                  if (o?.discovered)
                    setClue(room.evidence.find((e) => e.id === id) || null);
                  else void inspect(id);
                }}
                onTalk={(id) => {
                  const c = room.characters.find((c) => c.id === id);
                  if (c) {
                    soundEngine.current?.cue("tap");
                    setWitness(c);
                    setDialogue(c.initial);
                    setQuestion("");
                    const epoch = viewEpoch.current;
                    void request(
                      `/rooms/${room.code}/encounter`,
                      { character: c.id },
                      token,
                    )
                      .then((data) => {
                        if (epoch !== viewEpoch.current) return;
                        sync(data.room);
                      })
                      .catch((e) => setError(e.message));
                  }
                }}
              />
              {room.scene_audio
                ?.filter((a) => a.location === locationId)
                .map((a) => (
                  <details className="earwitness-player" key={a.id}>
                    <summary>
                      <Radio size={16} />
                      {a.title}
                    </summary>
                    <div className="audio-popover">
                      <div>
                        <Radio size={22} />
                        <span>
                          <strong>{a.title}</strong>
                          <small>{a.caption}</small>
                        </span>
                      </div>
                      <button
                        className="secondary"
                        disabled={
                          voiceBusy ||
                          !room.providers.timbre ||
                          room.status !== "playing"
                        }
                        onClick={async () => {
                          if (!soundOn) await enableSound();
                          void listen(a.text, "station_announcer");
                        }}
                      >
                        {speaking ? <Square size={16} /> : <Play size={16} />}{" "}
                        {speaking ? "Stop playback" : "Listen"}
                      </button>
                      <details>
                        <summary>Read the words</summary>
                        <p>{a.text}</p>
                      </details>
                    </div>
                  </details>
                ))}
            </main>
          </div>

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
      {room.case.id === "blue-carbuncle" && room.status === "playing" && (
        <span className="case-attribution">After A. Conan Doyle · 1892</span>
      )}
      {!room.solo && room.status === "playing" && !opening && (
        <PartnerLink
          code={room.code}
          token={token}
          language={room.you.language}
          soundEnabled={soundOn}
          unlock={enableSound}
          discussion={room.objective?.communication || "What did you find?"}
          you={room.you.id}
          peer={room.players.find((p) => p.id !== room.you.id)}
          messages={room.messages || []}
          connected={connected}
          enabled={!sessionConflict && room.status === "playing"}
          suppressed={voiceChatActive || speaking}
          send={sendLive}
          receiver={radioReceiver}
          onMessage={async (text) => {
            try {
              const r = await request(
                `/rooms/${room.code}/partner-message`,
                { text },
                token,
              );
              sync(r);
              return true;
            } catch (e) {
              setError((e as Error).message);
              return false;
            }
          }}
          onClue={(id) => {
            const e = room.evidence.find((e) => e.id === id);
            if (e) {
              setWitness(null);
              setModal(null);
              setClue(e);
            }
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      {shownClue && (
        <Modal
          variant="clue-reader"
          title={shownClue.title}
          onClose={() => setClue(null)}
        >
          <div className="document-meta">
            <span>{shownClue.kind.toUpperCase()}</span>
            <span>EVIDENCE / {shownClue.id.toUpperCase()}</span>
          </div>
          {room.case.id === "last-announcement" && shownClue.id === "note" && (
            <figure className="clue-artwork">
              <img
                src="/art/arun-note.jpg"
                alt="Illustration of Arun’s handwritten note on the station desk"
              />
              <figcaption>
                Illustration · the exact clue transcription follows below.
              </figcaption>
            </figure>
          )}
          {room.case.id === "last-announcement" && shownClue.id === "found" && (
            <figure className="found-character">
              <CharacterPortrait id="arun" />
              <figcaption>Arun Sen · station master</figcaption>
            </figure>
          )}
          <div className="evidence-paper">
            <span className="paper-stamp">
              DO DUNIYA / CASE {room.case.number}
            </span>
            {room.you.language !== "en" && !translation && (
              <small className="language-status" role="status">
                {voiceBusy
                  ? "Translating into " + LANGS[room.you.language] + "…"
                  : "English original · translation unavailable. Use Read in… to try again."}
              </small>
            )}
            <p lang={translation ? room.you.language : "en"}>
              {translation || shownClue.text}
            </p>
            {translation && (
              <details>
                <summary>Original evidence · English</summary>
                <p>{shownClue.text}</p>
              </details>
            )}
          </div>
          {soundControls(shownClue.text)}
          <button className="primary full" onClick={() => setClue(null)}>
            Back to the scene <ArrowRight size={16} />
          </button>
          {translation && (
            <div className="translation" lang={room.you.language}>
              <small>GEMINI TRANSLATION · UNREVIEWED</small>
              <p>Displayed above · matches the spoken passage.</p>
            </div>
          )}
        </Modal>
      )}
      {witness && currentWitness && (
        <Modal
          variant="dialogue-sheet"
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
              <span
                className={
                  "witness-demeanor " + (currentWitness.emotion || "neutral")
                }
              >
                {currentWitness.clamped
                  ? "Taking a moment · return shortly"
                  : currentWitness.emotion === "cracked"
                    ? "Their account has changed"
                    : currentWitness.emotion === "nervous"
                      ? "Unsettled"
                      : "Listening"}
              </span>
              <p>
                {currentWitness.voice_profile?.tone ||
                  "Ask about a lead. Present evidence when you have it."}
              </p>
            </div>
          </div>
          <div className="speech-bubble" key={dialogue}>
            <span className="speaker-name">{currentWitness.name}</span>
            <span
              className={
                "witness-demeanor " + (currentWitness.emotion || "neutral")
              }
            >
              {currentWitness.clamped
                ? "Taking a moment · return shortly"
                : currentWitness.emotion === "cracked"
                  ? "Their account has changed"
                  : currentWitness.emotion === "nervous"
                    ? "Unsettled"
                    : "Listening"}
            </span>
            {room.you.language !== "en" && !translation && (
              <small className="language-status" role="status">
                {voiceBusy
                  ? "Translating into " + LANGS[room.you.language] + "…"
                  : "English original · translation unavailable. Use Read in… to try again."}
              </small>
            )}
            <blockquote
              className="dialogue"
              lang={translation ? room.you.language : "en"}
            >
              {translation || dialogue}
            </blockquote>
            {translation && (
              <details className="original-dialogue">
                <summary>Original dialogue · English</summary>
                <p>{dialogue}</p>
              </details>
            )}
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
            WITNESS ACCOUNT · {currentWitness.name}
          </div>
          <WitnessChallenge
            character={currentWitness.id}
            statements={room.statements || []}
            evidence={room.evidence}
            disabled={
              busy ||
              room.status !== "playing" ||
              currentWitness.clamped ||
              !!sessionConflict
            }
            onPresent={async (claim_id, evidence_id) => {
              const epoch = viewEpoch.current;
              setBusy(true);
              try {
                const result = await request(
                  `/rooms/${room.code}/challenge`,
                  { character: currentWitness.id, claim_id, evidence_id },
                  token,
                );
                if (epoch !== viewEpoch.current) return;
                setTranslation("");
                setDialogue(result.text);
                sync(result.room);
                setToast(
                  result.result === "contradiction"
                    ? "A contradiction is recorded in both notebooks."
                    : result.result === "supported"
                      ? "The record supports this statement."
                      : "Compare the exact claim with the evidence.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
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
          {!voiceChatActive && soundControls(dialogue, currentWitness.id)}
          <VoiceChat
            key={[
              room.code,
              currentWitness.id,
              room.you.language,
              room.you.role,
            ].join("|")}
            code={room.code}
            token={token}
            character={currentWitness.id}
            name={currentWitness.name}
            endpoint="talk"
            language={room.you.language}
            enabled={!sessionConflict && room.status === "playing"}
            soundEnabled={soundOn}
            available={
              room.providers.prisma &&
              room.providers.timbre &&
              room.providers.gemini
            }
            unlock={enableSound}
            onActive={(active) => {
              setVoiceChatActive(active);
              if (active) {
                cancelRecording();
                voiceRequest.current?.abort();
                audio.current?.pause();
                setSpeaking(false);
              }
            }}
            onSpeaking={setSpeaking}
            onReply={(text, translated) => {
              setDialogue(text);
              setTranslation(translated);
            }}
            onRefresh={() => {
              request("/rooms/" + room.code, undefined, token)
                .then(sync)
                .catch(() => {});
            }}
          />
          {translation && (
            <div className="translation" lang={room.you.language}>
              <small>GEMINI TRANSLATION · UNREVIEWED</small>
              <p>Displayed above · matches the spoken passage.</p>
            </div>
          )}
          <div hidden={voiceChatActive}>
            <div className="topics">
              {currentWitness.topics.slice(0, 3).map((t) => (
                <button
                  disabled={busy || room.status !== "playing"}
                  key={t.id}
                  onClick={() => ask(t.id)}
                >
                  <StoryText text={t.label} room={room} token={token} />
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
            {currentWitness.topics.length > 3 && (
              <details className="extra-topics">
                <summary>
                  More topics ({currentWitness.topics.length - 3})
                </summary>
                <div className="topics">
                  {currentWitness.topics.slice(3).map((t) => (
                    <button
                      key={t.id}
                      disabled={busy || room.status !== "playing"}
                      onClick={() => ask(t.id)}
                    >
                      {t.label}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </details>
            )}
            <form
              className="question-form"
              onSubmit={(e) => {
                e.preventDefault();
                ask();
              }}
            >
              <label htmlFor="question">
                Ask in your own words <small>Follow up on their account</small>
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
                      : "Ask about their account, or use a topic above."
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
                    recording
                      ? "Stop recording"
                      : "Record a question with Prisma"
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
          </div>
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
            <strong>{room.case.roles[room.you.role].name}</strong>. Check your
            task, discuss the question, then solve the case together.
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
            Dialogue and evidence translate automatically. Original English
            remains visible. Interface labels are currently English.
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
            Partner Link connects both investigators with live messages and a
            hold-to-talk radio. Witness voices use the configured AI services.
            Text topics and the mystery remain playable without model calls.
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
        <CaseNotebook
          caseTitle={room.case.title}
          caseNumber={room.case.number}
          evidence={room.evidence}
          statements={room.statements}
          messages={room.messages}
          hints={room.coach_hints}
          hintsRemaining={room.hints_remaining ?? 3}
          onClose={() => setModal(null)}
          onHint={() => {
            setCoachReply("");
            setModal("coach");
          }}
          onRead={(e) => {
            setModal(null);
            setClue(e);
          }}
        />
      )}
      {modal === "coach" && (
        <Modal title="The case assistant" onClose={() => setModal(null)}>
          <p className="muted">
            A nudge when you need one. Your team has {room.hints_remaining ?? 3}{" "}
            of 3 hints left. Every hint stays in your notebook.
          </p>
          <div className="evidence-paper">
            <p>
              {coachReply ||
                "Ask about your next lead, your partner’s role, or the evidence you have found."}
            </p>
          </div>
          {coachReply && (
            <button
              className="secondary"
              disabled={voiceBusy}
              onClick={() => {
                const last = room.coach_hints?.at(-1);
                if (last) void listen(last.text, "case_guide");
              }}
            >
              Hear this hint
            </button>
          )}
          <VoiceChat
            code={room.code}
            token={token}
            character="case_guide"
            name="Case assistant"
            language={room.you.language}
            endpoint="coach"
            turnLimit={1}
            enabled={!sessionConflict && room.status === "playing"}
            available={
              (room.hints_remaining ?? 3) > 0 &&
              !coachBusy &&
              room.providers.prisma &&
              room.providers.gemini &&
              room.providers.timbre
            }
            soundEnabled={soundOn}
            unlock={enableSound}
            onActive={setVoiceChatActive}
            onSpeaking={setSpeaking}
            onReply={(text, translated) => setCoachReply(translated || text)}
            onRefresh={() => {
              void request(`/rooms/${room.code}`, undefined, token)
                .then(sync)
                .catch((e) => setError(e.message));
            }}
          />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCoachBusy(true);
              try {
                const result = await request(
                  `/rooms/${room.code}/coach`,
                  coachQuestion.trim()
                    ? { question: coachQuestion }
                    : { topic: "nudge" },
                  token,
                );
                setCoachReply(result.text);
                if (room.you.language !== "en") {
                  try {
                    const translated = await request(
                      `/rooms/${room.code}/translate`,
                      { text: result.text },
                      token,
                    );
                    setCoachReply(translated.text);
                  } catch {
                    setError(
                      "Hint saved. Translation unavailable; showing the English original.",
                    );
                  }
                }
                setCoachQuestion("");
                sync(await request(`/rooms/${room.code}`, undefined, token));
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setCoachBusy(false);
              }
            }}
          >
            <label>
              What are you stuck on?
              <input
                value={coachQuestion}
                maxLength={500}
                onChange={(e) => setCoachQuestion(e.target.value)}
                placeholder="Optional question"
              />
            </label>
            <button
              className="primary full"
              disabled={
                coachBusy ||
                voiceChatActive ||
                (room.hints_remaining ?? 3) === 0
              }
            >
              {coachBusy ? "Finding a nudge…" : "Use one hint"}
            </button>
          </form>
        </Modal>
      )}
      {sessionConflict && (
        <Modal
          title={
            sessionConflict === "moved"
              ? "This player moved to another tab"
              : "This player is already open"
          }
          onClose={() => {}}
        >
          <p>
            One tab controls each player. Keep one tab for you and let your
            partner join the room with their own name.
          </p>
          <button
            className="primary full"
            onClick={() => {
              takeOver.current = true;
              setSessionConflict(null);
              setOpeningSeen(room.code);
              setConnectionEpoch((n) => n + 1);
            }}
          >
            Use this tab instead
          </button>
          <button className="secondary full" onClick={leave}>
            Return to casebook
          </button>
        </Modal>
      )}
      {modal === "theory" && (
        <Modal
          wide
          title={
            room.proposal
              ? "Check your partner’s answers."
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
                  evidence: room.evidence.map((e) => e.id),
                  text: explanation,
                });
                if (r?.status === "completed") setModal(null);
              }}
            >
              <p className="muted">
                Choose your three answers. Your notebook is included
                automatically. Your partner checks the answers before you reveal
                the ending.
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
                Why do you think so? (optional)
                <textarea
                  value={explanation}
                  maxLength={1200}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain how the evidence fits together…"
                />
              </label>
              <p className="paper-note">
                Your notebook is included automatically. Choose your answers,
                then let your partner check them.
              </p>
              <button
                className="primary full"
                disabled={busy || !room.can_solve}
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
