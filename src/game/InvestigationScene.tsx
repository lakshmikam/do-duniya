import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { World, GameCharacter } from "./World";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { sceneLayout, scenePath, type ScenePoint } from "./sceneLayout";

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
type Selection = { type: "object" | "person"; id: string } | null;
/** Scene presentation cannot grant evidence: all interactions call the parent. */
export function InvestigationScene(props: Props) {
  const root = useRef<HTMLElement>(null),
    stage = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    generation = useRef(0),
    reduced = useRef(false),
    current = useRef<ScenePoint>({ x: 28, y: 404 });
  latest.current = props;
  const seen = useRef(
    new Set(props.objects.filter((o) => o.discovered).map((o) => o.id)),
  );
  const [recent, setRecent] = useState<Set<string>>(new Set());
  const foundKey = props.objects
    .filter((o) => o.discovered)
    .map((o) => o.id)
    .join("|");
  useEffect(() => {
    const added = props.objects
      .filter((o) => o.discovered && !seen.current.has(o.id))
      .map((o) => o.id);
    props.objects
      .filter((o) => o.discovered)
      .forEach((o) => seen.current.add(o.id));
    if (!added.length) return;
    setRecent(new Set(added));
    const t = setTimeout(() => setRecent(new Set()), 1500);
    return () => clearTimeout(t);
  }, [foundKey]);
  const [width, setWidth] = useState(375),
    [availableHeight, setAvailableHeight] = useState(420),
    [position, setPosition] = useState<ScenePoint>({ x: 28, y: 404 }),
    [walking, setWalking] = useState(false),
    [selection, setSelection] = useState<Selection>(null),
    [duration, setDuration] = useState(300);
  const layout = useMemo(
    () => sceneLayout(1200, props.objects.length, props.characters.length, 720),
    [props.objects.length, props.characters.length],
  );
  function cancel(clearSelection = false) {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setWalking(false);
    if (clearSelection) setSelection(null);
  }
  useLayoutEffect(() => {
    const element = root.current!;
    const measure = () => {
      const next = Math.round(element.getBoundingClientRect().width);
      const h = Math.round(stage.current?.getBoundingClientRect().height || 0);
      if (h > 0)
        setAvailableHeight((previous) =>
          Math.abs(previous - h) > 1 ? h : previous,
        );
      if (next > 0)
        setWidth((previous) =>
          Math.abs(previous - next) > 1 ? next : previous,
        );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    cancel(true);
    current.current = layout.spawn;
    setPosition(layout.spawn);
  }, [props.location, layout]);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)"),
      preference = () => {
        reduced.current = query.matches;
      };
    preference();
    query.addEventListener("change", preference);
    const hide = () => {
      if (document.hidden) cancel();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      generation.current++;
      if (timer.current) clearTimeout(timer.current);
      query.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    if (props.disabled) cancel();
  }, [props.disabled]);
  function approach(type: "object" | "person", index: number, id: string) {
    if (props.disabled) return;
    cancel();
    const ticket = generation.current,
      location = props.location,
      slot = type === "person" ? layout.actors[index] : layout.objects[index];
    if (!slot) return;
    setSelection({ type, id });
    const arrive = () => {
      setWalking(false);
      timer.current = null;
      if (
        generation.current !== ticket ||
        latest.current.disabled ||
        latest.current.location !== location
      )
        return;
      if (type === "person") latest.current.onTalk(id);
      else latest.current.onInspect(id);
    };
    if (reduced.current) {
      current.current = slot.approach;
      setPosition(slot.approach);
      arrive();
      return;
    }
    const points = scenePath(current.current, slot.approach, layout);
    function step() {
      if (generation.current !== ticket || latest.current.disabled) return;
      const next = points.shift();
      if (!next) {
        arrive();
        return;
      }
      const ms = Math.max(
        130,
        Math.min(
          430,
          Math.hypot(next.x - current.current.x, next.y - current.current.y) /
            0.68,
        ),
      );
      setDuration(ms);
      setWalking(true);
      current.current = next;
      setPosition(next);
      timer.current = setTimeout(step, ms + 15);
    }
    step();
  }
  const selectedObject =
      selection?.type === "object"
        ? props.objects.find((o) => o.id === selection.id)
        : null,
    selectedPerson =
      selection?.type === "person"
        ? props.characters.find((c) => c.id === selection.id)
        : null;
  const focusIndex =
      selection?.type === "object"
        ? props.objects.findIndex((o) => o.id === selection.id)
        : -1,
    focus = focusIndex >= 0 ? layout.objects[focusIndex] : null;
  return (
    <section
      ref={root}
      className={
        "investigation-scene room-view " + (props.disabled ? "paused" : "")
      }
      aria-label="Investigate this location"
    >
      <div className="room-stage" ref={stage}>
        <div
          className="scene-canvas"
          style={{
            width: 1200,
            height: 720,
            transform: `translate(-50%,-50%) scale(${Math.min(width / 1200, availableHeight / 720)})`,
          }}
        >
          <div className="room-world">
            <World location={props.location} blue={props.blue} />
          </div>
          <div className="room-colour-grade" />
          <div className="room-window-light" aria-hidden="true" />
          <div className="room-floor-grid" aria-hidden="true" />
          <div className="room-camera-corners" aria-hidden="true" />
          {focus && (
            <div
              className="room-inspection-light"
              style={{ left: focus.x, top: focus.y }}
              aria-hidden="true"
            />
          )}
          {props.objects.map((object, index) => {
            const slot = layout.objects[index];
            return (
              <button
                key={object.id}
                className={
                  "room-object-marker " +
                  (recent.has(object.id) ? "just-found " : "") +
                  (selection?.id === object.id && selection.type === "object"
                    ? "selected "
                    : "") +
                  (object.discovered ? "reviewed" : "")
                }
                style={{
                  left: slot.x,
                  top: slot.y,
                  width: layout.markerSize,
                  height: layout.markerSize,
                }}
                disabled={props.disabled}
                onClick={() => approach("object", index, object.id)}
                aria-label={`${index + 1}. ${object.discovered ? "Review" : "Inspect"} ${object.title}`}
                aria-pressed={
                  selection?.id === object.id && selection.type === "object"
                }
              >
                <span className="marker-prop" aria-hidden="true">
                  {object.kind === "audio" ? (
                    <svg viewBox="0 0 34 25">
                      <rect x="2" y="3" width="30" height="19" rx="2" />
                      <path d="M7 8h20M7 12h20M7 16h11" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 32 30">
                      <path d="M6 3h18l4 5v19H6Z" />
                      <path d="M11 12h12M11 17h10M11 22h11" />
                    </svg>
                  )}
                </span>
                <span className="marker-label">{object.title}</span>
                <span className="marker-number">
                  {props.blue && <span aria-hidden="true">◇</span>}
                  {String(index + 1).padStart(2, "0")}
                </span>
                {object.discovered && (
                  <Check
                    className="marker-check"
                    size={11}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
          {props.characters.map((character, index) => {
            const slot = layout.actors[index];
            return (
              <button
                key={character.id}
                className={
                  "room-actor " +
                  (position.x < slot.x ? "facing-left " : "facing-right ") +
                  (selection?.id === character.id && selection.type === "person"
                    ? "selected"
                    : "")
                }
                style={{
                  left: slot.x,
                  top: slot.y,
                  width: layout.actorWidth,
                  height: layout.actorHeight,
                }}
                disabled={props.disabled}
                onClick={() => approach("person", index, character.id)}
                aria-label={`Speak with ${character.name}`}
                aria-pressed={
                  selection?.id === character.id && selection.type === "person"
                }
              >
                <GameCharacter id={character.id} />
                <span className="actor-letter" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
              </button>
            );
          })}
          <div
            className={"room-investigator " + (walking ? "walking" : "")}
            style={{
              left: position.x,
              top: position.y,
              width: layout.playerWidth,
              height: layout.playerHeight,
              transitionDuration: `${duration}ms`,
            }}
            aria-hidden="true"
          >
            <GameCharacter id="investigator" />
          </div>
        </div>
      </div>
      <details className="scene-index" open={width < 650 ? true : undefined}>
        <summary>
          <span>People &amp; objects</span>
          <span>{props.objects.length + props.characters.length}</span>
        </summary>
        <div className="room-action-rail">
          <section
            className="room-object-list"
            aria-label="Objects in this room"
          >
            <h3>
              Inspect the room <span>{props.objects.length}</span>
            </h3>
            <div>
              {props.objects.map((object, index) => (
                <button
                  key={object.id}
                  disabled={props.disabled}
                  className={
                    selection?.id === object.id && selection.type === "object"
                      ? "selected"
                      : ""
                  }
                  onClick={() => approach("object", index, object.id)}
                >
                  <span className="rail-code">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="rail-name">
                    {object.title}
                    <small>
                      {object.discovered
                        ? "In your notebook"
                        : object.kind === "audio"
                          ? "Audio record"
                          : object.kind === "testimony"
                            ? "Witness account"
                            : "Inspect"}
                    </small>
                  </span>
                  {object.discovered ? (
                    <Check size={15} />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                </button>
              ))}
              {props.objects.length === 0 && (
                <p className="room-list-empty">
                  No objects available here yet.
                </p>
              )}
            </div>
          </section>
          <section
            className="room-person-list"
            aria-label="People in this room"
          >
            <h3>
              Speak to someone <span>{props.characters.length}</span>
            </h3>
            <div>
              {props.characters.map((character, index) => (
                <button
                  key={character.id}
                  disabled={props.disabled}
                  className={
                    selection?.id === character.id &&
                    selection.type === "person"
                      ? "selected"
                      : ""
                  }
                  onClick={() => approach("person", index, character.id)}
                >
                  <span className="rail-code person-code">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="rail-name">
                    {character.name}
                    <small>Conversation</small>
                  </span>
                  <MessageCircle size={16} />
                </button>
              ))}
              {props.characters.length === 0 && (
                <p className="room-list-empty">
                  No witnesses in this location.
                </p>
              )}
            </div>
          </section>
        </div>
      </details>
      <p className="room-instruction" role="status">
        <span className={walking ? "is-travelling" : ""} aria-hidden="true" />
        {walking
          ? `Approaching ${selectedPerson?.name || selectedObject?.title || "the next lead"}…`
          : props.disabled
            ? "Close the conversation or document to continue."
            : selection
              ? `${props.playerName || "You"} · ${selectedPerson ? "With " + selectedPerson.name : selectedObject ? "Examining " + selectedObject.title : "Ready to continue"}`
              : "Choose an object or person. You will walk over and investigate."}
      </p>
    </section>
  );
}
