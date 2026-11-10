import { useId } from "react";

/** Original SVG sets. Each location has a different silhouette and camera framing. */
export function BlueWorld({ location }: { location: string }) {
  const id = useId().replace(/:/g, ""),
    market = location === "market",
    yard = location === "brixton",
    hotel = location === "hotel",
    ledger = location === "ledger";
  const title = market
    ? "Foggy Covent Garden stalls"
    : yard
      ? "Brixton yard and goose pen"
      : hotel
        ? "A mahogany hotel records room"
        : ledger
          ? "A lamplit supplier ledger desk"
          : "A winter evening inside Baker Street";
  const lamp = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r="125" fill={`url(#${id}glow)`} />
      <path
        d="M-12-23H12L18 18H-18Z"
        fill="#ecc579"
        stroke="#454435"
        strokeWidth="4"
      />
      <path
        d="M-22-25H22M-16 22H16M0-25V-55"
        stroke="#121f1b"
        strokeWidth="6"
      />
    </g>
  );
  const goose = (x: number, y: number, flip = false) => (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cy="-14" rx="31" ry="21" fill="#d5d5bd" />
      <path d="M14-20Q23-66 33-62Q46-60 39-48L31-23" fill="#dedfcc" />
      <path d="m39-56 17 5-18 6" fill="#d09c53" />
      <circle cx="36" cy="-57" r="2" fill="#182a23" />
      <path
        d="m-8 3-4 14m21-14 3 14M-27-24l-18-3 16 15"
        stroke="#b3935b"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="m-13-22 23 6-15 10"
        fill="none"
        stroke="#a8b4a4"
        strokeWidth="3"
      />
    </g>
  );
  return (
    <svg
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title}
      className="animated-world carbuncle-world"
    >
      <defs>
        <linearGradient id={id + "wall"} x2="0" y2="1">
          <stop stopColor="#263b32" />
          <stop offset="1" stopColor="#12231e" />
        </linearGradient>
        <linearGradient id={id + "floor"} x2="0" y2="1">
          <stop stopColor="#475044" />
          <stop offset="1" stopColor="#182720" />
        </linearGradient>
        <radialGradient id={id + "glow"}>
          <stop stopColor="#f1bd65" stopOpacity=".3" />
          <stop offset="1" stopColor="#f1bd65" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id + "sky"} x2="0" y2="1">
          <stop stopColor="#18362f" />
          <stop offset="1" stopColor="#70877b" />
        </linearGradient>
        <radialGradient id={id + "gem"}>
          <stop stopColor="#d5f3ff" />
          <stop offset=".35" stopColor="#70d0ff" />
          <stop offset="1" stopColor="#2377bf" />
        </radialGradient>
        <pattern
          id={id + "paper"}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 8H16" stroke="#a19470" strokeOpacity=".14" />
        </pattern>
      </defs>
      <rect
        width="1200"
        height="720"
        fill={`url(#${id}${market || yard ? "sky" : "wall"})`}
      />
      {market ? (
        <g>
          <path
            d="M0 390V140L240 55l220 85v250M740 390V130l240-65 220 75v250"
            fill="#243d32"
            stroke="#536052"
            strokeWidth="5"
          />
          {[90, 195, 300, 800, 910, 1020].map((x) => (
            <g key={x}>
              <path d={`M${x} 180v90h55v-90Z`} fill="#b9aa72" opacity=".32" />
              <path d={`M${x + 27} 180v90`} stroke="#142720" strokeWidth="6" />
            </g>
          ))}
          <path
            d="M450 440V230q145-250 300 0v210h-65V230q-80-140-170 0v210Z"
            fill="#344c3d"
            stroke="#60705a"
            strokeWidth="7"
          />
          <path
            d="m15 330 340-50 55 94-395 28ZM825 300l375 30v72l-410-28Z"
            fill="#4c5941"
          />
          {[30, 120, 210, 300, 840, 930, 1020, 1110].map((x) => (
            <path
              key={x}
              d={`m${x} ${x < 500 ? 328 : 326} 32-5 25 65-35 3Z`}
              fill="#947b49"
              opacity=".65"
            />
          ))}
          <path
            d="M25 400v180h350V378M824 375v202h355V403"
            fill="#473f2e"
            stroke="#92794c"
            strokeWidth="5"
          />
          <path d="M0 540H1200V720H0Z" fill={`url(#${id}floor)`} />
          {[570, 620, 680].map((y) => (
            <path
              key={y}
              d={`M0 ${y}H1200`}
              stroke="#71816b"
              strokeOpacity=".25"
              strokeWidth="3"
            />
          ))}
          {[0, 160, 340, 550, 790, 1010].map((x) => (
            <path
              key={x}
              d={`m600 470 ${x - 600} 250`}
              stroke="#172a24"
              strokeWidth="3"
            />
          ))}
          <path
            d="M86 533h230v50H86Zm804-12h220v60H890Z"
            fill="#776342"
            stroke="#aa915d"
            strokeWidth="3"
          />
          {goose(137, 528)}
          {goose(255, 529, true)}
          {goose(962, 517)}
          {lamp(600, 160)}
          <rect
            x="72"
            y="280"
            width="240"
            height="48"
            rx="3"
            fill="#172c23"
            stroke="#b69a5c"
          />
          <text
            x="192"
            y="312"
            textAnchor="middle"
            fontFamily="Georgia"
            fontSize="23"
            fill="#d9c18a"
          >
            B R E C K I N R I D G E
          </text>
        </g>
      ) : yard ? (
        <g>
          <path
            d="M0 190 180 85 355 180v270H0Zm820 210V115l220-70 160 100v310"
            fill="#34483b"
            stroke="#62715a"
            strokeWidth="6"
          />
          <path d="M0 450h1200v270H0" fill={`url(#${id}floor)`} />
          {[
            80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880, 960, 1040,
            1120,
          ].map((x) => (
            <path
              key={x}
              d={`M${x} 430V270l20-20 20 20v160`}
              fill="#56604a"
              stroke="#233a2c"
              strokeWidth="4"
            />
          ))}
          <path
            d="M80 360H1160M80 405H1160"
            stroke="#2d4233"
            strokeWidth="14"
          />
          <path
            d="M360 442V210L610 85l235 125v232Z"
            fill="#3b4532"
            stroke="#8c8052"
            strokeWidth="6"
          />
          <path
            d="m320 215 290-150 280 150-30 20L610 110 344 238Z"
            fill="#182d25"
          />
          <path
            d="M470 439V255h250v184"
            fill="#1b3026"
            stroke="#7d7850"
            strokeWidth="6"
          />
          <path
            d="M481 300H710M481 353H710M530 258v172M590 258v172M650 258v172"
            stroke="#a39a69"
            strokeWidth="3"
            opacity=".5"
          />
          <ellipse
            cx="570"
            cy="555"
            rx="300"
            ry="62"
            fill="#ad9a65"
            opacity=".12"
          />
          {goose(462, 525)}
          {goose(680, 520, true)}
          {goose(555, 588)}
          <path
            d="m112 520 95-15 25 84-105 9Z"
            fill="#655b3d"
            stroke="#b3a06a"
            strokeWidth="5"
          />
          <path
            d="m127 523 73-10m-62 32 70-11m-66 33 72-11"
            stroke="#a28d58"
            strokeWidth="4"
          />
          <path d="M958 510V268" stroke="#182b23" strokeWidth="12" />
          {lamp(958, 258)}
        </g>
      ) : hotel ? (
        <g>
          <rect x="0" y="100" width="1200" height="360" fill="#283c31" />
          {[40, 240, 440, 640, 840, 1040].map((x) => (
            <rect
              key={x}
              x={x}
              y="120"
              width="150"
              height="290"
              fill="none"
              stroke="#657154"
              strokeWidth="3"
            />
          ))}
          <path d="M0 440H1200V720H0Z" fill="#493f2d" />
          <path d="M0 475H1200M0 510H1200" stroke="#8d7546" strokeWidth="4" />
          <path
            d="M110 440V95h260v345"
            fill="#172c24"
            stroke="#9c854f"
            strokeWidth="12"
          />
          <path d="M140 120h200v285H140Z" fill="#536b60" />
          <path d="M240 120v285m-95-140h190" stroke="#233d2e" strokeWidth="9" />
          <path d="M70 80h100l-12 350H75Zm260 0h90v350h-75Z" fill="#5d533b" />
          <rect
            x="830"
            y="160"
            width="220"
            height="280"
            fill="#14251f"
            stroke="#68715a"
            strokeWidth="10"
          />
          <rect
            x="850"
            y="180"
            width="180"
            height="240"
            fill="#273c31"
            stroke="#829275"
            strokeWidth="3"
          />
          <circle
            cx="985"
            cy="310"
            r="15"
            fill="none"
            stroke="#c0ab72"
            strokeWidth="5"
          />
          <path
            d="M403 435h430l60 100H360Z"
            fill="#80613b"
            stroke="#b3955d"
            strokeWidth="5"
          />
          <path
            d="M385 536v135m455-135v135"
            stroke="#3e3526"
            strokeWidth="28"
          />
          <path d="M465 450h165v68H465Z" fill="#d8c79a" />
          <path
            d="M486 470h120m-120 14h105m-105 14h114"
            stroke="#a4936c"
            strokeWidth="2"
          />
          <path
            d="M570 0v100m-95 0h190m-190 0v50m190-50v50m-95-50v75"
            stroke="#8d7b4c"
            strokeWidth="7"
          />
          {lamp(475, 156)}
          {lamp(665, 156)}
        </g>
      ) : ledger ? (
        <g>
          <path d="M0 0H1200V720H0Z" fill="#1a3026" />
          <path
            d="M45 90 1120 30l80 600L60 720Z"
            fill="#695539"
            stroke="#9b8354"
            strokeWidth="12"
          />
          {[150, 240, 340, 450, 560, 665].map((y) => (
            <path
              key={y}
              d={`M55 ${y} 1170 ${y - 60}`}
              stroke="#3d3b2c"
              strokeWidth="3"
            />
          ))}
          <path
            d="m285 140 310 32 300-32 25 365-325 50-335-50Z"
            fill="#d1be8c"
            stroke="#a9976a"
            strokeWidth="8"
          />
          <path d="M595 175v373" stroke="#7e7851" strokeWidth="7" />
          {[225, 275, 325, 375, 425, 475].map((y) => (
            <path
              key={y}
              d={`M320 ${y}h225m90-8h200`}
              stroke="#6a7659"
              strokeWidth="3"
              opacity=".65"
            />
          ))}
          <path
            d="M345 195v300m105-300v300m225-308v300m85-300v300"
            stroke="#9c9468"
            strokeWidth="2"
          />
          <path
            d="m80 400 140-15 20 145-150 20Z"
            fill="#213e2d"
            stroke="#b19b63"
            strokeWidth="4"
          />
          <path
            d="m100 420 100-10m-100 34 100-10"
            stroke="#8a7c51"
            strokeWidth="3"
          />
          <circle
            cx="960"
            cy="450"
            r="49"
            fill="#253c31"
            fillOpacity=".5"
            stroke="#b3a070"
            strokeWidth="10"
          />
          <path d="m996 486 70 75" stroke="#2a3024" strokeWidth="22" />
          <path d="m820 240 70-135 8 15-58 128Z" fill="#c3b888" />
          {lamp(1000, 155)}
          <path d="m190 225 25-33 25 33-25 35Z" fill={`url(#${id}gem)`} />
        </g>
      ) : (
        <g>
          <path d="M0 460H1200V720H0Z" fill={`url(#${id}floor)`} />
          <path d="M0 465H1200M0 495H1200" stroke="#8b794b" strokeWidth="5" />
          <path
            d="M77 425V90h290v335"
            fill="#5d7669"
            stroke="#7a7855"
            strokeWidth="10"
          />
          <path d="M222 100v315M90 253h265" stroke="#233e2e" strokeWidth="10" />
          <path d="M50 65h80l-15 375H40Zm270 0h85v375h-66Z" fill="#686045" />
          <path
            d="M470 465V220h320v245"
            fill="#514c36"
            stroke="#a3905c"
            strokeWidth="8"
          />
          <path d="M510 465V290h240v175" fill="#132720" />
          <path
            d="M551 451q-15-31 14-58 10 25 22 0t18-48q44 42 29 71 23-18 24-35 31 42 7 70Z"
            fill="#ca8e43"
            opacity=".8"
          />
          <path d="M450 216h360v32H450" fill="#8f7b4e" />
          <rect
            x="555"
            y="83"
            width="160"
            height="108"
            fill="#334f40"
            stroke="#b19a60"
            strokeWidth="7"
          />
          <path
            d="m575 166 44-60 36 38 43-20"
            fill="none"
            stroke="#8ca184"
            strokeWidth="5"
          />
          <path
            d="M860 410V140h240v270"
            fill="#233f30"
            stroke="#7b7951"
            strokeWidth="7"
          />
          {[180, 250, 320].map((y) => (
            <g key={y}>
              <path d={`M870 ${y + 35}h220`} stroke="#8f8050" strokeWidth="6" />
              {[885, 920, 950, 990, 1030, 1060].map((x, i) => (
                <rect
                  key={x}
                  x={x}
                  y={y - 20 + (i % 2) * 9}
                  width="22"
                  height={55 - (i % 2) * 9}
                  rx="2"
                  fill={i % 2 ? "#82764e" : "#516b50"}
                />
              ))}
            </g>
          ))}
          <ellipse
            cx="715"
            cy="580"
            rx="270"
            ry="80"
            fill="#8d7950"
            opacity=".2"
          />
          <path
            d="M445 545h340l55 65H407Z"
            fill="#7d6540"
            stroke="#a78b55"
            strokeWidth="5"
          />
          <path d="M440 610v70m360-70v70" stroke="#373a2b" strokeWidth="16" />
          <path d="m520 550 100-16 45 40-120 10Z" fill="#dac99a" />
          <path
            d="M125 570v-98q0-55 60-55h70q55 0 55 55v98Z"
            fill="#54634a"
            stroke="#8a8053"
            strokeWidth="8"
          />
          <path
            d="m995 562-16 9 17 14 15-13Z"
            fill={`url(#${id}gem)`}
            stroke="#9bdfff"
            strokeWidth="3"
          />
          <path d="M1030 548q-10-30 20-35l50 13-12 30Z" fill="#3a4635" />
          {lamp(430, 160)}
        </g>
      )}
      <path
        d="M0 649q350-65 650-20t550-15v106H0Z"
        fill="#bdd0bd"
        opacity=".045"
      />
    </svg>
  );
}
