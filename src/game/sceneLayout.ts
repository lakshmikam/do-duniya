/** Geometry shared by rendering and checks. Labels live outside the scene. */
export type ScenePoint = { x: number; y: number };
export type SceneRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};
export type SceneSlot = ScenePoint & {
  bounds: SceneRect;
  approach: ScenePoint;
};
export type SceneLayout = {
  width: number;
  height: number;
  markerSize: number;
  actorWidth: number;
  actorHeight: number;
  playerWidth: number;
  playerHeight: number;
  frontLane: number;
  spawn: ScenePoint;
  objects: SceneSlot[];
  actors: SceneSlot[];
};
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function playerRect(
  point: ScenePoint,
  width: number,
  height: number,
): SceneRect {
  return { left: point.x - width / 2, top: point.y - height, width, height };
}
export function overlaps(a: SceneRect, b: SceneRect, gap = 0): boolean {
  return !(
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left ||
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top
  );
}
export function sceneLayout(
  rawWidth: number,
  objectCount: number,
  actorCount: number,
  availableHeight?: number,
): SceneLayout {
  const width = Math.max(280, rawWidth),
    small = width < 500;
  const markerSize = 48,
    actorWidth = small ? 64 : 76,
    playerWidth = small ? 38 : 44;
  const columns = Math.min(
    Math.max(1, objectCount),
    small ? 3 : width < 850 ? 4 : 5,
  );
  const rows = Math.max(1, Math.ceil(objectCount / columns));
  const naturalHeight = Math.ceil(
    Math.max(
      420,
      width * 0.52,
      2 * ((rows - 1) * 62 + markerSize / 2 + (small ? 102 : 120) + 18),
    ),
  );
  const height = availableHeight
    ? Math.max(
        200,
        rows * 62 + 100,
        Math.min(naturalHeight, Math.floor(availableHeight)),
      )
    : naturalHeight;
  const actorHeight = Math.min(small ? 102 : 120, Math.floor(height * 0.3));
  const playerHeight = Math.min(small ? 76 : 86, Math.floor(height * 0.24));
  const frontLane = height - 16;
  const actorXs =
    actorCount === 1
      ? [0.71]
      : actorCount === 2
        ? [0.34, 0.72]
        : Array.from(
            { length: actorCount },
            (_, i) => 0.19 + (i * 0.62) / Math.max(1, actorCount - 1),
          );
  const actors: SceneSlot[] = actorXs.map((f) => {
    const x = width * f,
      y = height * (height < 400 ? 0.64 : 0.72);
    return {
      x,
      y,
      bounds: playerRect({ x, y }, actorWidth, actorHeight),
      approach: { x: 0, y: 0 },
    };
  });
  const objects: SceneSlot[] = Array.from({ length: objectCount }, (_, i) => {
    const col = i % columns,
      row = Math.floor(i / columns),
      x =
        columns === 1
          ? width * 0.27
          : width * (0.17 + (col * 0.66) / (columns - 1)),
      y = height * (height < 400 ? 0.16 : 0.22) + row * 62;
    return {
      x,
      y,
      bounds: {
        left: x - markerSize / 2,
        top: y - markerSize / 2,
        width: markerSize,
        height: markerSize,
      },
      approach: { x: 0, y: 0 },
    };
  });
  const bounds = [...objects, ...actors].map((s) => s.bounds),
    padding = 8;
  function safe(point: ScenePoint) {
    const r = playerRect(point, playerWidth, playerHeight);
    return (
      r.left >= padding &&
      r.left + r.width <= width - padding &&
      r.top >= padding &&
      point.y <= height - padding &&
      bounds.every((b) => !overlaps(r, b, padding))
    );
  }
  const edges = [
      0,
      ...actors.flatMap((a) => [a.bounds.left, a.bounds.left + a.bounds.width]),
      width,
    ].sort((a, b) => a - b),
    corridorXs = edges.slice(0, -1).map((e, i) => (e + edges[i + 1]) / 2);
  function approachFor(slot: SceneSlot, person: boolean): ScenePoint {
    const nearFoot = height * (height < 400 ? 0.64 : 0.72) + 8,
      ys = person
        ? [slot.y + 8, slot.y + playerHeight + 12, frontLane]
        : [nearFoot, slot.y + playerHeight + markerSize / 2 + 14, frontLane],
      xs = [
        slot.x,
        slot.x - (actorWidth + playerWidth) / 2 - 10,
        slot.x + (actorWidth + playerWidth) / 2 + 10,
        ...corridorXs,
      ];
    const candidates = ys
      .flatMap((y) =>
        xs.map((x) => ({
          x: clamp(
            x,
            padding + playerWidth / 2,
            width - padding - playerWidth / 2,
          ),
          y: clamp(y, playerHeight + padding, frontLane),
        })),
      )
      .filter(safe);
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - slot.x, (a.y - (person ? slot.y : nearFoot)) * 0.65) -
        Math.hypot(b.x - slot.x, (b.y - (person ? slot.y : nearFoot)) * 0.65),
    );
    return candidates[0] || { x: padding + playerWidth / 2, y: frontLane };
  }
  for (const slot of objects) slot.approach = approachFor(slot, false);
  for (const slot of actors) slot.approach = approachFor(slot, true);
  return {
    width,
    height,
    markerSize,
    actorWidth,
    actorHeight,
    playerWidth,
    playerHeight,
    frontLane,
    spawn: { x: padding + playerWidth / 2, y: frontLane },
    objects,
    actors,
  };
}
export function scenePath(
  start: ScenePoint,
  destination: ScenePoint,
  layout: SceneLayout,
): ScenePoint[] {
  // Lateral travel stays in the empty foreground; vertical approaches remain
  // in a clear corridor, rather than cutting through another character.
  const points = [
    { x: start.x, y: layout.frontLane },
    { x: destination.x, y: layout.frontLane },
    destination,
  ];
  let previous = start;
  return points.filter((p) => {
    const useful = Math.hypot(p.x - previous.x, p.y - previous.y) > 1;
    if (useful) previous = p;
    return useful;
  });
}
