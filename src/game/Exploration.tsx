import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Footprints,
  Hand,
  Search,
  MessageCircle,
  EyeOff,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { World, GameCharacter } from "./World";
import "./exploration.css";

type Point = { x: number; y: number };
type Lead = { id: string; title: string; kind: string; discovered?: boolean };
type Person = { id: string; name: string };
type Target = Point & {
  id: string;
  label: string;
  type: "lead" | "person" | "keepsake";
};
export type ExplorationProps = {
  location: string;
  blue?: boolean;
  objects: Lead[];
  characters: Person[];
  onInspect: (id: string) => void;
  onTalk: (id: string) => void;
  disabled?: boolean;
  playerName?: string;
  accessibleFallback?: ReactNode;
};

const rememberedPositions = new Map<string, Point>();
const rememberedKeepsakes = new Set<string>();
const leadSpots: Point[] = [
  { x: 27, y: 67 },
  { x: 52, y: 81 },
  { x: 86, y: 66 },
  { x: 59, y: 66 },
  { x: 39, y: 82 },
];
const personSpots: Point[] = [
  { x: 41, y: 69 },
  { x: 70, y: 70 },
  { x: 57, y: 84 },
];
const covers = [
  { x: 17, y: 78, label: "luggage trunk" },
  { x: 78, y: 84, label: "stacked crates" },
];
const locationNames: Record<string, string> = {
  platform: "Midnight platform",
  office: "Station office",
  relay: "Relay passage",
  console: "Signal cabin",
  records: "Records room",
  street: "Baker Street",
  market: "Covent Garden market",
  brixton: "Brixton Road",
  hotel: "Hotel dossier room",
  ledger: "The inn's records",
};
const keepsakes: Record<string, { name: string; text: string }> = {
  platform: {
    name: "A paw-print ticket",
    text: "Someone has punched a tiny paw into a ticket marked NIGHT SHIFT. The station cat apparently travels first class. You keep the souvenir; it is not case evidence.",
  },
  console: {
    name: "The signal desk's secret",
    text: "Behind the cabinet: a paper sign reading PLEASE DO NOT FEED THE CLOCK. Someone has drawn a very hungry clock. A night-shift joke, not a clue.",
  },
  street: {
    name: "A very small goose",
    text: "A brass goose is tucked behind the lamppost. Its base reads HONK IF YOU REQUIRE FURTHER EVIDENCE. A keepsake, not part of the case.",
  },
};
const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, (a.y - b.y) * 0.65);
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const Investigator = memo(function Investigator() {
  return (
    <svg viewBox="0 0 90 135" aria-hidden="true" className="explorer-body">
      <ellipse cx="45" cy="127" rx="24" ry="5" fill="#112433" opacity=".32" />
      <g className="explorer-leg leg-left">
        <path
          d="M33 92l-3 28h13l3-28"
          fill="#263851"
          stroke="#172a41"
          strokeWidth="3"
        />
        <path d="M30 117h14v9H24q-3-7 6-9" fill="#1c283b" />
      </g>
      <g className="explorer-leg leg-right">
        <path
          d="M48 92l2 28h13l-4-28"
          fill="#263851"
          stroke="#172a41"
          strokeWidth="3"
        />
        <path d="M50 117h13q10 2 8 9H50Z" fill="#1c283b" />
      </g>
      <g className="explorer-coat">
        <path
          d="M30 53q15-8 30 0l11 49H20Z"
          fill="#efbf62"
          stroke="#614951"
          strokeWidth="3"
        />
        <path
          d="M43 56l2 46m-13-49l13 16 14-16"
          stroke="#9c714d"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M25 63l-9 27 9 4 12-30m27-1l9 26-8 5-12-28"
          fill="#e5ae55"
          stroke="#614951"
          strokeWidth="3"
        />
        <circle cx="46" cy="81" r="2.5" fill="#614951" />
        <circle cx="46" cy="92" r="2.5" fill="#614951" />
      </g>
      <ellipse
        cx="45"
        cy="35"
        rx="21"
        ry="25"
        fill="#dca582"
        stroke="#614951"
        strokeWidth="3"
      />
      <path d="M23 34q-5-33 24-30t21 36L57 20q-12 13-31 7" fill="#34304b" />
      <path
        d="M18 17h54v9H18Z"
        fill="#384b64"
        stroke="#26344f"
        strokeWidth="3"
      />
      <path
        d="M29 17l4-15h25l5 15"
        fill="#425979"
        stroke="#26344f"
        strokeWidth="3"
      />
      <circle cx="37" cy="36" r="2.5" fill="#30354b" />
      <circle cx="54" cy="36" r="2.5" fill="#30354b" />
      <path d="M39 48q6 4 12 0" fill="none" stroke="#875360" strokeWidth="2" />
      <path d="M31 60l13 10 14-10" fill="#e56b65" />
    </svg>
  );
});

