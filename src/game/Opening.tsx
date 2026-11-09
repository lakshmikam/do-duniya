import { useEffect, useRef, useState } from "react";
import { ArrowRight, Headphones, VolumeX, X } from "lucide-react";
import { World, GameCharacter } from "./World";

export function Opening({
  blue,
  title,
  onBegin,
  onClose,
}: {
  blue: boolean;
  title: string;
  onBegin: (sound: boolean) => void;
  onClose: () => void;
}) {
  const [beat, setBeat] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const buttons = Array.from(
        panel.current?.querySelectorAll<HTMLButtonElement>("button") || [],
      );
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  const shots = blue
    ? [
        {
          tag: "LONDON · A COLD CHRISTMAS",
          title: "An ordinary goose.",
          line: "Henry Baker lost his Christmas dinner in a street scuffle. That should have been the end of the story.",
        },
        {
          tag: "ONE VERY UNEXPECTED DISCOVERY",
          title: "An extraordinary jewel.",
          line: "Inside the bird, a blue stone. Across the city, an innocent man waits under suspicion.",
        },
        {
          tag: "TWO INVESTIGATORS. ONE TRAIL.",
          title: "Follow what changed hands.",
          line: "One of you follows the goose through London. The other studies the hotel case. The truth lives between your discoveries.",
        },
      ]
    : [
        {
          tag: "VAYAL JUNCTION · 23:47",
          title: "The announcement was clear.",
          line: "“Evacuate the luggage coach.” A storm outside. A familiar voice on the loudspeaker. Everyone obeyed.",
        },
        {
          tag: "FOUR MINUTES LATER",
          title: "But something was missing.",
          line: "A sealed museum consignment had vanished. So had the station master. His coat was still hanging in the office.",
        },
        {
          tag: "TWO INVESTIGATORS. ONE NIGHT.",
          title: "Someone borrowed the truth.",
          line: "One of you walks the platform. The other reads the records. Compare what you find. Decide whose story survives.",
        },
      ];
  return (
    <div
      ref={panel}
      tabIndex={-1}
      className="story-opening"
      role="dialog"
      aria-modal="true"
      aria-label="Case opening"
    >
      <World blue={blue} />
      <div className="opening-shade" />
      <button
        className="opening-close"
        aria-label="Close opening"
        onClick={onClose}
      >
        <X />
      </button>
      <span className="opening-case">DO DUNIYA / {title}</span>
      <div className="opening-character">
        <GameCharacter id={blue ? "henry" : "mira"} />
      </div>
      <div className="opening-copy" key={beat}>
        <span className="eyebrow">{shots[beat].tag}</span>
        <h1>{shots[beat].title}</h1>
        <p>{shots[beat].line}</p>
        <div className="opening-progress">
          {shots.map((_, i) => (
            <i key={i} className={i <= beat ? "active" : ""} />
          ))}
        </div>
        {beat < 2 ? (
          <button className="primary" onClick={() => setBeat(beat + 1)}>
            Continue <ArrowRight size={20} />
          </button>
        ) : (
          <div className="opening-buttons">
            <button className="primary" onClick={() => onBegin(true)}>
              <Headphones size={20} /> Start with sound <ArrowRight size={19} />
            </button>
            <button className="text-button" onClick={() => onBegin(false)}>
              <VolumeX size={17} /> Play quietly
            </button>
          </div>
        )}
        <small>Subtitles always on · Sound can be muted anytime</small>
      </div>
    </div>
  );
}
