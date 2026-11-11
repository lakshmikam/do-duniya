import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Fingerprint, Volume2, X } from "lucide-react";

export type NotebookEvidence = {
  id: string;
  title: string;
  text: string;
  kind: string;
  role: string;
  location: string;
  shared: boolean;
};
type NotebookMessage = {
  evidence_id?: string;
  author: string;
  time: number;
  kind: string;
};
type NotebookHint = { id: string; text: string; by?: string };
export type CaseNotebookProps = {
  caseTitle: string;
  caseNumber: string;
  evidence: NotebookEvidence[];
  messages?: NotebookMessage[];
  hints?: NotebookHint[];
  onClose: () => void;
  onRead?: (evidence: NotebookEvidence) => void;
  onHint?: () => void;
  hintsRemaining?: number;
};

function finder(role: string) {
  return role === "field"
    ? "Field investigator"
    : role === "archive"
      ? "Records investigator"
      : "Investigator";
}

function filedDate(time?: number) {
  if (!time || !Number.isFinite(time)) return "Not yet shared";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time * 1000));
}

/** A journal view of evidence the server has already made visible. No new facts. */
export function CaseNotebook({
  caseTitle,
  caseNumber,
  evidence,
  messages = [],
  hints = [],
  onClose,
  onRead,
  onHint,
  hintsRemaining = 0,
}: CaseNotebookProps) {
  const titleId = useId(),
    pageId = useId(),
    selectId = useId();
  const [selectedId, setSelectedId] = useState(evidence[0]?.id || ""),
    [section, setSection] = useState<"evidence" | "hints">("evidence"),
    [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const dialog = useRef<HTMLDivElement>(null),
    page = useRef<HTMLDivElement>(null),
    seenIds = useRef(new Set(evidence.map((item) => item.id))),
    latest = useRef({ onClose, selectedId, section, evidence });
  latest.current = { onClose, selectedId, section, evidence };
  const idsKey = evidence.map((item) => item.id).join("\u001f");

  function choose(id: string) {
    setSelectedId(id);
    setSection("evidence");
    setFreshIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  useEffect(() => {
    const ids = new Set(evidence.map((item) => item.id));
    const added = evidence.filter((item) => !seenIds.current.has(item.id));
    for (const id of ids) seenIds.current.add(id);
    const nextSelected = ids.has(selectedId)
      ? selectedId
      : evidence[0]?.id || "";
    if (nextSelected !== selectedId) setSelectedId(nextSelected);
    setFreshIds((current) => {
      const next = new Set([...current].filter((id) => ids.has(id)));
      for (const item of added) if (item.id !== nextSelected) next.add(item.id);
      return next;
    });
  }, [idsKey]);

  useEffect(() => {
    page.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedId, section]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        latest.current.onClose();
        return;
      }
      if (event.key === "Tab" && dialog.current) {
        const controls = [
          ...Array.from(
            dialog.current.querySelectorAll<HTMLElement>(
              "button:not(:disabled),select:not(:disabled),a[href],[tabindex='0']",
            ),
          ),
          ...Array.from(
            document.querySelectorAll<HTMLElement>(
              "[data-partner-dock] button:not(:disabled),[data-partner-dock] input:not(:disabled)",
            ),
          ),
        ].filter((element) => element.getClientRects().length > 0);
        if (!controls.length) {
          event.preventDefault();
          dialog.current.focus();
          return;
        }
        const first = controls[0],
          last = controls[controls.length - 1];
        if (
          (!dialog.current.contains(document.activeElement) &&
            !(document.activeElement as HTMLElement)?.closest(
              "[data-partner-dock]",
            )) ||
          document.activeElement === dialog.current
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      const target = event.target as HTMLElement;
      if (
        latest.current.section === "evidence" &&
        !["SELECT", "INPUT", "TEXTAREA"].includes(target.tagName) &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        const current = latest.current.evidence.findIndex(
          (item) => item.id === latest.current.selectedId,
        );
        const next =
          latest.current.evidence[
            current + (event.key === "ArrowRight" ? 1 : -1)
          ];
        if (next) {
          event.preventDefault();
          choose(next.id);
        }
      }
    };
    document.addEventListener("keydown", handle, true);
    return () => {
      document.removeEventListener("keydown", handle, true);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const selected = evidence.find((item) => item.id === selectedId);
  const index = selected
    ? evidence.findIndex((item) => item.id === selected.id)
    : -1;
  const sharedEntry = selected
    ? messages.find(
        (message) =>
          message.kind === "clue" && message.evidence_id === selected.id,
      )
    : undefined;

  return (
    <div
      className="case-notebook-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="case-notebook"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialog}
      >
        <header className="notebook-cover-label">
          <span>DO DUNIYA / CASE {caseNumber}</span>
          <h2 id={titleId}>Investigator’s notebook</h2>
          <button
            className="notebook-close"
            onClick={onClose}
            aria-label="Close notebook"
          >
            <X size={22} />
          </button>
        </header>
        <div className="notebook-spread">
          <aside className="notebook-index-page">
            <div className="notebook-ex-libris" aria-hidden="true">
              <Fingerprint size={28} strokeWidth={1.2} />
            </div>
            <p className="notebook-small-caps">Case journal / {caseNumber}</p>
            <h3>{caseTitle}</h3>
            <p className="notebook-index-caption">
              The record so far. Compare the details before deciding what they
              mean.
            </p>
            <nav
              className="notebook-section-tabs"
              aria-label="Notebook sections"
            >
              <button
                aria-pressed={section === "evidence"}
                className={section === "evidence" ? "selected" : ""}
                onClick={() => setSection("evidence")}
              >
                Evidence <span>{evidence.length}</span>
              </button>
              <button
                aria-pressed={section === "hints"}
                className={section === "hints" ? "selected" : ""}
                onClick={() => setSection("hints")}
              >
                Case assistant <span>{hints.length}</span>
              </button>
            </nav>
            <div className="notebook-mobile-index">
              <label htmlFor={selectId}>Open an evidence page</label>
              <select
                id={selectId}
                value={selectedId}
                disabled={!evidence.length || section !== "evidence"}
                onChange={(event) => choose(event.target.value)}
              >
                {!evidence.length && (
                  <option value="">No evidence recorded yet</option>
                )}
                {evidence.map((item, itemIndex) => (
                  <option key={item.id} value={item.id}>
                    {String(itemIndex + 1).padStart(2, "0")} / {item.title}
                    {freshIds.has(item.id) ? " — NEW" : ""}
                  </option>
                ))}
              </select>
            </div>
            <nav
              className="notebook-evidence-index"
              aria-label="Evidence page index"
            >
              <ol>
                {evidence.map((item, itemIndex) => (
                  <li key={item.id}>
                    <button
                      onClick={() => choose(item.id)}
                      aria-current={
                        section === "evidence" && item.id === selectedId
                          ? "page"
                          : undefined
                      }
                    >
                      <span className="notebook-index-number">
                        {String(itemIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="notebook-index-title">{item.title}</span>
                      {freshIds.has(item.id) ? (
                        <strong className="notebook-new-mark">NEW</strong>
                      ) : (
                        <span className="notebook-index-visibility">
                          {item.shared ? "shared" : "private"}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="notebook-index-footnote">
              <span className="notebook-seal" aria-hidden="true">
                D / D
              </span>
              <p>Private discoveries remain private until you share them.</p>
            </div>
          </aside>
          <div className="notebook-binding" aria-hidden="true">
            {[18, 34, 50, 66, 82].map((top) => (
              <i key={top} style={{ top: `${top}%` }} />
            ))}
          </div>
          <section
            className="notebook-reading-page"
            aria-label="Open journal page"
          >
            <div className="notebook-page-scroll" ref={page}>
              {section === "hints" ? (
                <article className="notebook-sheet" key="notes">
                  <p className="notebook-small-caps">
                    Marginalia / requested hints
                  </p>
                  <h3>A nudge, when you need it.</h3>
                  <p className="notebook-note-warning">
                    3 hints per case, shared by both players.
                  </p>
                  {hints.length ? (
                    <ol className="notebook-written-notes">
                      {hints.map((hint) => (
                        <li key={hint.id}>
                          {hint.by && <small>{hint.by}</small>}
                          <p>{hint.text}</p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="notebook-empty-page">
                      <p>No hints have been requested.</p>
                      <span>
                        Compare your accounts with your partner first. Ask the
                        Case assistant when your team wants another lead to
                        follow.
                      </span>
                    </div>
                  )}
                  {onHint && (
                    <div className="notebook-coach-entry">
                      <span>
                        {Math.max(0, Math.min(3, Math.floor(hintsRemaining)))}{" "}
                        of 3 hints remaining
                      </span>
                      <button
                        className="notebook-listen"
                        onClick={onHint}
                        disabled={hintsRemaining <= 0}
                      >
                        {hintsRemaining > 0
                          ? "Open Case assistant"
                          : "All hints used"}
                      </button>
                    </div>
                  )}
                </article>
              ) : selected ? (
                <article
                  className="notebook-sheet"
                  key={selected.id}
                  aria-labelledby={pageId}
                >
                  <div className="notebook-page-topline">
                    <span className="notebook-small-caps">
                      Entry {String(index + 1).padStart(2, "0")} /{" "}
                      {selected.kind.replaceAll("_", " ")}
                    </span>
                    <span
                      className={
                        "notebook-status-stamp " +
                        (selected.shared ? "shared" : "private")
                      }
                    >
                      {selected.shared ? "SHARED RECORD" : "PRIVATE DISCOVERY"}
                    </span>
                  </div>
                  <h3 id={pageId}>{selected.title}</h3>
                  <dl className="notebook-filing-details">
                    <div>
                      <dt>Recovered by</dt>
                      <dd>{finder(selected.role)}</dd>
                    </div>
                    <div>
                      <dt>Shared by</dt>
                      <dd>
                        {selected.shared
                          ? sharedEntry?.author || "Your team"
                          : "Not yet shared"}
                      </dd>
                    </div>
                    <div>
                      <dt>Added to journal</dt>
                      <dd>
                        {selected.shared
                          ? sharedEntry
                            ? filedDate(sharedEntry.time)
                            : "Share time not recorded"
                          : "Private record"}
                      </dd>
                    </div>
                  </dl>
                  <div className="notebook-transcription">
                    <p>{selected.text}</p>
                  </div>
                  <div className="notebook-original-footer">
                    <span className="notebook-small-caps">
                      Original passage · wording preserved
                    </span>
                    {onRead && (
                      <button
                        className="notebook-listen"
                        onClick={() => onRead(selected)}
                      >
                        <Volume2 size={17} />
                        Listen / inspect original
                      </button>
                    )}
                  </div>
                </article>
              ) : (
                <article
                  className="notebook-sheet notebook-empty-sheet"
                  key="empty"
                >
                  <p className="notebook-small-caps">
                    An open case / a clean page
                  </p>
                  <h3>Start with what you can see.</h3>
                  <div className="notebook-empty-page">
                    <p>Your evidence will be recorded here.</p>
                    <span>
                      Inspect an object or question a witness. Each discovery
                      gets its own page, with the original passage kept intact.
                    </span>
                    <span>
                      Both players receive each discovery automatically. New
                      entries will be marked in the index without moving the
                      page you are reading.
                    </span>
                  </div>
                </article>
              )}
            </div>
            <footer className="notebook-page-navigation">
              <button
                disabled={section !== "evidence" || index <= 0}
                onClick={() => choose(evidence[index - 1].id)}
                aria-label="Previous evidence page"
              >
                <ArrowLeft size={18} />
                <span>Previous</span>
              </button>
              <span role="status" aria-live="polite">
                {section === "hints"
                  ? "Case assistant"
                  : index >= 0
                    ? `${index + 1} / ${evidence.length}`
                    : "— / —"}
              </span>
              <button
                disabled={
                  section !== "evidence" ||
                  index < 0 ||
                  index >= evidence.length - 1
                }
                onClick={() => choose(evidence[index + 1].id)}
                aria-label="Next evidence page"
              >
                <span>Next</span>
                <ArrowRight size={18} />
              </button>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
