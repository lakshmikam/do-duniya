import { useEffect, useRef, useState } from "react";
import { World, GameCharacter } from "./World";
import { Search, MessageCircle, Check } from "lucide-react";
import "./investigation-scene.css";
type Props = {
  location: string;
  blue?: boolean;
  objects: { id: string; title: string; kind: string; discovered?: boolean }[];
  characters: { id: string; name: string }[];
  onInspect: (id: string) => void;
  onTalk: (id: string) => void;
  disabled?: boolean;
  playerName?: string;
};
export function InvestigationScene(props: Props) {
  const [position, setPosition] = useState({ x: 12, y: 88 }),
    [walking, setWalking] = useState(false),
    [selected, setSelected] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    latest = useRef(props);
  latest.current = props;
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setWalking(false);
    setSelected("");
  }
  useEffect(() => {
    const hide = () => {
      if (document.hidden) cancel();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    if (props.disabled) cancel();
  }, [props.disabled]);
  function approach(id: string, x: number, y: number, talk: boolean) {
    if (props.disabled) return;
    cancel();
    setSelected(id);
    setWalking(true);
    setPosition({ x, y });
    timer.current = setTimeout(() => {
      timer.current = null;
      setWalking(false);
      setSelected("");
      if (latest.current.disabled) return;
      if (talk) latest.current.onTalk(id);
      else latest.current.onInspect(id);
    }, 450);
  }
  const spots = [
    { x: 25, y: 68 },
    { x: 79, y: 81 },
    { x: 59, y: 65 },
    { x: 43, y: 82 },
  ];
  return (
    <section
      className={"investigation-scene " + (props.disabled ? "paused" : "")}
      aria-label="Investigate this location"
    >
      <div className="simple-stage">
        <div className="simple-world">
          <World location={props.location} blue={props.blue} />
        </div>
        <div className="simple-shade" />
        {props.objects.map((o, i) => {
          const point = spots[i % spots.length];
          return (
            <button
              key={o.id}
              className={
                "simple-clue " + (selected === o.id ? "approaching" : "")
              }
              style={{ left: point.x + "%", top: point.y + "%" }}
              disabled={props.disabled}
              onClick={() => approach(o.id, point.x, point.y, false)}
            >
              <span>
                {o.discovered ? <Check size={23} /> : <Search size={23} />}
              </span>
              <strong>{o.title}</strong>
              <small>
                {o.discovered ? "Read again" : "Tap to investigate"}
              </small>
            </button>
          );
        })}
        {props.characters.map((c, i) => {
          const x = i ? 66 : 43,
            y = 70;
          return (
            <button
              key={c.id}
              className={
                "simple-person " + (selected === c.id ? "approaching" : "")
              }
              style={{ left: x + "%", top: y + "%" }}
              disabled={props.disabled}
              onClick={() => approach(c.id, x, y, true)}
            >
              <GameCharacter id={c.id} />
              <strong>{c.name}</strong>
              <small>
                <MessageCircle size={12} />
                Tap to talk
              </small>
            </button>
          );
        })}
        <div
          className={"simple-investigator " + (walking ? "walking" : "")}
          style={{ left: position.x + "%", top: position.y + "%" }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 70 115">
            <ellipse
              cx="35"
              cy="108"
              rx="23"
              ry="5"
              fill="#122738"
              opacity=".4"
            />
            <g className="simple-leg left">
              <path d="M23 76l-3 26h14l3-26" fill="#24364d" />
            </g>
            <g className="simple-leg right">
              <path d="M39 76l3 26h14l-4-26" fill="#24364d" />
            </g>
            <path
              d="M20 36q15-8 30 0l10 45H10z"
              fill="#e7b75d"
              stroke="#69543e"
              strokeWidth="2"
            />
            <circle cx="35" cy="22" r="15" fill="#dba77e" />
            <path d="M15 18q2-20 20-17 18-3 20 17z" fill="#28394c" />
            <rect x="10" y="16" width="50" height="5" rx="2" fill="#28394c" />
            <path d="M33 37v40" stroke="#ae7b36" strokeWidth="3" />
          </svg>
          <span>{props.playerName || "You"}</span>
        </div>
      </div>
      <p className="simple-instruction" role="status">
        {walking
          ? "Walking over…"
          : props.disabled
            ? "Close the conversation or clue to continue."
            : "Tap a person to talk or a clue to read it. We’ll walk you there."}
      </p>
    </section>
  );
}