/** Spatial exploration is local presentation. Every actual clue still goes through
 * the parent's server-authorized inspection/conversation action. */
export function Exploration(props: ExplorationProps) {
  const {
    location,
    blue = false,
    objects,
    characters,
    disabled = false,
    playerName = "You",
    accessibleFallback,
  } = props;
  const sceneKey = `${blue ? "winter" : "railway"}:${location}`;
  const root = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLDivElement>(null),
    avatar = useRef<HTMLDivElement>(null);
  const position = useRef<Point>({ x: 10, y: 88 }),
    destination = useRef<Point | null>(null),
    inputs = useRef(new Set<string>()),
    hidden = useRef(false),
    size = useRef({ width: 1, height: 1 });
  const latest = useRef(props);
  latest.current = props;
  const targets = useRef<Target[]>([]),
    nearRef = useRef<Target | null>(null),
    coverRef = useRef<(typeof covers)[number] | null>(null);
  const [near, setNear] = useState<Target | null>(null),
    [isHidden, setIsHidden] = useState(false),
    [notice, setNotice] = useState(""),
    [keepsake, setKeepsake] = useState<string | null>(null),
    [direct, setDirect] = useState(false),
    [scattering, setScattering] = useState(false);
  const scatterAt = useRef(-Infinity),
    scatterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasBirds = blue && ["street", "market", "brixton"].includes(location);
  const foundKeepsakes = useRef(rememberedKeepsakes),
    standingPosition = useRef<Point | null>(null);
  const found = keepsakes[location] || {
    name: blue ? "A market button" : "A pocket timetable",
    text: blue
      ? "A button reads ASK THE GOOSE. It is excellent advice for very few situations. You pocket the joke; it is not evidence."
      : "In the margin: 'The last train is always the one you almost catch.' You keep the scrap as a souvenir, not a case clue.",
  };
  const currentTargets: Target[] = [
    ...objects.map((o, i) => ({
      ...leadSpots[i % leadSpots.length],
      id: o.id,
      label: o.title,
      type: "lead" as const,
    })),
    ...characters.map((c, i) => ({
      ...personSpots[i % personSpots.length],
      id: c.id,
      label: c.name,
      type: "person" as const,
    })),
    {
      x: 92,
      y: 87,
      id: "keepsake",
      label: found.name,
      type: "keepsake" as const,
    },
  ];
  targets.current = currentTargets;

  function interact(target = nearRef.current) {
    if (latest.current.disabled || !target || hidden.current) return;
    destination.current = null;
    inputs.current.clear();
    if (target.type === "lead") latest.current.onInspect(target.id);
    else if (target.type === "person") latest.current.onTalk(target.id);
    else {
      foundKeepsakes.current.add(sceneKey);
      setKeepsake(found.text);
      setNotice(
        `Found ${found.name}. A small secret of this place, not case evidence.`,
      );
    }
  }
  function leaveCover() {
    if (standingPosition.current)
      position.current = { ...standingPosition.current };
    standingPosition.current = null;
    hidden.current = false;
    setIsHidden(false);
  }
  function toggleHide() {
    if (latest.current.disabled) return;
    if (hidden.current) {
      leaveCover();
      setNotice("You step back into the light.");
      return;
    }
    if (!coverRef.current) {
      setNotice(
        "Walk beside the luggage trunk or stacked crates, then hide. Cover is marked with a crescent.",
      );
      return;
    }
    destination.current = null;
    inputs.current.clear();
    standingPosition.current = { ...position.current };
    position.current = { x: coverRef.current.x, y: coverRef.current.y + 1 };
    hidden.current = true;
    setIsHidden(true);
    setNotice(
      `You settle behind the ${coverRef.current.label}. Press H or Step out when you are ready. Hiding is optional; no clue will disappear.`,
    );
  }
  const actions = useRef({ interact, toggleHide });
  actions.current = { interact, toggleHide };

  useEffect(() => {
    position.current = rememberedPositions.get(sceneKey) || { x: 10, y: 88 };
    destination.current = null;
    inputs.current.clear();
    hidden.current = false;
    standingPosition.current = null;
    setIsHidden(false);
    setNear(null);
    nearRef.current = null;
    setNotice("");
    setKeepsake(null);
    setScattering(false);
    scatterAt.current = -Infinity;
    let frame = 0,
      last = 0,
      lastUi = 0;
    const element = stage.current!;
    function measure() {
      const r = element.getBoundingClientRect();
      size.current = { width: r.width, height: r.height };
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const blocked = (p: Point) =>
      covers.some(
        (c) => Math.abs(p.x - c.x) < 3.4 && Math.abs(p.y - c.y) < 2.8,
      );
    function draw(now: number) {
      const dt = Math.min((now - (last || now)) / 1000, 0.04);
      last = now;
      const keys = inputs.current,
        running = keys.has("run"),
        p = position.current;
      let dx = Number(keys.has("right")) - Number(keys.has("left")),
        dy = Number(keys.has("down")) - Number(keys.has("up"));
      if (!dx && !dy && destination.current) {
        const gap = distance(p, destination.current);
        if (gap < 1.1) destination.current = null;
        else {
          dx = destination.current.x - p.x;
          dy = destination.current.y - p.y;
        }
      }
      const moving =
        !latest.current.disabled && !hidden.current && !!(dx || dy);
      if (moving) {
        const length = Math.hypot(dx, dy) || 1,
          speed = running ? 31 : 18;
        const nx = clamp(p.x + (dx / length) * speed * dt, 5, 95),
          ny = clamp(p.y + (dy / length) * speed * dt, 61, 92);
        if (!blocked({ x: nx, y: p.y })) p.x = nx;
        if (!blocked({ x: p.x, y: ny })) p.y = ny;
        if (destination.current && blocked(destination.current))
          destination.current = null;
        if (
          running &&
          distance(p, { x: 62, y: 88 }) < 8 &&
          now - scatterAt.current > 7000
        ) {
          scatterAt.current = now;
          setScattering(true);
          setNotice(
            hasBirds
              ? "The pigeons scatter at your footsteps, then settle nearby. No clue has moved."
              : "Your footsteps stir the loose timetables. They flutter, then settle. The case evidence stays in place.",
          );
          if (scatterTimer.current) clearTimeout(scatterTimer.current);
          scatterTimer.current = setTimeout(() => setScattering(false), 2200);
        }
      }
      if (avatar.current) {
        const transform = `translate3d(${(p.x / 100) * size.current.width}px,${(p.y / 100) * size.current.height}px,0)`;
        if (avatar.current.style.transform !== transform)
          avatar.current.style.transform = transform;
        const className = `explorer ${moving ? "walking" : ""} ${running && moving ? "running" : ""} ${hidden.current ? "is-hidden" : ""} ${dx < 0 ? "facing-left" : ""}`;
        if (avatar.current.className !== className)
          avatar.current.className = className;
        avatar.current.style.zIndex = String(
          hidden.current && coverRef.current
            ? Math.round(coverRef.current.y) - 1
            : Math.round(p.y),
        );
      }
      if (now - lastUi > 110) {
        lastUi = now;
        const nearest =
          targets.current
            .filter((t) => !hidden.current && distance(p, t) < 10)
            .sort((a, b) => distance(p, a) - distance(p, b))[0] || null;
        if (
          nearest?.id !== nearRef.current?.id ||
          nearest?.type !== nearRef.current?.type
        ) {
          nearRef.current = nearest;
          setNear(nearest);
        }
        coverRef.current = covers.find((c) => distance(p, c) < 9) || null;
        rememberedPositions.set(sceneKey, {
          ...(standingPosition.current || p),
        });
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    const clear = () => {
      inputs.current.clear();
      destination.current = null;
    };
    const up = (e: KeyboardEvent) => {
      const key = movementKey(e.key);
      if (key) inputs.current.delete(key);
    };
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      cancelAnimationFrame(frame);
      if (scatterTimer.current) clearTimeout(scatterTimer.current);
      observer.disconnect();
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      rememberedPositions.set(sceneKey, {
        ...(standingPosition.current || position.current),
      });
    };
  }, [sceneKey]);
  useEffect(() => {
    if (disabled) {
      inputs.current.clear();
      destination.current = null;
    }
  }, [disabled]);

  function walkTo(point: Point) {
    if (disabled) return;
    if (hidden.current) leaveCover();
    destination.current = {
      x: clamp(point.x, 5, 95),
      y: clamp(point.y, 61, 92),
    };
    stage.current?.focus({ preventScroll: true });
  }
  function targetClick(target: Target) {
    if (disabled) return;
    if (distance(position.current, target) < 10 && !hidden.current)
      interact(target);
    else {
      walkTo(target);
      setNotice(
        `Walking toward ${target.label}. When nearby, press E or tap Interact.`,
      );
    }
  }
  function press(
    direction: string,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (disabled) return;
    if (hidden.current) leaveCover();
    destination.current = null;
    inputs.current.add(direction);
  }
  function release(direction: string) {
    inputs.current.delete(direction);
  }

  return (
    <section
      className={"exploration" + (disabled ? " is-paused" : "")}
      ref={root}
      aria-label={`${locationNames[location] || location} exploration`}
    >
      <div
        className="exploration-scene"
        ref={stage}
        tabIndex={0}
        role="group"
        aria-label="Walkable investigation scene. Arrow keys or W A S D to walk, Shift to run, E to interact, H to hide beside cover."
        onKeyDown={(e) => {
          if (
            (e.target as HTMLElement).closest(
              "input,textarea,select,[contenteditable=true]",
            )
          )
            return;
          const key = movementKey(e.key);
          if (key) {
            e.preventDefault();
            if (!disabled) {
              destination.current = null;
              if (hidden.current) leaveCover();
              inputs.current.add(key);
            }
          } else if (e.key.toLowerCase() === "e") {
            e.preventDefault();
            if (!e.repeat) actions.current.interact();
          } else if (e.key.toLowerCase() === "h") {
            e.preventDefault();
            if (!e.repeat) actions.current.toggleHide();
          }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            inputs.current.clear();
            destination.current = null;
          }
        }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button,a,input")) return;
          const r = e.currentTarget.getBoundingClientRect();
          walkTo({
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          });
        }}
      >
        <div className="exploration-world">
          <World blue={blue} location={location} />
        </div>
        <div className="exploration-shade" />
        <header className="exploration-scene-label">
          <span>
            {blue ? "LONDON / WINTER" : "VAYAL JUNCTION / AFTER MIDNIGHT"}
          </span>
          <strong>{locationNames[location] || location}</strong>
        </header>
        <div className="walk-zone" aria-hidden="true">
          <span>WALK / LOOK / LISTEN</span>
        </div>
        {covers.map((c, i) => (
          <div
            className={`exploration-cover cover-${i}`}
            key={c.label}
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              zIndex: Math.round(c.y) + 1,
            }}
            aria-label={`Optional hiding cover: ${c.label}`}
          >
            <span aria-hidden="true">☾</span>
            <svg viewBox="0 0 110 75" aria-hidden="true">
              <path
                d="M8 23L33 9h67v48L75 72H8Z"
                fill={i ? "#9d795b" : "#886877"}
                stroke="#2b344d"
                strokeWidth="4"
              />
              <path
                d="M8 23h67l25-14M75 23v49M23 23v49m38-49v49"
                fill="none"
                stroke="#d8b780"
                strokeWidth="5"
              />
              <path
                d="M40 37h15v13H40Z"
                fill="#f1ca77"
                stroke="#49445b"
                strokeWidth="3"
              />
            </svg>
          </div>
        ))}
        <div
          className={
            "exploration-scatter " +
            (hasBirds ? "scatter-birds" : "scatter-papers") +
            (scattering ? " scatter-active" : "")
          }
          style={{ left: "62%", top: "88%", zIndex: 86 }}
          aria-hidden="true"
        >
          <span className="scatter-ground-mark" />
          {[0, 1, 2].map((i) => (
            <span className={"scatter-particle scatter-particle-" + i} key={i}>
              {hasBirds ? (
                <svg viewBox="0 0 38 32">
                  <path
                    d="M7 25l-3 5m11-5v5"
                    stroke="#d5b78f"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx="15"
                    cy="19"
                    rx="12"
                    ry="8"
                    fill="#9daeb7"
                    stroke="#384863"
                    strokeWidth="2"
                  />
                  <circle
                    cx="26"
                    cy="10"
                    r="7"
                    fill="#b9c4cc"
                    stroke="#384863"
                    strokeWidth="2"
                  />
                  <path d="M32 10l6 3-7 2" fill="#e0bb75" />
                  <path
                    className="scatter-wing"
                    d="M5 17q16-13 17 6-12 8-17-6Z"
                    fill="#72889e"
                    stroke="#384863"
                    strokeWidth="2"
                  />
                  <circle cx="28" cy="9" r="1.4" fill="#24324c" />
                </svg>
              ) : (
                <svg viewBox="0 0 32 38">
                  <path
                    d="M4 3h20l5 7v25H4Z"
                    fill="#e9dfb5"
                    stroke="#637588"
                    strokeWidth="2"
                  />
                  <path
                    d="M24 3v8h5M9 16h15M9 22h12M9 28h14"
                    fill="none"
                    stroke="#909f9f"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </span>
          ))}
          <span className="scatter-caption">
            {hasBirds ? "Pigeons" : "Loose timetables"}
          </span>
        </div>
        {objects.map((o, i) => {
          const t = currentTargets.find(
            (t) => t.id === o.id && t.type === "lead",
          )!;
          return (
            <button
              key={o.id}
              className={`exploration-lead ${near?.id === o.id ? "near" : ""} ${o.discovered ? "already-found" : ""}`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                zIndex: Math.round(t.y),
              }}
              disabled={disabled}
              onClick={() => targetClick(t)}
              aria-label={`${o.discovered ? "Review" : "Investigate"} ${o.title}${near?.id === o.id ? ", nearby" : ", walk closer"}`}
            >
              <span className="lead-prop" aria-hidden="true">
                {o.kind === "audio" ? "◉" : o.kind === "object" ? "◇" : "▤"}
              </span>
              <span className="exploration-target-label">
                {o.title}
                <small>
                  {near?.id === o.id ? "E · Investigate" : "Walk closer"}
                </small>
              </span>
            </button>
          );
        })}
        {characters.map((c, i) => {
          const t = currentTargets.find(
            (t) => t.id === c.id && t.type === "person",
          )!;
          return (
            <button
              key={c.id}
              className={`exploration-person patrol-${i % 3} ${near?.id === c.id ? "near" : ""}`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                zIndex: Math.round(t.y),
              }}
              disabled={disabled}
              onClick={() => targetClick(t)}
              aria-label={`Talk to ${c.name}${near?.id === c.id ? ", nearby" : ", walk closer"}`}
            >
              <div className="npc-patrol">
                <GameCharacter id={c.id} />
                <svg
                  className="npc-feet"
                  viewBox="0 0 80 35"
                  aria-hidden="true"
                >
                  <path
                    className="npc-left-leg"
                    d="M21 0h15l-3 24H17l4-24Zm-4 20h17v10H9q-1-7 8-10Z"
                    fill="#28374e"
                    stroke="#1d2940"
                    strokeWidth="2"
                  />
                  <path
                    className="npc-right-leg"
                    d="M44 0h15l5 24H47L44 0Zm3 20h17q9 3 10 10H47Z"
                    fill="#28374e"
                    stroke="#1d2940"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="exploration-target-label">
                {c.name}
                <small>
                  {near?.id === c.id ? "E · Talk" : "Approach to talk"}
                </small>
              </span>
            </button>
          );
        })}
        <button
          className={`exploration-secret ${foundKeepsakes.current.has(sceneKey) ? "collected" : ""}`}
          style={{ left: "92%", top: "87%", zIndex: 87 }}
          disabled={disabled}
          onClick={() => targetClick(currentTargets.at(-1)!)}
          aria-label={
            near?.type === "keepsake"
              ? `Examine ${found.name}`
              : "A faint glint behind the scenery. Walk closer."
          }
        >
          <Sparkles size={19} />
          <span>{near?.type === "keepsake" ? "E · A tiny secret" : "?"}</span>
        </button>
        <div className="explorer" ref={avatar} aria-hidden="true">
          <div className="explorer-anchor">
            <Investigator />
            <span className="explorer-name">{playerName}</span>
          </div>
        </div>
        {isHidden && <div className="hidden-vignette" aria-hidden="true" />}
        <div className="exploration-breadcrumb">
          {isHidden
            ? "OUT OF SIGHT / Press H to step out"
            : "Click the floor to walk. Get close to look or talk."}
        </div>
      </div>
      <div className="exploration-controls">
        <div className="exploration-directions" aria-label="Movement controls">
          <button
            disabled={disabled}
            aria-label="Walk up"
            className="move-up"
            onPointerDown={(e) => press("up", e)}
            onPointerUp={() => release("up")}
            onPointerCancel={() => release("up")}
            onLostPointerCapture={() => release("up")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                inputs.current.add("up");
              }
            }}
            onKeyUp={() => release("up")}
            onBlur={() => release("up")}
          >
            ↑
          </button>
          {[
            ["left", "←"],
            ["down", "↓"],
            ["right", "→"],
          ].map(([key, symbol]) => (
            <button
              disabled={disabled}
              key={key}
              aria-label={`Walk ${key}`}
              className={`move-${key}`}
              onPointerDown={(e) => press(key, e)}
              onPointerUp={() => release(key)}
              onPointerCancel={() => release(key)}
              onLostPointerCapture={() => release(key)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  inputs.current.add(key);
                }
              }}
              onKeyUp={() => release(key)}
              onBlur={() => release(key)}
            >
              {symbol}
            </button>
          ))}
        </div>
        <div className="exploration-main-actions">
          <button
            className="exploration-interact"
            disabled={disabled || !near || isHidden}
            onClick={() => interact()}
          >
            {near?.type === "person" ? (
              <MessageCircle size={19} />
            ) : near?.type === "keepsake" ? (
              <Sparkles size={19} />
            ) : (
              <Search size={19} />
            )}
            <span>
              {isHidden
                ? "Step out to investigate"
                : near
                  ? near.type === "person"
                    ? `Talk to ${near.label}`
                    : near.type === "keepsake"
                      ? "Examine the glint"
                      : `Inspect ${near.label}`
                  : "Walk toward a lead"}
              <small>
                {near && !isHidden
                  ? "E / TAP TO INTERACT"
                  : "ARROWS / WASD / TAP THE FLOOR"}
              </small>
            </span>
          </button>
          <div className="exploration-secondary">
            <button
              disabled={disabled}
              onPointerDown={(e) => press("run", e)}
              onPointerUp={() => release("run")}
              onPointerCancel={() => release("run")}
              onLostPointerCapture={() => release("run")}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  inputs.current.add("run");
                }
              }}
              onKeyUp={() => release("run")}
              onBlur={() => release("run")}
            >
              <Footprints size={17} /> Hold to run <kbd>Shift</kbd>
            </button>
            <button
              disabled={disabled}
              aria-pressed={isHidden}
              onClick={toggleHide}
            >
              <EyeOff size={17} />
              {isHidden ? "Step out" : "Hide by cover"}
              <kbd>H</kbd>
            </button>
          </div>
        </div>
      </div>
      <div className="exploration-notice" role="status">
        {disabled
          ? "Exploration is paused."
          : notice ||
            "Your notebook keeps every discovery. Explore at your own pace."}
      </div>
      {keepsake && (
        <aside className="keepsake-note">
          <Sparkles size={20} />
          <div>
            <strong>A small secret found</strong>
            <p>{keepsake}</p>
            <button onClick={() => setKeepsake(null)}>
              Pocket it and continue
            </button>
          </div>
        </aside>
      )}
      <details
        className="exploration-direct"
        open={direct}
        onToggle={(e) => setDirect(e.currentTarget.open)}
      >
        <summary>
          <Hand size={16} /> Explore without movement <ChevronDown size={15} />
        </summary>
        <p>
          Use direct controls if movement is difficult. The same story and
          evidence rules apply.
        </p>
        {accessibleFallback || (
          <div>
            {objects.map((o) => (
              <button
                disabled={disabled}
                key={o.id}
                onClick={() => props.onInspect(o.id)}
              >
                <Search size={15} />
                {o.title}
              </button>
            ))}
            {characters.map((c) => (
              <button
                disabled={disabled}
                key={c.id}
                onClick={() => props.onTalk(c.id)}
              >
                <MessageCircle size={15} />
                {c.name}
              </button>
            ))}
          </div>
        )}
      </details>
    </section>
  );
}

function movementKey(key: string): string | null {
  return (
    (
      {
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
        Shift: "run",
      } as Record<string, string>
    )[key] || null
  );
}
