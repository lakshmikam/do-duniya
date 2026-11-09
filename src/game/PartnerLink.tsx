import { useEffect, useState } from "react";
import { MessagesSquare, Send, X, Link2 } from "lucide-react";
import { PartnerRadio, RadioPacket } from "./PartnerRadio";
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
};
type Peer = {
  radio_talking?: boolean;
  name: string;
  connected: boolean;
  radio?: boolean;
  scene?: string;
  interviewing?: string;
};
type Props = {
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
export function PartnerLink(props: Props) {
  const [open, setOpen] = useState(false),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [seen, setSeen] = useState(0),
    [error, setError] = useState("");
  const last = props.messages.at(-1)?.id;
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("partner-open", show);
    return () => window.removeEventListener("partner-open", show);
  }, []);
  useEffect(() => {
    if (open) setSeen(Date.now() / 1000);
  }, [open, last]);
  const unread = props.messages.filter(
    (m) => m.author_id !== props.you && m.time > seen,
  ).length;
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
          <small>Type your answer below, or use the optional radio.</small>
        </p>
        <details className="optional-radio">
          <summary>Voice radio (optional)</summary>
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
            props.messages.slice(-15).map((m) => (
              <article
                key={m.id}
                className={m.author_id === props.you ? "mine" : ""}
              >
                <small>{m.author_id === props.you ? "YOU" : m.author}</small>
                {m.kind === "clue" ? (
                  <button
                    className="shared-clue-message"
                    onClick={() => props.onClue(m.evidence_id!)}
                  >
                    <Link2 size={15} />
                    <span>
                      Added to both notebooks<strong>{m.text}</strong>
                    </span>
                  </button>
                ) : (
                  <p>{m.text}</p>
                )}
              </article>
            ))
          )}
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim() || busy) return;
            setBusy(true);
            setError("");
            try {
              if (await props.onMessage(text)) {
                setText("");
              } else setError("Message not sent. Your draft is still here.");
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
              disabled={!props.enabled}
            />
            <button
              aria-label="Send partner message"
              disabled={busy || !text.trim() || !props.enabled}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
        {error && <p role="alert">{error}</p>}
      </div>
    </aside>
  );
}
