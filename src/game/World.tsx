import { memo, useId } from "react";
import { BlueWorld } from "./BlueWorld";

/** Native vector environments: layered motion, lights and character staging. */
function WorldScene({
  blue = false,
  location = "platform",
}: {
  blue?: boolean;
  location?: string;
}) {
  const id = useId().replace(/:/g, "");
  if (blue) return <BlueWorld location={location} />;
  const indoors = ["console", "records", "office", "hotel", "ledger"].includes(
    location,
  );
  return (
    <svg
      className={"animated-world " + (blue ? "winter-world" : "storm-world")}
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={
        indoors
          ? "An animated lamplit investigation room"
          : blue
            ? "A colourful snowy London mystery scene"
            : "An animated midnight railway platform in a storm"
      }
    >
      <defs>
        <linearGradient id={id + "sky"} x2="0" y2="1">
          <stop stopColor={blue ? "#252958" : "#292657"} />
          <stop offset=".6" stopColor={blue ? "#6772a8" : "#426aa0"} />
          <stop offset="1" stopColor="#97b6c2" />
        </linearGradient>
        <linearGradient id={id + "ground"} x2="0" y2="1">
          <stop stopColor="#536687" />
          <stop offset="1" stopColor="#252b4c" />
        </linearGradient>
        <linearGradient id={id + "train"} x2="0" y2="1">
          <stop stopColor="#ef8f5e" />
          <stop offset=".45" stopColor="#cb5a60" />
          <stop offset="1" stopColor="#70395d" />
        </linearGradient>
        <linearGradient id={id + "wall"} x2="0" y2="1">
          <stop stopColor="#426a83" />
          <stop offset="1" stopColor="#273955" />
        </linearGradient>
        <radialGradient id={id + "glow"}>
          <stop stopColor="#ffe7a0" stopOpacity=".8" />
          <stop offset="1" stopColor="#ffd179" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={id + "tiles"}
          width="150"
          height="75"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-27)"
        >
          <path
            d="M0 0H150V75H0Z"
            fill="none"
            stroke="#9ab0c0"
            strokeOpacity=".15"
            strokeWidth="2"
          />
        </pattern>
      </defs>
      <rect width="1200" height="720" fill={`url(#${id}sky)`} />
      <circle cx="970" cy="110" r="65" fill="#d5e5f4" />
      <circle cx="990" cy="95" r="61" fill="#343765" />
      <g className="world-clouds" fill="#1e264c" opacity=".55">
        <ellipse cx="170" cy="100" rx="200" ry="35" />
        <ellipse cx="790" cy="130" rx="180" ry="30" />
        <ellipse cx="420" cy="210" rx="210" ry="40" />
      </g>
      {indoors ? (
        <g>
          <path d="M0 0h1200v720H0Z" fill={`url(#${id}wall)`} />
          <path
            d="M0 0l160 110h880L1200 0M160 110v430L0 720M1040 110v430l160 180M160 540h880"
            stroke="#192943"
            strokeWidth="12"
            fill="none"
          />
          <rect
            x="730"
            y="145"
            width="220"
            height="270"
            rx="14"
            fill="#202c55"
            stroke="#7996a4"
            strokeWidth="12"
          />
          <path d="M840 145v270M730 280h220" stroke="#7996a4" strokeWidth="9" />
          <circle cx="900" cy="190" r="30" fill="#ddd4ae" />
          <path
            d="M750 190l-15 50m60 80l-18 50m110-110l-19 60"
            stroke="#b7daed"
            strokeOpacity=".45"
            strokeWidth="3"
          />
          {[220, 380, 540].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y="170"
                width="120"
                height="260"
                rx="8"
                fill="#23344b"
                stroke="#567489"
                strokeWidth="6"
              />
              {[235, 310, 385].map((y) => (
                <g key={y}>
                  <path
                    d={`M${x} ${y}h120`}
                    stroke="#c28e71"
                    strokeWidth="10"
                  />
                  {[10, 34, 58, 82].map((dx, j) => (
                    <rect
                      key={dx}
                      x={x + dx}
                      y={y - 49}
                      width="17"
                      height="44"
                      rx="2"
                      fill={
                        ["#da9b64", "#6ec2b7", "#a69acb", "#d7c088"][
                          (i + j) % 4
                        ]
                      }
                    />
                  ))}
                </g>
              ))}
            </g>
          ))}
          <path
            d="M180 460h800l160 120H70Z"
            fill="#bb8064"
            stroke="#4f3d50"
            strokeWidth="8"
          />
          <path d="M70 580h1070v35H70Z" fill="#79516a" />
          <path
            d="M145 615v105m920-105v105"
            stroke="#3a354f"
            strokeWidth="35"
          />
          {location === "console" ? (
            <g>
              <path
                d="M265 330h350l50 175H220Z"
                fill="#293a54"
                stroke="#93b4b4"
                strokeWidth="6"
              />
              {[340, 540].map((x) => (
                <g
                  className="tape-reel"
                  key={x}
                  style={{ transformOrigin: `${x}px 400px` }}
                >
                  <circle
                    cx={x}
                    cy="400"
                    r="48"
                    fill="#a4b6ac"
                    stroke="#1c2c44"
                    strokeWidth="8"
                  />
                  <circle cx={x} cy="400" r="12" fill="#263b54" />
                  {[0, 120, 240].map((a) => (
                    <path
                      key={a}
                      d={`M${x} 400v-36`}
                      transform={`rotate(${a} ${x} 400)`}
                      stroke="#3f5666"
                      strokeWidth="10"
                    />
                  ))}
                </g>
              ))}
              <path d="M360 445h150" stroke="#c6a476" strokeWidth="5" />
              <circle
                className="signal-light"
                cx="290"
                cy="480"
                r="9"
                fill="#90e6b3"
              />
            </g>
          ) : (
            <g>
              <path
                d="M260 490l225-25 50 70-235 24Z"
                fill="#ffdf9c"
                stroke="#a57c59"
                strokeWidth="4"
              />
              <path
                d="M300 505l160-17m-143 35l148-16"
                stroke="#93735f"
                strokeWidth="4"
              />
              <path
                d="M620 480v-96h80"
                stroke="#d9ad73"
                strokeWidth="12"
                fill="none"
              />
              <path
                d="M666 390l15-84h52l36 84Z"
                fill="#f3c86c"
                stroke="#8c6a56"
                strokeWidth="5"
              />
              <ellipse
                cx="714"
                cy="490"
                rx="105"
                ry="30"
                fill="#ffd586"
                opacity=".16"
              />
            </g>
          )}
        </g>
      ) : (
        <g>
          <path
            d="M0 445l120-80 130 47 130-110 160 90 160-80 160 103 140-60 200 90v200H0Z"
            fill="#243550"
          />
          {blue ? (
            <g>
              {[20, 230, 460, 720, 960].map((x, i) => (
                <g key={x}>
                  <path
                    d={`M${x} 500V${215 + (i % 2) * 55}l95-65 100 65v285Z`}
                    fill={["#657993", "#815d7b", "#456a83"][i % 3]}
                    stroke="#28364e"
                    strokeWidth="7"
                  />
                  <path
                    d={`M${x - 12} ${215 + (i % 2) * 55}l107-72 112 72`}
                    fill="none"
                    stroke="#d4e8ef"
                    strokeWidth="13"
                  />
                  {[35, 115].map((dx) => (
                    <g key={dx}>
                      <rect
                        x={x + dx}
                        y={280 + (i % 2) * 40}
                        width="40"
                        height="60"
                        rx="8"
                        fill="#f3ca7a"
                      />
                      <rect
                        x={x + dx}
                        y="400"
                        width="40"
                        height="60"
                        rx="8"
                        fill="#c3966a"
                      />
                    </g>
                  ))}
                </g>
              ))}
            </g>
          ) : (
            <g>
              <path
                d="M0 50l1200 100v65L0 115Z"
                fill="#31465e"
                stroke="#192b45"
                strokeWidth="7"
              />
              <path
                d="M70 80v500m1030-410v395"
                stroke="#1d354c"
                strokeWidth="30"
              />
              <path
                d="M70 130l160 50m870 45l-145-55"
                stroke="#759596"
                strokeWidth="12"
              />
              <g className="express-train">
                <path
                  d="M140 322q0-52 60-52h660q90 0 115 77l40 162H140Z"
                  fill={`url(#${id}train)`}
                  stroke="#292846"
                  strokeWidth="9"
                />
                <path d="M140 430h857v42H140Z" fill="#f8cb76" />
                <path d="M140 484h868v35H140Z" fill="#333248" />
                {[195, 310, 425, 540, 655, 770].map((x, i) => (
                  <g key={x}>
                    <rect
                      x={x}
                      y="313"
                      width="80"
                      height="94"
                      rx="14"
                      fill={i === 3 ? "#ffe9a5" : "#7099bb"}
                      stroke="#74415a"
                      strokeWidth="8"
                    />
                    <path
                      d={`M${x + 40} 317v86`}
                      stroke="#d4a787"
                      strokeWidth="4"
                    />
                    <path
                      d={`M${x + 9} 326l48 65`}
                      stroke="#e0e5c4"
                      strokeOpacity=".25"
                      strokeWidth="8"
                    />
                  </g>
                ))}
                <path
                  d="M890 319h20l33 88h-53Z"
                  fill="#a6cfde"
                  stroke="#713b57"
                  strokeWidth="6"
                />
                {[235, 390, 755, 915].map((x) => (
                  <g key={x}>
                    <circle
                      cx={x}
                      cy="526"
                      r="37"
                      fill="#273248"
                      stroke="#63788c"
                      strokeWidth="9"
                    />
                    <circle cx={x} cy="526" r="13" fill="#b7c4c5" />
                  </g>
                ))}
                <rect
                  className="train-headlight"
                  x="970"
                  y="450"
                  width="32"
                  height="22"
                  rx="7"
                  fill="#fff1b2"
                />
                <text
                  x="470"
                  y="463"
                  fill="#643d54"
                  fontSize="19"
                  fontWeight="900"
                  letterSpacing="8"
                >
                  NIGHT EXPRESS
                </text>
              </g>
              <g>
                <path
                  d="M495 150h155v100H495Z"
                  fill="#f6d99a"
                  stroke="#303b56"
                  strokeWidth="9"
                />
                <circle
                  cx="572"
                  cy="200"
                  r="38"
                  fill="#fff1ce"
                  stroke="#b39a74"
                  strokeWidth="4"
                />
                <path
                  d="M572 174v28l-19 13"
                  stroke="#3c4a5b"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </g>
            </g>
          )}
        </g>
      )}
      <path d="M0 560Q600 525 1200 560v160H0Z" fill={`url(#${id}ground)`} />
      <rect y="550" width="1200" height="170" fill={`url(#${id}tiles)`} />
      <path d="M0 570h1200" stroke="#e9c988" strokeWidth="9" />
      {[160, 1020].map((x) => (
        <g key={x}>
          <path d={`M${x} 500V230`} stroke="#25334b" strokeWidth="12" />
          <path
            d={`M${x - 20} 230h40l-6-60h-28Z`}
            fill="#ffe0a0"
            stroke="#34405a"
            strokeWidth="6"
          />
          <circle
            className="lamp-halo"
            cx={x}
            cy="210"
            r="95"
            fill={`url(#${id}glow)`}
          />
        </g>
      ))}
      {location === "relay" && (
        <g>
          <path
            d="M400 150h330v430H400Z"
            fill="#253b53"
            stroke="#78949b"
            strokeWidth="12"
          />
          <path d="M430 180h250v370H430Z" fill="#f6ca83" />
          <path
            d="M620 180l85-45v445l-85-30Z"
            fill="#719386"
            stroke="#243a4d"
            strokeWidth="8"
          />
          <circle cx="643" cy="385" r="9" fill="#ffd98e" />
        </g>
      )}
      <g
        className="world-weather"
        stroke={blue ? "#eaf7ff" : "#a4d4f6"}
        strokeOpacity={blue ? ".7" : ".3"}
        strokeWidth={blue ? "5" : "2"}
        strokeLinecap="round"
      >
        {Array.from({ length: 45 }, (_, i) => (
          <path
            key={i}
            d={`M${((i * 137) % 1260) - 30} ${((i * 83) % 800) - 70}l${blue ? 0 : -11} ${blue ? 1 : 38}`}
          />
        ))}
      </g>
      <g className="foreground-luggage">
        <path
          d="M50 570h130v87H50Z"
          fill="#c68758"
          stroke="#463a50"
          strokeWidth="7"
        />
        <path d="M70 570v87m87-87v87" stroke="#f4ca80" strokeWidth="10" />
        <path
          d="M95 568v-17q20-20 35 0v17"
          fill="none"
          stroke="#49394c"
          strokeWidth="7"
        />
      </g>
    </svg>
  );
}

