import { CHARACTER_ART } from "./artwork";
export function CharacterPortrait({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const art = CHARACTER_ART[id];
  if (!art) return null;
  if (art.panel !== undefined)
    return (
      <span
        role="img"
        aria-label={art.name}
        className={"character-portrait cast-panel " + className}
        style={{
          backgroundImage: `url("${art.src}")`,
          backgroundPosition: `${[2, 34.7, 66.6, 98][art.panel]}% 2%`,
        }}
      />
    );
  return (
    <img
      className={"character-portrait " + className}
      src={art.src}
      alt={art.name}
      width="240"
      height="679"
      decoding="async"
    />
  );
}
