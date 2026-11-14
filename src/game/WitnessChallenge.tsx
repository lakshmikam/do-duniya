import { useEffect, useState } from "react";

export type Statement = {
  id: string;
  character_id: string;
  character: string;
  role: string;
  text: string;
  status: "unchallenged" | "contradicted" | "supported";
  evidence_ids: string[];
};

type Props = {
  character: string;
  statements: Statement[];
  evidence: { id: string; title: string; text: string }[];
  disabled?: boolean;
  onPresent: (claim: string, evidence: string) => Promise<void>;
};

/** A single focused comparison, kept inside the conversation rather than the scene. */
export function WitnessChallenge({
  character,
  statements,
  evidence,
  disabled,
  onPresent,
}: Props) {
  const claims = statements.filter((s) => s.character_id === character);
  const [claim, setClaim] = useState(""),
    [item, setItem] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setClaim("");
    setItem("");
  }, [character]);
  if (!claims.length) return null;
  const selected = evidence.find((e) => e.id === item);
  return (
    <details className="witness-challenge">
      <summary>
        Test this account with evidence{" "}
        <span>
          {claims.filter((s) => s.status === "contradicted").length} challenged
        </span>
      </summary>
      <p className="smallprint">
        Choose their exact claim and a passage from your shared notebook. A
        suspicion is not a contradiction.
      </p>
      <label>
        What they said
        <select
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          disabled={disabled || pending}
        >
          <option value="">Choose a statement</option>
          {claims.map((s) => (
            <option key={s.id} value={s.id}>
              {s.text} {s.status !== "unchallenged" ? `(${s.status})` : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        Compare with
        <select
          value={item}
          onChange={(e) => setItem(e.target.value)}
          disabled={disabled || pending}
        >
          <option value="">Choose discovered evidence</option>
          {evidence.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </label>
      {selected && <p className="challenge-passage">{selected.text}</p>}
      <button
        className="secondary full"
        disabled={disabled || pending || !claim || !item}
        onClick={async () => {
          setPending(true);
          try {
            await onPresent(claim, item);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Hearing their response…" : "Present this evidence"}
      </button>
      {!evidence.length && (
        <p className="smallprint">
          Inspect a clue or ask your partner to check a record first.
        </p>
      )}
    </details>
  );
}

export function StatementPages({ statements }: { statements: Statement[] }) {
  const names = [...new Set(statements.map((s) => s.character_id))];
  return (
    <article className="notebook-sheet statement-pages">
      <p className="notebook-small-caps">
        Witness accounts / shared with your partner
      </p>
      <h3>Words to test.</h3>
      <p>
        Statements record what a witness claims, not established fact. Visit the
        witness to compare a claim with a discovered passage.
      </p>
      {!names.length && <p>Meet a witness to begin recording their account.</p>}
      {names.map((id) => (
        <section key={id}>
          <h4>{statements.find((s) => s.character_id === id)?.character}</h4>
          {statements
            .filter((s) => s.character_id === id)
            .map((s) => (
              <div className="statement-entry" key={s.id}>
                <span className={`statement-status ${s.status}`}>
                  {s.status}
                </span>
                <p>“{s.text}”</p>
              </div>
            ))}
        </section>
      ))}
    </article>
  );
}
