import { useEffect, useRef } from "react";
import { Headphones, VolumeX, X, ArrowRight } from "lucide-react";
import { World, GameCharacter } from "./World";
export function Opening({
  blue,
  title,
  role = "field",
  onBegin,
  onClose,
}: {
  blue: boolean;
  title: string;
  role?: string;
  onBegin: (sound: boolean) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          panel.current?.querySelectorAll<HTMLButtonElement>("button") || [],
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  const you =
    role === "field"
      ? blue
        ? "You follow the bird through the city and question witnesses."
        : "You investigate the station and question witnesses."
      : "You check the records. Your partner investigates the scene and questions witnesses.";
  return (
    <div
      ref={panel}
      tabIndex={-1}
      className="story-opening simple-opening"
      role="dialog"
      aria-modal="true"
      aria-label="How to investigate together"
    >
      <World blue={blue} />
      <div className="opening-shade" />
      <button
        className="opening-close icon"
        onClick={onClose}
        aria-label="Skip introduction"
      >
        <X />
      </button>
      <span className="opening-case">DO DUNIYA · TWO PLAYERS</span>
      <div className="opening-character">
        <GameCharacter id={blue ? "henry" : "mira"} />
      </div>
      <div className="opening-copy">
        <span className="eyebrow">YOUR SHARED MYSTERY</span>
        <h1>{title}</h1>
        <p>
          {blue
            ? "A jewel turned up inside a goose. An accused man waits at the hotel. Find the connection together."
            : "An evacuation emptied the platform. A museum crate vanished, and station master Arun is missing. Find out what happened."}
        </p>
        <div className="opening-role">
          <strong>Your part</strong>
          <p>{you}</p>
        </div>
        <ol className="opening-instructions">
          <li>Inspect objects and question the people in your location.</li>
          <li>Compare what you found with your partner’s account.</li>
          <li>
            Every clue you find goes to{" "}
            <strong>both notebooks automatically</strong>.
          </li>
        </ol>
        <div className="opening-buttons">
          <button className="primary" onClick={() => onBegin(true)}>
            <Headphones size={18} />
            Start with sound
            <ArrowRight size={18} />
          </button>
          <button className="text-button" onClick={() => onBegin(false)}>
            <VolumeX size={17} />
            Play quietly
          </button>
        </div>
        <small>Tap people or clues to investigate. Radio is optional.</small>
      </div>
    </div>
  );
}
