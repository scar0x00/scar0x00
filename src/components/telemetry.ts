import {
  computeTenureLabel,
  formatMonthYear,
  formatShortDate,
  type TelemetryData,
} from "../github";
import {
  cardShell,
  dotGridPattern,
  esc,
  signalGlowFilter,
  wrapSvg,
} from "../svg";
import { LANGUAGE_COLORS, THEMES, type ThemeMode } from "../theme";

const MONTHS_UPPER = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export function renderTelemetry(data: TelemetryData, mode: ThemeMode): string {
  const t = THEMES[mode];
  const W = 880;
  const H = 326;
  const id = `telemetry-${mode}`;

  const tenure = computeTenureLabel(data.createdAt);
  const sinceLabel = `since ${formatMonthYear(data.createdAt)} · ${data.publicRepos} repos`;

  const velocityValue =
    data.currentStreak >= 2
      ? `${data.currentStreak}d live`
      : data.peakDayCount > 0
        ? `${data.peakDayCount} / day`
        : `${data.bestStreak}d`;

  const velocitySub =
    data.currentStreak >= 2
      ? `${data.bestStreak}d best · ${data.peakDayCount}/day peak`
      : `${data.bestStreak}d best streak`;

  const repoDisplayName =
    data.latestRepo.name.length > 18
      ? `${data.latestRepo.name.slice(0, 17)}…`
      : data.latestRepo.name;
  const repoFontSize = data.latestRepo.name.length > 14 ? 15.5 : 18;

  const kpis = [
    {
      label: "CONTRIBUTIONS · 1Y",
      value: data.totalContributions.toLocaleString("en-US"),
      sub: `${data.activeDays} active days`,
      fontSize: 24,
      highlight: true,
    },
    {
      label: data.currentStreak >= 2 ? "ACTIVE STREAK" : "PEAK VELOCITY",
      value: velocityValue,
      sub: velocitySub,
      fontSize: 23,
      highlight: false,
    },
    {
      label: "LATEST BUILD",
      value: repoDisplayName,
      sub: `${data.latestRepo.language} · ${formatShortDate(data.latestRepo.updatedAt)}`,
      fontSize: repoFontSize,
      highlight: false,
    },
    {
      label: "GITHUB TENURE",
      value: tenure,
      sub: sinceLabel,
      fontSize: 24,
      highlight: false,
    },
  ];

  // 4 KPI tiles across width: margin 20, gap 10 => 4 * 202.5 = 810 + 30 = 840
  const tileW = 202.5;
  const tileH = 76;
  const tileY = 58;

  const kpisSvg = kpis
    .map((kpi, idx) => {
      const tx = 20 + idx * (tileW + 10);
      return `
    <g>
      <rect x="${tx}" y="${tileY}" width="${tileW}" height="${tileH}" rx="11" fill="${t.bgElevated}" stroke="${kpi.highlight ? t.accentBorder : t.border}" stroke-width="1" />
      <text x="${tx + 14}" y="${tileY + 21}" class="mono" font-size="9" font-weight="600" letter-spacing="0.8" fill="${kpi.highlight ? t.accentText : t.textMuted}">${esc(kpi.label)}</text>
      <text x="${tx + 14}" y="${tileY + 49}" class="mono" font-size="${kpi.fontSize}" font-weight="700" fill="${t.textPrimary}">${esc(kpi.value)}</text>
      <text x="${tx + 14}" y="${tileY + 65}" class="sans" font-size="10.8" fill="${t.textSecondary}">${esc(kpi.sub)}</text>
    </g>`;
    })
    .join("");

  // Left Lower Deck: 36-Week Signal Spectrum
  const specX = 20;
  const specY = 148;
  const specW = 524;
  const specH = 158;

  const weeks = data.weeklyTotals;
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  const plotLeft = specX + 18;
  const plotRight = specX + specW - 18;
  const plotTop = specY + 42;
  const plotBottom = specY + specH - 28;
  const plotH = plotBottom - plotTop;
  const plotW = plotRight - plotLeft;

  const barCount = Math.max(1, weeks.length);
  const slotW = plotW / barCount;
  const barW = Math.max(4, Math.floor(slotW - 3.6));

  let lastMonth = -1;
  let lastMonthX = -999;
  const monthLabels: string[] = [];

  const barsSvg = weeks
    .map((w, idx) => {
      const bx = plotLeft + idx * slotW + (slotW - barW) / 2;
      const ratio = w.count / maxWeek;
      const bh = w.count === 0 ? 4 : Math.max(7, Math.round(ratio * plotH));
      const by = plotBottom - bh;

      let fill = t.spectrum[0];
      if (w.count > 0) {
        if (ratio >= 0.72) fill = t.spectrum[4];
        else if (ratio >= 0.45) fill = t.spectrum[3];
        else if (ratio >= 0.2) fill = t.spectrum[2];
        else fill = t.spectrum[1];
      }

      // Track clean non-overlapping month labels
      const dt = new Date(`${w.weekStart}T00:00:00Z`);
      if (!Number.isNaN(dt.getTime())) {
        const m = dt.getUTCMonth();
        if (m !== lastMonth && bx - lastMonthX >= 42) {
          monthLabels.push(
            `<text x="${bx.toFixed(1)}" y="${plotBottom + 16}" class="mono" font-size="8.6" font-weight="600" letter-spacing="0.5" fill="${t.deckMuted}">${MONTHS_UPPER[m] ?? ""}</text>`,
          );
          lastMonth = m;
          lastMonthX = bx;
        }
      }

      const glowAttr = ratio >= 0.72 ? ` filter="url(#${id}-glow)"` : "";
      return `<rect x="${bx.toFixed(1)}" y="${by}" width="${barW}" height="${bh}" rx="2.5" fill="${fill}"${glowAttr} />`;
    })
    .join("\n      ");

  // Right Lower Deck: Language Footprint
  const langX = 556;
  const langY = 148;
  const langW = 304;
  const langH = 158;

  const barTrackX = langX + 16;
  const barTrackY = langY + 40;
  const barTrackW = langW - 32;
  const barTrackH = 9;

  const langs = data.languages.length
    ? data.languages
    : [{ name: "TypeScript", bytes: 1, percent: 100 }];

  const totalPct = langs.reduce((s, l) => s + l.percent, 0) || 100;
  let segCursor = barTrackX;
  const segGap = 2.5;
  const usableTrackW = barTrackW - segGap * Math.max(0, langs.length - 1);

  const langSegmentsSvg = langs
    .map((lang, idx) => {
      const color = LANGUAGE_COLORS[lang.name] ?? LANGUAGE_COLORS.Other ?? "#8FA3A0";
      const rawW = (lang.percent / totalPct) * usableTrackW;
      const segW =
        idx === langs.length - 1
          ? Math.max(4, barTrackX + barTrackW - segCursor)
          : Math.max(4, rawW);
      const rect = `<rect x="${segCursor.toFixed(1)}" y="${barTrackY}" width="${segW.toFixed(1)}" height="${barTrackH}" rx="3" fill="${color}" />`;
      segCursor += segW + segGap;
      return rect;
    })
    .join("");

  const langLegendSvg = langs
    .map((lang, idx) => {
      const ly = langY + 69 + idx * 18;
      const color = LANGUAGE_COLORS[lang.name] ?? LANGUAGE_COLORS.Other ?? "#8FA3A0";
      return `
      <g>
        <circle cx="${langX + 20}" cy="${ly - 3.5}" r="3.4" fill="${color}" />
        <text x="${langX + 32}" y="${ly}" class="sans" font-size="11.2" font-weight="500" fill="${t.textPrimary}">${esc(lang.name)}</text>
        <text x="${langX + langW - 16}" y="${ly}" text-anchor="end" class="mono" font-size="10.8" font-weight="600" fill="${t.textSecondary}">${lang.percent.toFixed(1)}%</text>
      </g>`;
    })
    .join("");

  const defs = `
    ${dotGridPattern(`${id}-deck-grid`, t.deckGridDot, 16, 0.8)}
    ${signalGlowFilter(`${id}-glow`, 2.0)}
    <clipPath id="${id}-spec-clip">
      <rect x="${specX}" y="${specY}" width="${specW}" height="${specH}" rx="12" />
    </clipPath>
    <linearGradient id="${id}-scan-beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C7F36B" stop-opacity="0" />
      <stop offset="50%" stop-color="#C7F36B" stop-opacity="0.13" />
      <stop offset="100%" stop-color="#C7F36B" stop-opacity="0" />
    </linearGradient>
  `;

  const styles = `
    @keyframes telemetryBeacon {
      0%, 100% { opacity: 0.9; transform: scale(1); }
      50% { opacity: 0.25; transform: scale(2.1); }
    }
    @keyframes spectrumScan {
      0% { transform: translateX(0px); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateX(620px); opacity: 0; }
    }
    .${id}-beacon {
      transform-box: fill-box;
      transform-origin: center;
      animation: telemetryBeacon 2.6s ease-in-out infinite;
    }
    .${id}-scan {
      animation: spectrumScan 6.5s linear infinite;
    }
  `;

  const body = `
  ${cardShell(W, H, t, 16)}

  <!-- Header Strip -->
  <circle class="${id}-beacon" cx="24" cy="23" r="4" fill="#C7F36B" opacity="0.5" />
  <circle cx="24" cy="23" r="3" fill="${mode === "dark" ? "#C7F36B" : "#4A851B"}" />
  <text x="36" y="27" class="mono" font-size="11" font-weight="700" letter-spacing="0.8" fill="${t.textPrimary}">LIVE TELEMETRY // @${esc(data.username)}</text>

  <text x="${W - 20}" y="27" text-anchor="end" class="mono" font-size="9.6" font-weight="500" letter-spacing="0.6" fill="${t.textMuted}">SYNCED ${esc(data.syncedAt)}  ·  GH ${data.source === "graphql" ? "GRAPHQL" : "API"}</text>
  <line x1="1" y1="45" x2="${W - 1}" y2="45" stroke="${t.border}" stroke-width="1" />

  <!-- 4 KPI Metric Tiles -->
  ${kpisSvg}

  <!-- Lower Left: 36-Week Signal Spectrum -->
  <g clip-path="url(#${id}-spec-clip)">
    <rect x="${specX}" y="${specY}" width="${specW}" height="${specH}" rx="12" fill="${t.deckBg}" />
    <rect x="${specX}" y="${specY}" width="${specW}" height="${specH}" fill="url(#${id}-deck-grid)" opacity="0.5" />

    <!-- Subtle animated radar sweep across bars (starts off-canvas so static snapshots stay clean) -->
    <rect class="${id}-scan" x="${specX - 90}" y="${plotTop - 6}" width="84" height="${plotH + 10}" fill="url(#${id}-scan-beam)" />

    <text x="${specX + 18}" y="${specY + 23}" class="mono" font-size="9.4" font-weight="600" letter-spacing="0.8" fill="${t.deckSubtext}">WEEKLY SIGNAL SPECTRUM // LAST ${barCount} WEEKS</text>
    <text x="${specX + specW - 18}" y="${specY + 23}" text-anchor="end" class="mono" font-size="9.2" font-weight="700" letter-spacing="0.6" fill="#C7F36B">PEAK ${maxWeek}/WK</text>

    <!-- Horizontal guide rails -->
    <line x1="${plotLeft}" y1="${plotTop}" x2="${plotRight}" y2="${plotTop}" stroke="${t.deckBorder}" stroke-width="0.9" stroke-dasharray="3 4" />
    <line x1="${plotLeft}" y1="${plotTop + plotH / 2}" x2="${plotRight}" y2="${plotTop + plotH / 2}" stroke="${t.deckBorder}" stroke-width="0.9" stroke-dasharray="3 4" />
    <line x1="${plotLeft}" y1="${plotBottom + 0.5}" x2="${plotRight}" y2="${plotBottom + 0.5}" stroke="${t.deckTrace}" stroke-width="1" />

    <!-- Weekly Bars -->
    ${barsSvg}

    <!-- Month Axis -->
    ${monthLabels.join("\n    ")}
  </g>
  <rect x="${specX + 0.5}" y="${specY + 0.5}" width="${specW - 1}" height="${specH - 1}" rx="12" fill="none" stroke="${t.deckBorder}" stroke-width="1" />

  <!-- Lower Right: Language Footprint -->
  <rect x="${langX}" y="${langY}" width="${langW}" height="${langH}" rx="12" fill="${t.bgElevated}" stroke="${t.border}" stroke-width="1" />
  <text x="${langX + 16}" y="${langY + 23}" class="mono" font-size="9.4" font-weight="600" letter-spacing="0.8" fill="${t.textMuted}">LANGUAGE FOOTPRINT</text>
  <text x="${langX + langW - 16}" y="${langY + 23}" text-anchor="end" class="mono" font-size="9" letter-spacing="0.6" fill="${t.accentText}">${data.publicRepos} PUBLIC REPOS</text>

  <!-- Segmented Proportional Bar -->
  <rect x="${barTrackX}" y="${barTrackY}" width="${barTrackW}" height="${barTrackH}" rx="3" fill="${t.bgSubtle}" />
  ${langSegmentsSvg}

  <!-- Language Breakdown Rows -->
  ${langLegendSvg}
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: `Live GitHub Telemetry for @${data.username}`,
    desc: `${data.totalContributions} contributions in the last year across ${data.activeDays} active days, ${data.bestStreak}-day best streak, latest build ${data.latestRepo.name}.`,
    defs,
    styles,
    body,
  });
}
