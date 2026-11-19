import { esc, estimateTextWidth, wrapSvg } from "../svg";
import { THEMES, type ThemeMode } from "../theme";

export interface SectionSpec {
  id: string;
  index: string;
  title: string;
  tag: string;
}

export const SECTIONS: SectionSpec[] = [
  {
    id: "flagship",
    index: "01",
    title: "FLAGSHIP ARCHITECTURE",
    tag: "REMAIN · CLOUDFLARE EDGE · MCP",
  },
  {
    id: "projects",
    index: "02",
    title: "SELECTED SYSTEMS",
    tag: "SHIPPED TOOLS & EXPERIMENTS",
  },
  {
    id: "stack",
    index: "03",
    title: "SYSTEMS & STACK",
    tag: "5 ARCHITECTURAL LAYERS",
  },
  {
    id: "telemetry",
    index: "04",
    title: "LIVE TELEMETRY",
    tag: "SYNCED VIA GITHUB ACTIONS",
  },
];

export function renderSectionHeader(spec: SectionSpec, mode: ThemeMode): string {
  const t = THEMES[mode];
  const W = 880;
  const H = 36;
  const cy = 18;

  const titleW = estimateTextWidth(spec.title, 11.5, "mono", 1.3);
  const tagW = estimateTextWidth(spec.tag, 9.8, "mono", 0.9);

  const badgeX = 0;
  const badgeW = 30;
  const titleX = badgeX + badgeW + 12;
  const lineStart = titleX + titleW + 16;
  const lineEnd = W - tagW - 16;

  const body = `
  <rect x="${badgeX}" y="${cy - 10}" width="${badgeW}" height="20" rx="6" fill="${mode === "dark" ? t.accentSoft : "#101A1B"}" stroke="${mode === "dark" ? t.accentBorder : "#101A1B"}" stroke-width="1" />
  <text x="${badgeX + badgeW / 2}" y="${cy + 3.6}" text-anchor="middle" class="mono" font-size="10.2" font-weight="700" fill="${mode === "dark" ? "#C7F36B" : "#C7F36B"}">${esc(spec.index)}</text>

  <text x="${titleX}" y="${cy + 4}" class="mono" font-size="11.5" font-weight="700" letter-spacing="1.3" fill="${t.textPrimary}">${esc(spec.title)}</text>

  ${lineEnd > lineStart + 12 ? `<line x1="${lineStart}" y1="${cy}" x2="${lineEnd}" y2="${cy}" stroke="${t.border}" stroke-width="1" />` : ""}
  ${lineEnd > lineStart + 12 ? `<circle cx="${lineStart}" cy="${cy}" r="2" fill="${t.accentText}" />` : ""}

  <text x="${W}" y="${cy + 3.5}" text-anchor="end" class="mono" font-size="9.8" font-weight="500" letter-spacing="0.9" fill="${t.textMuted}">${esc(spec.tag)}</text>
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: `${spec.index} — ${spec.title}`,
    body,
  });
}
