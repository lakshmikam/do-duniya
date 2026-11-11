/** User-provided illustrations. They never supply game facts or unlocks. */
export const ROOM_ART: Record<
  string,
  { src: string; alt: string; width: number; height: number }
> = {
  platform: {
    src: "/art/platform-wide-v2.png",
    width: 1983,
    height: 793,
    alt: "Rain falling over Platform 3 beside the night train",
  },
  office: {
    src: "/art/station-office-wide-v2.png",
    width: 1920,
    height: 819,
    alt: "A lamplit station office with tea, paperwork and a rain-streaked window",
  },
  console: {
    src: "/art/station-office-wide-v2.png",
    width: 1920,
    height: 819,
    alt: "Station broadcast equipment, microphone and key board",
  },
  records: {
    src: "/art/station-office-wide-v2.png",
    width: 1920,
    height: 819,
    alt: "The station records desk and wall maps",
  },
  relay: {
    src: "/art/relay-store-wide-v2.png",
    width: 1920,
    height: 819,
    alt: "A locked equipment-store door beyond the service passage",
  },
  street: {
    src: "/art/baker-street-level-v3.png",
    width: 1944,
    height: 809,
    alt: "Baker Street study with a jewel on the desk and firelight in the hearth",
  },
  market: {
    src: "/art/covent-garden-wide-v2.png",
    width: 1920,
    height: 819,
    alt: "Breckinridge’s poultry stall and supplier ledger in snowy Covent Garden",
  },
  brixton: {
    src: "/art/covent-garden-wide-v2.png",
    width: 1920,
    height: 819,
    alt: "Illustrative London poultry scene accompanying the Brixton investigation",
  },
  hotel: {
    src: "/art/baker-street-level-v3.png",
    width: 1944,
    height: 809,
    alt: "Illustrative lamplit study accompanying the hotel dossier",
  },
  ledger: {
    src: "/art/baker-street-level-v3.png",
    width: 1944,
    height: 809,
    alt: "The study desk accompanying the supplier records",
  },
};
export const CHARACTER_ART: Record<
  string,
  { src: string; name: string; panel?: number }
> = {
  dev: { src: "/art/dev-cutout.png", name: "Dev Rao" },
  leela: { src: "/art/leela-cutout.png", name: "Leela Das" },
  mira: { src: "/art/mira-cutout.png", name: "Mira Joseph" },
  arun: { src: "/art/arun-cutout.png", name: "Arun Sen" },
  henry: { src: "/art/henry-cutout.png", name: "Henry Baker" },
  dealer: { src: "/art/dealer-cutout.png", name: "Breckinridge" },
  james: { src: "/art/james-cutout.png", name: "James Ryder" },
  inspector: { src: "/art/inspector-cutout.png", name: "Inspector Bradstreet" },
};
export const CLUE_PINS: Record<string, [number, number]> = {
  seal: [43, 85],
  tracks: [61, 75],
  note: [55, 79],
  receipt: [46, 76],
  broadcast: [71, 70],
  access: [21, 42],
  docket: [76, 91],
  route: [61, 30],
  clock: [20, 14],
  found: [49, 50],
  admission: [30, 48],
  stone: [50, 72],
  alpha: [26, 83],
  supplier: [61, 78],
  arrest: [55, 76],
  ryder: [61, 78],
  cusack: [36, 82],
  twins: [35, 55],
  baker: [50, 72],
  visitor: [34, 80],
  confession: [53, 65],
};

/** Feet on the actual foreground floor, in the shared 1200 by 720 camera. */
export const ACTOR_FEET: Record<string, { x: number; y: number }[]> = {
  platform: [
    { x: 630, y: 646 },
    { x: 1010, y: 620 },
  ],
  console: [{ x: 1040, y: 650 }],
  office: [],
  records: [],
  relay: [],
  street: [{ x: 1030, y: 650 }],
  market: [{ x: 220, y: 650 }],
  brixton: [{ x: 220, y: 650 }],
  hotel: [{ x: 1030, y: 650 }],
  ledger: [{ x: 1030, y: 650 }],
};

/** Match the camera to the actual asset. A uniform scale preserves all edges. */
export function fitRoomCamera(
  viewWidth: number,
  viewHeight: number,
  imageWidth: number,
  imageHeight: number,
) {
  const height = (1200 * imageHeight) / imageWidth;
  return {
    width: 1200,
    height,
    scale: Math.max(0.01, Math.min(viewWidth / 1200, viewHeight / height)),
    yFactor: height / 720,
  };
}
