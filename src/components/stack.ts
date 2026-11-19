import { cardShell, esc, renderPill, wrapSvg } from "../svg";
import { THEMES, type ThemeMode } from "../theme";

interface TechItem {
  name: string;
  core?: boolean;
}

interface StackLayer {
  code: string;
  title: string;
  items: TechItem[];
}

const LAYERS: StackLayer[] = [
  {
    code: "L1",
    title: "CLOUD & INFRA",
    items: [
      { name: "Azure", core: true },
      { name: "AWS", core: true },
      { name: "Cloudflare", core: true },
      { name: "Terraform" },
      { name: "Ansible" },
      { name: "Docker" },
      { name: "Tailscale" },
      { name: "GH Actions" },
      { name: "Linux" },
    ],
  },
  {
    code: "L2",
    title: "LANGUAGES",
    items: [
      { name: "TypeScript", core: true },
      { name: "JavaScript" },
      { name: "Python" },
      { name: "Go" },
      { name: "C#" },
      { name: "PowerShell", core: true },
      { name: "Bash" },
    ],
  },
  {
    code: "L3",
    title: "FULL-STACK",
    items: [
      { name: "Angular", core: true },
      { name: "Astro" },
      { name: "React Router" },
      { name: "Tailwind" },
      { name: "shadcn/ui" },
      { name: "Hono", core: true },
      { name: "Bun", core: true },
      { name: "Node.js" },
      { name: ".NET" },
    ],
  },
  {
    code: "L4",
    title: "DATA & EDGE",
    items: [
      { name: "PostgreSQL", core: true },
      { name: "Durable Objects", core: true },
      { name: "R2" },
      { name: "Upstash Redis" },
      { name: "SQL Server" },
      { name: "SQLite" },
      { name: "DuckDB" },
    ],
  },
  {
    code: "L5",
    title: "AI & TOOLING",
    items: [
      { name: "MCP", core: true },
      { name: "CF Agents SDK", core: true },
      { name: "LangChain" },
      { name: "OpenRouter" },
      { name: "Playwright" },
      { name: "Git" },
      { name: "Figma" },
    ],
  },
];

export function renderStack(mode: ThemeMode): string {
  const t = THEMES[mode];
  const W = 880;
  const headerH = 40;
  const rowH = 52;
  const H = headerH + LAYERS.length * rowH + 8; // 308

  const dividerX = 176;
  const chipsStartX = 192;

  const rowsSvg = LAYERS.map((layer, index) => {
    const rowTop = headerH + index * rowH;
    const cy = rowTop + rowH / 2;

    let cursorX = chipsStartX;
    const chips = layer.items
      .map((item) => {
        const chip = renderPill({
          x: cursorX,
          y: cy - 13,
          label: item.name,
          bg: item.core ? t.accentSoft : t.bgElevated,
          border: item.core ? t.accentBorder : t.border,
          textColor: item.core ? (mode === "dark" ? "#E8F9C1" : t.textPrimary) : t.textSecondary,
          dotColor: item.core ? (mode === "dark" ? "#C7F36B" : "#4A851B") : undefined,
          fontSize: 10.6,
          height: 26,
          px: 9,
          radius: 7,
          family: "sans",
          fontWeight: item.core ? 600 : 500,
        });
        cursorX += chip.width + 6.5;
        return chip.svg;
      })
      .join("");

    return `
    <g>
      ${index > 0 ? `<line x1="16" y1="${rowTop}" x2="${W - 16}" y2="${rowTop}" stroke="${t.border}" stroke-width="1" />` : ""}
      <rect x="20" y="${cy - 10}" width="26" height="20" rx="5" fill="${t.bgSubtle}" stroke="${t.border}" stroke-width="1" />
      <text x="33" y="${cy + 3.5}" text-anchor="middle" class="mono" font-size="9.5" font-weight="700" fill="${t.accentText}">${esc(layer.code)}</text>
      <text x="56" y="${cy + 3.8}" class="mono" font-size="10.2" font-weight="600" letter-spacing="0.8" fill="${t.textPrimary}">${esc(layer.title)}</text>
      ${chips}
    </g>`;
  }).join("");

  const body = `
  ${cardShell(W, H, t, 16)}

  <!-- Top Legend Header -->
  <text x="20" y="24.5" class="mono" font-size="9.8" font-weight="600" letter-spacing="0.9" fill="${t.textMuted}">TECHNICAL SPECIFICATION MATRIX</text>

  <!-- Core Specialty Legend -->
  <circle cx="${W - 160}" cy="21" r="3" fill="${mode === "dark" ? "#C7F36B" : "#4A851B"}" />
  <text x="${W - 151}" y="24.5" class="mono" font-size="9.4" font-weight="600" letter-spacing="0.6" fill="${t.textSecondary}">CORE DAILY STACK</text>

  <line x1="1" y1="${headerH}" x2="${W - 1}" y2="${headerH}" stroke="${t.border}" stroke-width="1" />
  <line x1="${dividerX}" y1="${headerH}" x2="${dividerX}" y2="${H - 1}" stroke="${t.border}" stroke-width="1" />

  ${rowsSvg}
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: "Óscar Mejías — Systems & Tech Stack Matrix",
    desc: "5-layer engineering specification covering Cloud & Infra, Languages, Full-Stack, Data & Edge, and AI & Tooling.",
    body,
  });
}
