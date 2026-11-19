import { cardShell, esc, renderDisplayText, renderPill, wrapSvg } from "../svg";
import { THEMES, type ThemeMode } from "../theme";

export interface ProjectCardSpec {
  id: string;
  code: string;
  title: string;
  status: string;
  statusTone: "accent" | "amber" | "cyan";
  line1: string;
  line2: string;
  tags: string[];
  repoLabel: string;
}

export const PROJECT_CARDS: ProjectCardSpec[] = [
  {
    id: "finneas",
    code: "SYS // 01",
    title: "Finneas",
    status: "IN PROGRESS",
    statusTone: "amber",
    line1: "AI-powered personal finance agent for tracking",
    line2: "expenses, balances, debts, and recurring cash flow.",
    tags: ["TypeScript", "AI Agents", "Finance"],
    repoLabel: "scar0x00/finneas",
  },
  {
    id: "mywhisper",
    code: "SYS // 02",
    title: "mywhisper",
    status: "LINUX TOOL",
    statusTone: "accent",
    line1: "Global-hotkey voice dictation for Linux. Record,",
    line2: "transcribe via OpenRouter, and auto-type anywhere.",
    tags: ["Bun", "TypeScript", "OpenRouter", "xdotool"],
    repoLabel: "scar0x00/mywhisper",
  },
  {
    id: "studio",
    code: "SYS // 03",
    title: "scar0x00.click",
    status: "LIVE SITE",
    statusTone: "accent",
    line1: "Independent web studio for custom websites, apps,",
    line2: "e-commerce, and AI business workflow automation.",
    tags: ["Astro", "Tailwind CSS", "Cloudflare", "EN / ES"],
    repoLabel: "scar0x00.click",
  },
  {
    id: "profile",
    code: "SYS // 04",
    title: "Profile Telemetry Engine",
    status: "OPEN SOURCE",
    statusTone: "cyan",
    line1: "Zero-dependency Bun & TypeScript SVG compiler",
    line2: "powering this profile with live GraphQL + CI sync.",
    tags: ["Bun", "TypeScript", "GraphQL", "GH Actions"],
    repoLabel: "scar0x00/scar0x00",
  },
];

export function renderProjectCard(spec: ProjectCardSpec, mode: ThemeMode): string {
  const t = THEMES[mode];
  const W = 432;
  const H = 166;

  const statusColors =
    spec.statusTone === "amber"
      ? { bg: t.amberSoft, border: t.amberBorder, text: t.amberText, dot: t.amber }
      : spec.statusTone === "cyan"
        ? {
            bg: mode === "dark" ? "#11272B" : "#DFF4F6",
            border: mode === "dark" ? "#265961" : "#89CCD4",
            text: mode === "dark" ? "#5CE1E6" : "#0E646D",
            dot: mode === "dark" ? "#5CE1E6" : "#0E7490",
          }
        : { bg: t.accentSoft, border: t.accentBorder, text: t.accentText, dot: t.accentText };

  // Measure status pill first to right-align cleanly
  const probe = renderPill({
    x: 0,
    y: 16,
    label: spec.status,
    bg: statusColors.bg,
    border: statusColors.border,
    textColor: statusColors.text,
    dotColor: statusColors.dot,
    fontSize: 8.8,
    height: 21,
    px: 8,
    letterSpacing: 0.7,
    fontWeight: 700,
  });

  const statusPill = renderPill({
    x: W - 20 - probe.width,
    y: 16,
    label: spec.status,
    bg: statusColors.bg,
    border: statusColors.border,
    textColor: statusColors.text,
    dotColor: statusColors.dot,
    fontSize: 8.8,
    height: 21,
    px: 8,
    letterSpacing: 0.7,
    fontWeight: 700,
  });

  // Render tag chips horizontally
  let cursorX = 20;
  const tagChips = spec.tags
    .map((tag) => {
      const chip = renderPill({
        x: cursorX,
        y: 124,
        label: tag,
        bg: t.bgSubtle,
        border: t.border,
        textColor: t.textSecondary,
        fontSize: 9.6,
        height: 23,
        px: 9,
        radius: 6,
      });
      cursorX += chip.width + 7;
      return chip.svg;
    })
    .join("");

  const arrowX = W - 28;
  const arrowY = 139;

  const body = `
  ${cardShell(W, H, t, 14)}

  <!-- Top accent edge bar -->
  <rect x="20" y="0.5" width="44" height="2.2" rx="1.1" fill="${statusColors.dot}" />

  <!-- Top Row: Code + Status -->
  <text x="20" y="30" class="mono" font-size="9.5" font-weight="600" letter-spacing="0.9" fill="${t.textMuted}">${esc(spec.code)}</text>
  ${statusPill.svg}

  <!-- Title and Description -->
  ${renderDisplayText({ text: spec.title, x: 20, y: 62, fontSize: 18.5, fontWeight: 700, letterSpacing: -0.4, fill: t.textPrimary })}
  ${renderDisplayText({ text: spec.line1, x: 20, y: 85, fontSize: 12.2, fontWeight: 400, fill: t.textSecondary })}
  ${renderDisplayText({ text: spec.line2, x: 20, y: 103, fontSize: 12.2, fontWeight: 400, fill: t.textSecondary })}

  <!-- Bottom Tags and External Arrow -->
  ${tagChips}
  <path d="M ${arrowX} ${arrowY} L ${arrowX + 7} ${arrowY - 7} M ${arrowX + 1.5} ${arrowY - 7} H ${arrowX + 7} V ${arrowY - 1.5}" fill="none" stroke="${t.accentText}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: `${spec.title} — ${spec.repoLabel}`,
    desc: `${spec.line1} ${spec.line2}`,
    body,
  });
}