function CharacterIllustration({
  id,
  talking = false,
}: {
  id: string;
  talking?: boolean;
}) {
  const woman = ["leela", "mira"].includes(id),
    elder = ["henry", "dealer", "inspector"].includes(id);
  const colours: Record<string, string> = {
    dev: "#e87e56",
    leela: "#71b8b0",
    mira: "#a09bea",
    henry: "#d5a35f",
    dealer: "#779d78",
    james: "#be7eab",
    inspector: "#7194c5",
  };
  return (
    <svg
      className={"game-character " + (talking ? "talking" : "")}
      viewBox="0 0 220 350"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="332" rx="67" ry="12" fill="#1c2047" opacity=".25" />
      <g className="character-body">
        <path
          d="M62 215l-5 110h40l15-78 14 78h40l-9-110Z"
          fill="#303952"
          stroke="#232a44"
          strokeWidth="5"
        />
        <path
          d="M85 323l-28 2-7 14h49v-14m31-2l35 2 13 14h-48Z"
          fill="#222b43"
        />
        <path
          d="M61 150q49-26 97 0l15 94H48Z"
          fill={colours[id] || "#759bba"}
          stroke="#2f3452"
          strokeWidth="6"
        />
        <path
          d="M61 158q-29 12-32 67l18 7 26-64m84-10q30 12 34 66l-18 8-27-64"
          fill={colours[id] || "#759bba"}
          stroke="#2f3452"
          strokeWidth="6"
        />
        <path
          d="M93 126v30l18 19 20-20v-29"
          fill="#d9a17f"
          stroke="#543f50"
          strokeWidth="4"
        />
        <path
          d="M89 153l22 22-17 24-20-38m58-8l-21 22 17 24 19-38"
          fill="#fff0bf"
        />
        <path d="M111 180v62" stroke="#604962" strokeWidth="4" />
        <circle cx="120" cy="218" r="3" fill="#ffe3a8" />
        <g className="character-head">
          <ellipse
            cx="110"
            cy="87"
            rx="48"
            ry="57"
            fill="#e5b38b"
            stroke="#493b50"
            strokeWidth="5"
          />
          <ellipse cx="61" cy="98" rx="8" ry="13" fill="#e5b38b" />
          <ellipse cx="158" cy="98" rx="8" ry="13" fill="#e5b38b" />
          <path
            d={
              woman
                ? "M64 100Q38 18 112 17t43 104l-14-59q-48 12-61-14l-9 58Z"
                : "M63 82Q45 17 113 19t44 66l-20-31q-38 18-64 3Z"
            }
            fill={elder ? "#a9b5ba" : "#34304a"}
            stroke="#302c43"
            strokeWidth="4"
          />
          {woman && <path d="M154 100q37 26 6 69l-15-26Z" fill="#34304a" />}
          <g className="character-eyes">
            <ellipse cx="91" cy="92" rx="8" ry="11" fill="#fff6dc" />
            <ellipse cx="133" cy="92" rx="8" ry="11" fill="#fff6dc" />
            <circle cx="93" cy="94" r="4" fill="#323b50" />
            <circle cx="131" cy="94" r="4" fill="#323b50" />
          </g>
          <path
            d="M80 76l18-3m25 0l17 4"
            stroke="#49374b"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M109 96l-5 13h12"
            stroke="#bb7d65"
            strokeWidth="3"
            fill="none"
          />
          <path
            className="character-mouth"
            d="M99 122q12 8 24-1"
            stroke="#7c4657"
            strokeWidth="4"
            strokeLinecap="round"
            fill={talking ? "#71394f" : "none"}
          />
          {elder && <path d="M87 116q23-14 48 0l-22 8Z" fill="#a9b5ba" />}
        </g>
      </g>
    </svg>
  );
}

// Static artwork does not rerender with the investigation clock.
export const World = memo(WorldScene);
export const GameCharacter = memo(CharacterIllustration);
