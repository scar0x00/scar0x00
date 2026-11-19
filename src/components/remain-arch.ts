import {
  cardShell,
  dotGridPattern,
  esc,
  measureDisplayText,
  renderDisplayText,
  renderPill,
  signalGlowFilter,
  wrapSvg,
} from "../svg";
import { THEMES, type ThemeMode } from "../theme";

export function renderRemainArch(mode: ThemeMode): string {
  const t = THEMES[mode];
  const W = 880;
  const H = 340;
  const id = `remain-${mode}`;

  const deckX = 18;
  const deckY = 62;
  const deckW = W - 36; // 844
  const deckH = 202;

  const badge = renderPill({
    x: 0, // positioned after measuring
    y: 18,
    label: "CLOUDFLARE EDGE · AGENTS SDK",
    bg: t.amberSoft,
    border: t.amberBorder,
    textColor: t.amberText,
    dotColor: t.amber,
    fontSize: 9.5,
    height: 24,
    px: 10,
    letterSpacing: 0.6,
    fontWeight: 600,
  });

  const badgePlaced = renderPill({
    x: W - 20 - badge.width,
    y: 18,
    label: "CLOUDFLARE EDGE · AGENTS SDK",
    bg: t.amberSoft,
    border: t.amberBorder,
    textColor: t.amberText,
    dotColor: t.amber,
    fontSize: 9.5,
    height: 24,
    px: 10,
    letterSpacing: 0.6,
    fontWeight: 600,
  });

  // Wire paths inside deck
  const pathAngularToHono = "M 206 117 H 246 V 148 H 286";
  const pathMcpToHono = "M 206 207 H 246 V 176 H 286";
  const pathHonoToAgents = "M 498 142 H 536 V 108 H 572";
  const pathHonoToDataTop = "M 498 170 H 572";
  const pathHonoToDataBot = "M 498 190 H 536 V 224 H 572";

  const defs = `
    ${dotGridPattern(`${id}-grid`, t.deckGridDot, 16, 0.85)}
    ${signalGlowFilter(`${id}-glow`, 2.2)}
    <clipPath id="${id}-deck-clip">
      <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" rx="12" />
    </clipPath>
    <radialGradient id="${id}-amber-glow" cx="76%" cy="28%" r="36%">
      <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#FBBF24" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${id}-lime-glow" cx="44%" cy="55%" r="34%">
      <stop offset="0%" stop-color="#C7F36B" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#C7F36B" stop-opacity="0" />
    </radialGradient>
  `;

  const styles = `
    @keyframes flowPacket {
      0% { stroke-dashoffset: 180; opacity: 0; }
      14% { opacity: 1; }
      72% { opacity: 1; }
      100% { stroke-dashoffset: -30; opacity: 0; }
    }
    .${id}-pkt {
      stroke-dasharray: 24 190;
      animation: flowPacket 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    .${id}-pkt-2 {
      stroke-dasharray: 22 190;
      animation: flowPacket 3.2s cubic-bezier(0.4, 0, 0.2, 1) 0.9s infinite;
    }
    .${id}-pkt-3 {
      stroke-dasharray: 26 190;
      animation: flowPacket 3.2s cubic-bezier(0.4, 0, 0.2, 1) 1.5s infinite;
    }
    .${id}-pkt-4 {
      stroke-dasharray: 20 190;
      animation: flowPacket 3.2s cubic-bezier(0.4, 0, 0.2, 1) 2.1s infinite;
    }
  `;

  const dataTiles = [
    { x: 572, y: 148, title: "PostgreSQL", sub: "via Hyperdrive", dot: "#5CE1E6" },
    { x: 712, y: 148, title: "Cloudflare R2", sub: "PDFs & notes", dot: "#FBBF24" },
    { x: 572, y: 202, title: "Upstash Redis", sub: "Cache & rate limits", dot: "#C7F36B" },
    { x: 712, y: 202, title: "Playwright CI", sub: "e2e + auto-deploy", dot: "#A78BFA" },
  ];

  const dataTilesSvg = dataTiles
    .map(
      (tile) => `
    <g>
      <rect x="${tile.x}" y="${tile.y}" width="132" height="44" rx="8" fill="${t.deckNodeBg}" stroke="${t.deckBorder}" stroke-width="1" />
      <circle cx="${tile.x + 12}" cy="${tile.y + 16}" r="2.4" fill="${tile.dot}" />
      ${renderDisplayText({ text: tile.title, x: tile.x + 21, y: tile.y + 19.5, fontSize: 11, fontWeight: 600, fill: t.deckText })}
      <text x="${tile.x + 12}" y="${tile.y + 34.5}" class="mono" font-size="9" fill="${t.deckSubtext}">${esc(tile.sub)}</text>
    </g>`,
    )
    .join("");

  const highlights = [
    { x: 24, code: "01 · GENERATE & REFINE", text: "Upload PDFs, edit decks via chat" },
    { x: 238, code: "02 · STUDY TELEMETRY", text: "Heatmaps, accuracy & hard cards" },
    { x: 452, code: "03 · MCP SERVER", text: "Manage decks inside Claude" },
    { x: 666, code: "04 · REAL AUTH & E2E", text: "Passkeys, 2FA & GitHub Actions" },
  ];

  const highlightsSvg = highlights
    .map(
      (h, i) => `
    <g>
      ${i > 0 ? `<line x1="${h.x - 14}" y1="282" x2="${h.x - 14}" y2="322" stroke="${t.border}" stroke-width="1" />` : ""}
      <text x="${h.x}" y="294" class="mono" font-size="9.2" font-weight="700" letter-spacing="0.6" fill="${t.accentText}">${esc(h.code)}</text>
      ${renderDisplayText({ text: h.text, x: h.x, y: 314, fontSize: 11.5, fontWeight: 400, fill: t.textSecondary })}
    </g>`,
    )
    .join("");

  const remainTitleWidth = measureDisplayText("Remain", 16, 700, -0.2);

  const body = `
  ${cardShell(W, H, t, 16)}

  <!-- Top Product Header -->
  <!-- Remain amber emblem echoing actual app icon -->
  <rect x="20" y="16" width="28" height="28" rx="8" fill="#FBBF24" />
  <rect x="27" y="22" width="14" height="16" rx="3" fill="#101A1B" />
  <rect x="30" y="26" width="8" height="2.2" rx="1.1" fill="#FBBF24" />
  <rect x="30" y="31" width="5.5" height="2.2" rx="1.1" fill="#FBBF24" opacity="0.7" />

  ${renderDisplayText({ text: "Remain", x: 58, y: 29, fontSize: 16, fontWeight: 700, letterSpacing: -0.2, fill: t.textPrimary })}
  ${renderDisplayText({ text: "—  AI-powered flashcard platform", x: 58 + remainTitleWidth + 9, y: 29, fontSize: 13, fontWeight: 400, fill: t.textSecondary })}
  ${renderDisplayText({ text: "Turn notes and PDFs into flashcard decks with an AI agent, refine by chat, and track what sticks.", x: 58, y: 46, fontSize: 11.2, fontWeight: 400, fill: t.textMuted })}

  ${badgePlaced.svg}

  <!-- Center Animated Architecture Blueprint Deck -->
  <g clip-path="url(#${id}-deck-clip)">
    <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" rx="12" fill="${t.deckBg}" />
    <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" fill="url(#${id}-grid)" opacity="0.6" />
    <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" fill="url(#${id}-amber-glow)" />
    <rect x="${deckX}" y="${deckY}" width="${deckW}" height="${deckH}" fill="url(#${id}-lime-glow)" />

    <!-- Column headers -->
    <text x="36" y="80" class="mono" font-size="8.6" font-weight="600" letter-spacing="0.9" fill="${t.deckMuted}">ENTRY INTERFACES</text>
    <text x="286" y="80" class="mono" font-size="8.6" font-weight="600" letter-spacing="0.9" fill="${t.deckMuted}">EDGE COMPUTE</text>
    <text x="572" y="80" class="mono" font-size="8.6" font-weight="600" letter-spacing="0.9" fill="${t.deckMuted}">AGENTS &amp; DATA PLANE</text>

    <!-- Static Circuit Traces -->
    <path d="${pathAngularToHono}" stroke="${t.deckTrace}" stroke-width="1.5" stroke-linejoin="round" fill="none" />
    <path d="${pathMcpToHono}" stroke="${t.deckTrace}" stroke-width="1.5" stroke-linejoin="round" fill="none" />
    <path d="${pathHonoToAgents}" stroke="${t.deckTrace}" stroke-width="1.5" stroke-linejoin="round" fill="none" />
    <path d="${pathHonoToDataTop}" stroke="${t.deckTrace}" stroke-width="1.5" stroke-linejoin="round" fill="none" />
    <path d="${pathHonoToDataBot}" stroke="${t.deckTrace}" stroke-width="1.5" stroke-linejoin="round" fill="none" />

    <!-- Animated Signal Packets -->
    <path class="${id}-pkt" d="${pathAngularToHono}" stroke="#C7F36B" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${id}-glow)" />
    <path class="${id}-pkt-2" d="${pathMcpToHono}" stroke="#5CE1E6" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${id}-glow)" />
    <path class="${id}-pkt-3" d="${pathHonoToAgents}" stroke="#FBBF24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${id}-glow)" />
    <path class="${id}-pkt-4" d="${pathHonoToDataTop}" stroke="#C7F36B" stroke-width="1.9" stroke-linecap="round" fill="none" filter="url(#${id}-glow)" />

    <!-- Connection Terminals -->
    <circle cx="206" cy="117" r="2.8" fill="#C7F36B" />
    <circle cx="206" cy="207" r="2.8" fill="#5CE1E6" />
    <circle cx="286" cy="148" r="2.8" fill="#C7F36B" />
    <circle cx="286" cy="176" r="2.8" fill="#5CE1E6" />
    <circle cx="498" cy="142" r="2.8" fill="#FBBF24" />
    <circle cx="498" cy="170" r="2.8" fill="#C7F36B" />
    <circle cx="498" cy="190" r="2.5" fill="#657B78" />
    <circle cx="572" cy="108" r="3" fill="#FBBF24" />
    <circle cx="572" cy="170" r="2.6" fill="#C7F36B" />
    <circle cx="572" cy="224" r="2.6" fill="#657B78" />

    <!-- Node: Angular Web App -->
    <rect x="34" y="90" width="172" height="58" rx="10" fill="${t.deckNodeBg}" stroke="${t.deckBorder}" stroke-width="1.1" />
    <circle cx="48" cy="109" r="3" fill="#C7F36B" />
    ${renderDisplayText({ text: "Angular Web App", x: 58, y: 113, fontSize: 12.2, fontWeight: 600, fill: t.deckText })}
    <text x="48" y="131" class="mono" font-size="9.2" fill="${t.deckSubtext}">Study · Chat · Analytics</text>

    <!-- Node: MCP Server -->
    <rect x="34" y="176" width="172" height="58" rx="10" fill="${t.deckNodeBg}" stroke="${t.deckBorder}" stroke-width="1.1" />
    <circle cx="48" cy="195" r="3" fill="#5CE1E6" />
    ${renderDisplayText({ text: "MCP Server", x: 58, y: 199, fontSize: 12.2, fontWeight: 600, fill: t.deckText })}
    <text x="48" y="217" class="mono" font-size="9.2" fill="${t.deckSubtext}">Claude.ai &amp; Claude Code</text>

    <!-- Center Hub: Hono on Cloudflare Workers -->
    <rect x="286" y="112" width="212" height="106" rx="11" fill="${t.deckNodeActiveBg}" stroke="#547935" stroke-width="1.3" />
    <rect x="300" y="124" width="142" height="18" rx="4" fill="#1C3026" stroke="#3B5D30" stroke-width="0.9" />
    <text x="308" y="136.3" class="mono" font-size="8.6" font-weight="700" letter-spacing="0.6" fill="#C7F36B">CLOUDFLARE WORKERS</text>
    ${renderDisplayText({ text: "Hono Edge API", x: 300, y: 164, fontSize: 15, fontWeight: 700, letterSpacing: -0.2, fill: t.deckText })}
    <text x="300" y="184" class="mono" font-size="9.4" fill="${t.deckSubtext}">better-auth · CF Access</text>
    <text x="300" y="201" class="mono" font-size="9.4" fill="${t.deckMuted}">Passkeys · 2FA · Rate Limits</text>

    <!-- Featured AI Node: Cloudflare Agents SDK (Durable Objects) -->
    <rect x="572" y="90" width="272" height="48" rx="9" fill="#1E1C14" stroke="#8A6820" stroke-width="1.2" />
    <circle cx="586" cy="107" r="3" fill="#FBBF24" />
    ${renderDisplayText({ text: "CF Agents SDK · Durable Objects", x: 596, y: 111, fontSize: 12, fontWeight: 700, fill: t.deckText })}
    <text x="586" y="127" class="mono" font-size="9" fill="#E3C376">Streaming deck generation &amp; chat edits</text>

    <!-- 2x2 Data Plane Tiles -->
    ${dataTilesSvg}
  </g>
  <rect x="${deckX + 0.5}" y="${deckY + 0.5}" width="${deckW - 1}" height="${deckH - 1}" rx="12" fill="none" stroke="${t.deckBorder}" stroke-width="1" />

  <!-- Bottom 4 Capability Highlights -->
  ${highlightsSvg}
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: "Remain — Production Architecture Blueprint",
    desc: "System diagram connecting Angular Web App and MCP Server through Hono on Cloudflare Workers to Cloudflare Agents SDK (Durable Objects), PostgreSQL via Hyperdrive, R2, Upstash Redis, and Playwright CI.",
    defs,
    styles,
    body,
  });
}
