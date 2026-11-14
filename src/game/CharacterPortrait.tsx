import { CHARACTER_ART } from "./artwork";
export function CharacterPortrait({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const art = CHARACTER_ART[id];
  if (!art)
    return (
      <svg
        className={"character-portrait " + className}
        viewBox="0 0 240 679"
        role="img"
        aria-label={
          id === "oakshott" ? "Mrs Oakshott, goose keeper" : "Witness portrait"
        }
      >
        <path
          d="M55 235 Q40 170 88 143 Q120 120 158 147 Q207 170 180 235 Z"
          fill="#84705a"
        />
        <ellipse cx="120" cy="206" rx="46" ry="57" fill="#d5ad87" />
        <path
          d="M74 181 Q120 155 165 184 L157 150 Q120 122 83 153Z"
          fill="#e6d6bb"
        />
        <path
          d="M70 266 Q120 245 171 267 L207 580 Q120 640 34 580Z"
          fill="#5a6554"
        />
        <path d="M95 266 L145 266 L169 583 Q120 610 70 583Z" fill="#d8cab0" />
        <path
          d="M68 288 L40 438 L66 452 L101 312 M172 288 L199 438 L174 452 L139 312"
          stroke="#7e8a73"
          strokeWidth="20"
          fill="none"
        />
        <path
          d="M73 593 L70 649 L102 649 L108 602 M134 602 L140 649 L172 649 L167 593"
          fill="#342c26"
        />
      </svg>
    );
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
