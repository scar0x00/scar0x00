import {
  cardShell,
  dotGridPattern,
  esc,
  estimateTextWidth,
  renderBrandMark,
  renderPill,
  signalGlowFilter,
  wrapSvg,
} from "../svg";
import { PROFILE_META, THEMES, type ThemeMode } from "../theme";

interface TopologyNode {
  code: string;
  title: string;
  detail: string;
  cy: number;
  active?: boolean;
  delay: string;
}

const TOPOLOGY_NODES: TopologyNode[] = [
  {
    code: "01",
    title: "Cloud & Infra",
    detail: "Azure · AWS · Cloudflare",
    cy: 152,
    active: true,
    delay: "0s",
  },
  {
    code: "02",
    title: "Full-Stack Web",
    detail: "TS · Angular · Hono · Astro",
    cy: 200,
    delay: "0.75s",
  },
  {
    code: "03",
    title: "Agentic AI",
    detail: "MCP Servers · CF Agents",
    cy: 248,
    delay: "1.5s",
  },
  {
    code: "04",
    title: "IaC & Linux",
    detail: "Terraform · Ansible · Shell",
    cy: 296,
    delay: "2.25s",
  },
];

export function renderHero(mode: ThemeMode): string {
  const t = THEMES[mode];
  const W = 880;
  const H = 348;
  const id = `hero-${mode}`;

  const statusText = `${PROFILE_META.location} · ${PROFILE_META.timezone} · ${PROFILE_META.languages}`;
  const statusWidth = estimateTextWidth(statusText, 10.2, "mono", 0.7, 500);
  const statusDotX = W - 26 - statusWidth - 11;

  const kicker = renderPill({
    x: 28,
    y: 68,
    label: "CLOUD & INFRASTRUCTURE ENGINEER",
    bg: t.accentSoft,
    border: t.accentBorder,
    textColor: t.accentText,
    dotColor: t.accentText,
    fontSize: 9.8,
    height: 24,
    px: 10,
    letterSpacing: 0.7,
    fontWeight: 600,
  });

  // Right architectural deck geometry
  const deckX = 468;
  const deckY = 64;
  const deckW = 388;
  const deckH = 264;

  // Origin hub inside deck
  const hubX = 484;
  const hubY = 196;
  const hubW = 98;
  const hubH = 56;
  const hubOutX = hubX + hubW; // 582
  const hubOutY = hubY + hubH / 2; // 224
  const trunkX = 612;
  const nodeX = 646;
  const nodeW = 194;
  const nodeH = 38;

  // Build orthogonal static traces + animated signal pulse paths
  const tracesSvg = TOPOLOGY_NODES.map((n, idx) => {
    const pathD = `M ${hubOutX} ${hubOutY} H ${trunkX} V ${n.cy} H ${nodeX}`;
    return `
      <path d="${pathD}" stroke="${t.deckTrace}" stroke-width="1.4" stroke-linejoin="round" fill="none" />
      <path class="signal-packet signal-packet-${idx}" d="${pathD}" stroke="#C7F36B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${id}-glow)" style="animation-delay: ${n.delay};" />
      <circle cx="${nodeX}" cy="${n.cy}" r="2.8" fill="${n.active ? "#C7F36B" : "#709454"}" />
    `;
  }).join("");

  // Build 4 outcome nodes
  const nodesSvg = TOPOLOGY_NODES.map((n) => {
    const ny = n.cy - nodeH / 2;
    const fill = n.active ? t.deckNodeActiveBg : t.deckNodeBg;
    const stroke = n.active ? "#5C8338" : t.deckBorder;
    const dotFill = n.active ? "#C7F36B" : "#56706E";
    const codeFill = n.active ? "#C7F36B" : t.deckMuted;
    return `
    <g>
      <rect x="${nodeX}" y="${ny}" width="${nodeW}" height="${nodeH}" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="1" />
      <circle cx="${nodeX + 14}" cy="${n.cy - 5}" r="2.6" fill="${dotFill}" />
      <text x="${nodeX + 24}" y="${n.cy - 1}" class="sans" font-size="12" font-weight="600" fill="${t.deckText}">${esc(n.title)}</text>
      <text x="${nodeX + 24}" y="${n.cy + 13}" class="mono" font-size="9.2" fill="${t.deckSubtext}">${esc(n.detail)}</text>
      <text x="${nodeX + nodeW - 12}" y="${n.cy - 1}" text-anchor="end" class="mono" font-size="9.2" font-weight="600" fill="${codeFill}">${esc(n.code)}</text>
    </g>`;
  }).join("");

  // Telecom oscilloscope carrier waveform along top of deck
  const wavePath =
    "M 484 104 H 526 L 534 104 L 540 93 L 548 113 L 555 96 L 561 104 H 612 L 620 104 L 627 90 L 635 116 L 643 94 L 650 104 H 718 L 725 104 L 731 94 L 738 112 L 745 97 L 751 104 H 840";

  const defs = `
    ${dotGridPattern(`${id}-card-grid`, t.gridDot, 20, 0.8)}
    ${dotGridPattern(`${id}-deck-grid`, t.deckGridDot, 16, 0.85)}
    ${signalGlowFilter(`${id}-glow`, 2.2)}
    <clipPath id="${id}-deck-clip">
      <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" rx="14" />
    </clipPath>
    <clipPath id="${id}-card-clip">
      <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" />
    </clipPath>
    <radialGradient id="${id}-aura" cx="72%" cy="52%" r="48%">
      <stop offset="0%" stop-color="#C7F36B" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#C7F36B" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="${id}-top-fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C7F36B" stop-opacity="${mode === "dark" ? "0.28" : "0.7"}" />
      <stop offset="35%" stop-color="${t.border}" stop-opacity="0.5" />
      <stop offset="100%" stop-color="${t.border}" stop-opacity="0" />
    </linearGradient>
  `;

  const styles = `
    @keyframes beaconPulse {
      0%, 100% { opacity: 0.9; transform: scale(1); }
      50% { opacity: 0.25; transform: scale(2.1); }
    }
    @keyframes carrierSweep {
      0% { stroke-dashoffset: 420; opacity: 0.25; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { stroke-dashoffset: -420; opacity: 0.25; }
    }
    @keyframes packetFlow {
      0% { stroke-dashoffset: 210; opacity: 0; }
      12% { opacity: 1; }
      68% { opacity: 1; }
      100% { stroke-dashoffset: -40; opacity: 0; }
    }
    @keyframes brandPulse {
      0%, 100% { stroke-dashoffset: 0; opacity: 1; }
      50% { stroke-dashoffset: 68; opacity: 0.55; }
    }
    .beacon-ring {
      transform-box: fill-box;
      transform-origin: center;
      animation: beaconPulse 2.8s ease-in-out infinite;
    }
    .carrier-beam {
      stroke-dasharray: 84 340;
      animation: carrierSweep 4.2s linear infinite;
    }
    .signal-packet {
      stroke-dasharray: 26 220;
      animation: packetFlow 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    .${id}-brand-wave {
      stroke-dasharray: 34 34;
      animation: brandPulse 5s ease-in-out infinite;
    }
  `;

  const credentials = [
    { x: 28, code: "01 // EXPERIENCE", value: "5+ yrs IT Ops", sub: "Enterprise systems" },
    { x: 174, code: "02 // DEGREE", value: "Telecom Eng.", sub: "Networks & signal" },
    { x: 320, code: "03 // FOCUS", value: "Agentic AI", sub: "MCP & CF Agents" },
  ];

  const credentialsSvg = credentials
    .map(
      (c) => `
    <g>
      <text x="${c.x}" y="285" class="mono" font-size="9" font-weight="600" letter-spacing="0.7" fill="${t.textMuted}">${esc(c.code)}</text>
      <text x="${c.x}" y="305" class="sans" font-size="13.5" font-weight="600" fill="${t.textPrimary}">${esc(c.value)}</text>
      <text x="${c.x}" y="321" class="sans" font-size="11" fill="${t.textSecondary}">${esc(c.sub)}</text>
    </g>`,
    )
    .join("");

  const body = `
  ${cardShell(W, H, t, 18)}

  <!-- Subtle corner architectural dot grid -->
  <g clip-path="url(#${id}-card-clip)">
    <rect x="0" y="48" width="460" height="300" fill="url(#${id}-card-grid)" opacity="0.42" />
    <rect x="0" y="0" width="${W}" height="2" fill="url(#${id}-top-fade)" />
  </g>

  <!-- Top Telemetry Bar -->
  ${renderBrandMark(24, 12, 24, id)}
  <text x="58" y="28.5" class="mono" font-size="12.5" font-weight="700" fill="${t.textPrimary}">${esc(PROFILE_META.username)}</text>
  <text x="128" y="28.5" class="mono" font-size="11" fill="${t.textMuted}">//</text>
  <text x="148" y="28.5" class="mono" font-size="10.2" font-weight="500" letter-spacing="1.1" fill="${t.textSecondary}">SIGNAL · CLOUD · AGENTS</text>

  <!-- Live Status Indicator -->
  <circle class="beacon-ring" cx="${statusDotX}" cy="24" r="4" fill="#C7F36B" opacity="0.55" />
  <circle cx="${statusDotX}" cy="24" r="3" fill="${mode === "dark" ? "#C7F36B" : "#4D8B1A"}" />
  <text x="${W - 26}" y="28" text-anchor="end" class="mono" font-size="10.2" font-weight="500" letter-spacing="0.7" fill="${t.textSecondary}">${esc(statusText)}</text>

  <line x1="1" y1="48" x2="${W - 1}" y2="48" stroke="${t.border}" stroke-width="1" />

  <!-- Left Editorial Identity Column -->
  ${kicker.svg}

  <text x="28" y="145" class="sans" font-size="44" font-weight="700" letter-spacing="-1.3" fill="${t.textPrimary}">${esc(PROFILE_META.displayName)}</text>
  <text x="28" y="176" class="sans" font-size="15.5" font-weight="500" fill="${t.accentText}">A developer with an operations perspective.</text>

  <text x="28" y="209" class="sans" font-size="13.5" fill="${t.textSecondary}">Building AI-powered web apps, cloud infrastructure, and</text>
  <text x="28" y="230" class="sans" font-size="13.5" fill="${t.textSecondary}">agentic systems across Azure, AWS, and Cloudflare.</text>

  <line x1="28" y1="262" x2="444" y2="262" stroke="${t.border}" stroke-width="1" />
  ${credentialsSvg}

  <!-- Right Architectural Signal-Bus Topology Deck -->
  <g clip-path="url(#${id}-deck-clip)">
    <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" rx="14" fill="${t.deckBg}" />
    <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" fill="url(#${id}-deck-grid)" opacity="0.65" />
    <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" fill="url(#${id}-aura)" />

    <!-- Top Oscilloscope Carrier Strip -->
    <text x="${deckX + 18}" y="${deckY + 21}" class="mono" font-size="9.2" font-weight="600" letter-spacing="0.9" fill="${t.deckMuted}">SYSTEM MAP // 0x00</text>
    <circle cx="${deckX + deckW - 81}" cy="${deckY + 17.5}" r="2.6" fill="#C7F36B" />
    <text x="${deckX + deckW - 18}" y="${deckY + 21}" text-anchor="end" class="mono" font-size="9.2" font-weight="600" letter-spacing="0.8" fill="#C7F36B">LIVE BUS</text>

    <!-- Carrier Waveform -->
    <path d="${wavePath}" stroke="#23373A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path class="carrier-beam" d="${wavePath}" stroke="#C7F36B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${id}-glow)" />

    <line x1="${deckX}" y1="${deckY + 54}" x2="${deckX + deckW}" y2="${deckY + 54}" stroke="${t.deckBorder}" stroke-width="1" />

    <!-- Orthogonal Bus Traces and Animated Pulses -->
    ${tracesSvg}
    <circle cx="${trunkX}" cy="${hubOutY}" r="3.6" fill="#C7F36B" filter="url(#${id}-glow)" />

    <!-- Origin Hub Node -->
    <rect x="${hubX}" y="${hubY}" width="${hubW}" height="${hubH}" rx="10" fill="${t.deckNodeActiveBg}" stroke="#547935" stroke-width="1.2" />
    <circle cx="${hubX + 15}" cy="${hubY + 22}" r="3" fill="#C7F36B" />
    <text x="${hubX + 24}" y="${hubY + 26}" class="mono" font-size="12" font-weight="700" fill="${t.deckText}">scar0x00</text>
    <text x="${hubX + 14}" y="${hubY + 42}" class="mono" font-size="8.6" letter-spacing="0.7" fill="${t.deckMuted}">CORE NODE</text>

    <!-- 4 Domain Outcome Modules -->
    ${nodesSvg}
  </g>
  <rect x="${deckX + 0.5}" y="${deckY + 0.5}" width="${deckW - 1}" height="${deckH - 1}" rx="14" fill="none" stroke="${t.deckBorder}" stroke-width="1" />
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: "Óscar Mejías (scar0x00) — Cloud, Infrastructure & Agentic AI Engineer",
    desc: "Hero banner with architectural signal-bus topology connecting Cloud & Infra, Full-Stack Web, Agentic AI, and IaC & Linux.",
    defs,
    styles,
    body,
  });
}
