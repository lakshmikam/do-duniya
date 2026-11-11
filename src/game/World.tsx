import { memo } from "react";
import { ROOM_ART } from "./artwork";
import { CharacterPortrait } from "./CharacterPortrait";
function WorldScene({
  blue = false,
  location,
}: {
  blue?: boolean;
  location?: string;
}) {
  const art =
    ROOM_ART[location || (blue ? "street" : "platform")] ||
    ROOM_ART[blue ? "street" : "platform"];
  return (
    <img
      className="scene-artwork"
      src={art.src}
      alt={art.alt}
      width={art.width}
      height={art.height}
      decoding="async"
      draggable={false}
    />
  );
}
function CharacterIllustration({
  id,
  talking = false,
}: {
  id: string;
  talking?: boolean;
}) {
  return (
    <span
      className={
        "game-character illustrated-character " + (talking ? "talking" : "")
      }
    >
      <CharacterPortrait id={id} />
    </span>
  );
}
export const World = memo(WorldScene);
export const GameCharacter = memo(CharacterIllustration);
