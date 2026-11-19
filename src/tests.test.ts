import { describe, expect, test } from "bun:test";
import { PROFILE_BUTTONS, renderButton } from "./components/buttons";
import { renderFooter } from "./components/footer";
import { renderHero } from "./components/hero";
import { PROJECT_CARDS, renderProjectCard } from "./components/project-cards";
import { renderRemainArch } from "./components/remain-arch";
import { renderSectionHeader, SECTIONS } from "./components/section-header";
import { renderStack } from "./components/stack";
import { renderTelemetry } from "./components/telemetry";
import { getDisplayFont, measureDisplayText, renderDisplayText } from "./font";
import {
  aggregateLanguages,
  computeCalendarStats,
  type TelemetryData,
} from "./github";
import type { ThemeMode } from "./theme";

const MODES: ThemeMode[] = ["dark", "light"];

const SAMPLE_TELEMETRY: TelemetryData = {
  username: "scar0x00",
  syncedAt: "2026-11-19 00:00 UTC",
  source: "graphql",
  totalContributions: 273,
  activeDays: 58,
  peakDayCount: 22,
  bestStreak: 8,
  currentStreak: 3,
  publicRepos: 4,
  totalStars: 3,
  createdAt: "2020-01-24T20:39:13Z",
  latestRepo: {
    name: "remain-monorepo",
    language: "TypeScript",
    updatedAt: "2026-11-06T22:09:40Z",
  },
  weeklyTotals: Array.from({ length: 36 }, (_, i) => ({
    weekStart: `2026-${String(Math.floor(i / 4) + 3).padStart(2, "0")}-01`,
    count: i % 5 === 0 ? 28 : (i * 3) % 17,
  })),
  languages: [
    { name: "TypeScript", bytes: 711040, percent: 82.9 },
    { name: "HTML", bytes: 133768, percent: 15.6 },
    { name: "CSS", bytes: 15384, percent: 1.8 },
  ],
};

function assertValidSvg(svg: string, label: string) {
  expect(svg.startsWith("<svg "), `${label} should start with <svg`).toBe(true);
  expect(svg.trimEnd().endsWith("</svg>"), `${label} should end with </svg>`).toBe(true);
  expect(svg.includes("NaN"), `${label} must not contain NaN`).toBe(false);
  expect(svg.includes("undefined"), `${label} must not contain undefined`).toBe(false);
  // Check no unescaped bare ampersands (e.g., "A & B" instead of "A &amp; B")
  expect(
    /&(?!(amp|lt|gt|quot|#39|#x[0-9a-fA-F]+);)/.test(svg),
    `${label} must XML-escape all ampersands`,
  ).toBe(false);
  // Display/sans text must be compiled to vector paths (GitHub CSP blocks custom fonts)
  expect(
    svg.includes('class="sans"'),
    `${label} must not fall back to system class="sans" text`,
  ).toBe(false);
}

describe("SVG component rendering", () => {
  for (const mode of MODES) {
    test(`renders clean valid SVGs in ${mode} mode`, () => {
      assertValidSvg(renderHero(mode), `hero-${mode}`);
      assertValidSvg(renderRemainArch(mode), `remain-arch-${mode}`);
      assertValidSvg(renderStack(mode), `stack-${mode}`);
      assertValidSvg(renderFooter(mode), `footer-${mode}`);
      assertValidSvg(renderTelemetry(SAMPLE_TELEMETRY, mode), `telemetry-${mode}`);

      for (const btn of PROFILE_BUTTONS) {
        assertValidSvg(renderButton(btn, mode), `btn-${btn.id}-${mode}`);
      }
      for (const sec of SECTIONS) {
        assertValidSvg(renderSectionHeader(sec, mode), `section-${sec.id}-${mode}`);
      }
      for (const card of PROJECT_CARDS) {
        assertValidSvg(renderProjectCard(card, mode), `project-${card.id}-${mode}`);
      }
    });
  }
});

describe("Space Grotesk vector font engine", () => {
  test("loads all 4 weights, resolves diacritics, and applies GPOS kerning", () => {
    for (const weight of [400, 500, 600, 700] as const) {
      const font = getDisplayFont(weight);
      expect(font.unitsPerEm).toBe(1000);

      for (const ch of ["Ó", "í", "—", "·", "…", "&", "#"]) {
        const gid = font.getGlyphId(ch.codePointAt(0)!);
        expect(gid, `weight ${weight} should map "${ch}"`).toBeGreaterThan(0);
        expect(font.getGlyphContours(gid).length).toBeGreaterThan(0);
      }

      const tGid = font.getGlyphId("T".codePointAt(0)!);
      const eGid = font.getGlyphId("e".codePointAt(0)!);
      expect(font.getKerning(tGid, eGid)).toBeLessThan(0);
    }

    const path = renderDisplayText({
      text: "Óscar Mejías",
      x: 28,
      y: 145,
      fontSize: 45,
      fontWeight: 700,
      letterSpacing: -1.4,
      fill: "#F4F7F5",
    });
    expect(path.startsWith('<path d="M')).toBe(true);
    expect(measureDisplayText("Óscar Mejías", 45, 700, -1.4)).toBeGreaterThan(200);
  });
});

describe("GitHub telemetry calculations", () => {
  test("computes streaks, active days, and peak day accurately", () => {
    const stats = computeCalendarStats([
      { date: "2026-11-10", count: 2 },
      { date: "2026-11-11", count: 5 },
      { date: "2026-11-12", count: 14 },
      { date: "2026-11-13", count: 0 },
      { date: "2026-11-14", count: 3 },
      { date: "2026-11-15", count: 1 },
      { date: "2026-11-16", count: 0 }, // today with 0 commits still preserves yesterday's 2-day streak
    ]);

    expect(stats.totalContributions).toBe(25);
    expect(stats.activeDays).toBe(5);
    expect(stats.peakDayCount).toBe(14);
    expect(stats.bestStreak).toBe(3);
    expect(stats.currentStreak).toBe(2);
  });

  test("aggregates language bytes into sorted percentages", () => {
    const langs = aggregateLanguages({
      TypeScript: 800,
      HTML: 150,
      CSS: 50,
    });

    expect(langs).toHaveLength(3);
    expect(langs[0]?.name).toBe("TypeScript");
    expect(langs[0]?.percent).toBe(80);
    expect(langs[1]?.name).toBe("HTML");
    expect(langs[2]?.name).toBe("CSS");
  });
});
