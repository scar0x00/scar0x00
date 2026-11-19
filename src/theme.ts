export type ThemeMode = "dark" | "light";

export interface ThemePalette {
  mode: ThemeMode;
  /** Primary outer card background */
  bg: string;
  /** Inner elevated tile/subcard surface */
  bgElevated: string;
  /** Subtle chip / track surface */
  bgSubtle: string;
  /** Hairline card border */
  border: string;
  /** Stronger border for interactive/active surfaces */
  borderStrong: string;
  /** Primary display & body text */
  textPrimary: string;
  /** Secondary body text */
  textSecondary: string;
  /** Telemetry & metadata labels */
  textMuted: string;
  /** Signature scar0x00 electric signal lime */
  accent: string;
  /** Accessible accent text on the card canvas */
  accentText: string;
  /** Soft accent background wash */
  accentSoft: string;
  /** Accent border */
  accentBorder: string;
  /** High-contrast dark ink used on solid #C7F36B fills */
  accentInk: string;
  /** Deep architectural inset blueprint deck (dark in both themes, matching scar0x00.click) */
  deckBg: string;
  /** Elevated node background inside the architectural deck */
  deckNodeBg: string;
  /** Active node background inside the architectural deck */
  deckNodeActiveBg: string;
  /** Deck hairline border */
  deckBorder: string;
  /** Deck circuit trace wire color */
  deckTrace: string;
  /** Deck dot-grid fill */
  deckGridDot: string;
  /** Deck primary text */
  deckText: string;
  /** Deck secondary text */
  deckSubtext: string;
  /** Deck muted text */
  deckMuted: string;
  /** Outer card dot-grid fill */
  gridDot: string;
  /** Remain warm amber highlight */
  amber: string;
  /** Accessible amber text on card canvas */
  amberText: string;
  /** Soft amber pill background */
  amberSoft: string;
  /** Amber pill border */
  amberBorder: string;
  /** Subtle signal cyan for secondary data channels */
  cyan: string;
  /** Spectrum bar color ramp (levels 0..4) */
  spectrum: [string, string, string, string, string];
}

export const FONTS = {
  /** Fallback stack (primary display/sans text is compiled to Space Grotesk SVG paths in src/font.ts) */
  sans: "'Space Grotesk', 'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Liberation Sans', 'DejaVu Sans', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', ui-monospace, 'Cascadia Mono', 'Liberation Mono', 'DejaVu Sans Mono', Menlo, Consolas, monospace",
} as const;

export const THEMES: Record<ThemeMode, ThemePalette> = {
  dark: {
    mode: "dark",
    bg: "#0D1516",
    bgElevated: "#121E20",
    bgSubtle: "#172628",
    border: "#1F3134",
    borderStrong: "#2E464A",
    textPrimary: "#F4F7F5",
    textSecondary: "#9CB2AF",
    textMuted: "#6B827F",
    accent: "#C7F36B",
    accentText: "#C7F36B",
    accentSoft: "#1A2A1E",
    accentBorder: "#3F5E30",
    accentInk: "#101A1B",
    deckBg: "#091011",
    deckNodeBg: "#111D1F",
    deckNodeActiveBg: "#152522",
    deckBorder: "#1D2E31",
    deckTrace: "#2E4548",
    deckGridDot: "#1A2A2D",
    deckText: "#F4F7F5",
    deckSubtext: "#98AEAB",
    deckMuted: "#657B78",
    gridDot: "#1B2B2D",
    amber: "#FBBF24",
    amberText: "#FBBF24",
    amberSoft: "#2A2212",
    amberBorder: "#664D1B",
    cyan: "#5CE1E6",
    spectrum: ["#172527", "#24402D", "#3F7338", "#7FB94C", "#C7F36B"],
  },
  light: {
    mode: "light",
    bg: "#F4F7F5",
    bgElevated: "#FFFFFF",
    bgSubtle: "#E8EFEA",
    border: "#D3DFDA",
    borderStrong: "#B5C6C0",
    textPrimary: "#101A1B",
    textSecondary: "#495A58",
    textMuted: "#5E716E",
    accent: "#C7F36B",
    accentText: "#33660F",
    accentSoft: "#E4F2D0",
    accentBorder: "#A3CF69",
    accentInk: "#101A1B",
    deckBg: "#101A1B",
    deckNodeBg: "#172527",
    deckNodeActiveBg: "#1B2E26",
    deckBorder: "#233639",
    deckTrace: "#385154",
    deckGridDot: "#1F3235",
    deckText: "#F4F7F5",
    deckSubtext: "#A3B8B5",
    deckMuted: "#718885",
    gridDot: "#CFDCD7",
    amber: "#FBBF24",
    amberText: "#9A5B06",
    amberSoft: "#FEF3D6",
    amberBorder: "#E5BE68",
    cyan: "#5CE1E6",
    spectrum: ["#1A2B2D", "#284B32", "#46813D", "#84BE4F", "#C7F36B"],
  },
};

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#C7F36B",
  JavaScript: "#FBBF24",
  HTML: "#5CE1E6",
  CSS: "#7AA2F7",
  Python: "#A78BFA",
  Go: "#38BDF8",
  "C#": "#C084FC",
  Shell: "#6EE7B7",
  PowerShell: "#60A5FA",
  Astro: "#F472B6",
  Dockerfile: "#22D3EE",
  Other: "#8FA3A0",
};

export const PROFILE_META = {
  username: "scar0x00",
  displayName: "Óscar Mejías",
  location: "VALENCIA, VE",
  timezone: "UTC-4",
  languages: "EN / ES",
  website: "scar0x00.click",
  email: "oscar.mejias@scar0x00.click",
  linkedin: "oscarmejias-dev",
} as const;
