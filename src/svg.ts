import { measureDisplayText, renderDisplayText } from "./font";
import { FONTS, type ThemePalette } from "./theme";

export { measureDisplayText, renderDisplayText };

/** Strict XML text/attribute escaper */
export function esc(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Deterministic visual text width measurer (px).
 * Uses exact Space Grotesk glyph + GPOS kerning metrics for `sans`,
 * and conservative fixed-width estimates for `mono` across OS renderers.
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  family: "sans" | "mono" = "sans",
  letterSpacing = 0,
  fontWeight = 400,
): number {
  if (family === "mono") {
    const charW = fontWeight >= 600 ? fontSize * 0.665 : fontSize * 0.615;
    return Math.ceil(text.length * charW + Math.max(0, text.length - 1) * letterSpacing);
  }

  return Math.ceil(measureDisplayText(text, fontSize, fontWeight, letterSpacing));
}

/**
 * Signature scar0x00 telecom signal pulse icon (adapted from scar0x00.click favicon).
 */
export function renderBrandMark(x: number, y: number, size: number, idPrefix: string): string {
  const scale = size / 48;
  return `
  <g transform="translate(${x}, ${y}) scale(${scale.toFixed(4)})">
    <rect width="48" height="48" rx="14" fill="#101A1B" stroke="#263B3E" stroke-width="2" />
    <path d="M12 28h7.5l4.5-11 4.5 11H36" fill="none" stroke="#C7F36B" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2" opacity="0.35" />
    <path class="${idPrefix}-brand-wave" d="M12 28h7.5l4.5-11 4.5 11H36" fill="none" stroke="#C7F36B" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2" />
    <circle cx="12" cy="28" r="2.7" fill="#C7F36B" />
    <circle cx="36" cy="28" r="2.7" fill="#C7F36B" />
  </g>`;
}

/** Reusable subtle dot-grid `<pattern>` definition */
export function dotGridPattern(id: string, color: string, step = 18, radius = 0.9): string {
  return `<pattern id="${esc(id)}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">
    <circle cx="${step / 2}" cy="${step / 2}" r="${radius}" fill="${color}" />
  </pattern>`;
}

/** Reusable soft neon glow filter for signal pulses */
export function signalGlowFilter(id: string, stdDeviation = 2.4): string {
  return `<filter id="${esc(id)}" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="${stdDeviation}" result="blur" />
    <feMerge>
      <feMergeNode in="blur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>`;
}

/** Standard SVG document wrapper with clean accessibility metadata and font classes */
export function wrapSvg(opts: {
  width: number;
  height: number;
  title: string;
  desc?: string;
  styles?: string;
  defs?: string;
  body: string;
}): string {
  const baseStyles = `
    .sans { font-family: ${FONTS.sans}; }
    .mono { font-family: ${FONTS.mono}; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${opts.height}" viewBox="0 0 ${opts.width} ${opts.height}" fill="none" role="img" aria-label="${esc(opts.title)}">
  <title>${esc(opts.title)}</title>${opts.desc ? `\n  <desc>${esc(opts.desc)}</desc>` : ""}
  <defs>${opts.defs ?? ""}</defs>
  <style>${baseStyles}${opts.styles ?? ""}</style>${opts.body}
</svg>
`;
}

/** Helper to render a rounded pill with optional leading status dot */
export function renderPill(opts: {
  x: number;
  y: number;
  label: string;
  bg: string;
  border: string;
  textColor: string;
  dotColor?: string;
  fontSize?: number;
  height?: number;
  px?: number;
  family?: "sans" | "mono";
  fontWeight?: number;
  letterSpacing?: number;
  radius?: number;
}): { svg: string; width: number } {
  const fontSize = opts.fontSize ?? 11;
  const height = opts.height ?? 24;
  const px = opts.px ?? 10;
  const family = opts.family ?? "mono";
  const fontWeight = opts.fontWeight ?? 500;
  const letterSpacing = opts.letterSpacing ?? 0;
  const radius = opts.radius ?? height / 2;
  const dotSpace = opts.dotColor ? 13 : 0;
  const textWidth = estimateTextWidth(
    opts.label,
    fontSize,
    family,
    letterSpacing,
    fontWeight,
  );
  const width = Math.ceil(px * 2 + dotSpace + textWidth + (family === "mono" ? 2 : 0));
  const cy = opts.y + height / 2;
  const textX = opts.x + px + dotSpace;

  const dot = opts.dotColor
    ? `<circle cx="${opts.x + px + 3.5}" cy="${cy}" r="3" fill="${opts.dotColor}" />`
    : "";

  const labelSvg =
    family === "sans"
      ? renderDisplayText({
          text: opts.label,
          x: textX,
          y: cy + fontSize * 0.35,
          fontSize,
          fontWeight,
          letterSpacing,
          fill: opts.textColor,
        })
      : `<text x="${textX}" y="${cy + fontSize * 0.34}" class="${family}" font-size="${fontSize}" font-weight="${fontWeight}" letter-spacing="${letterSpacing}" fill="${opts.textColor}">${esc(opts.label)}</text>`;

  const svg = `<g>
    <rect x="${opts.x}" y="${opts.y}" width="${width}" height="${height}" rx="${radius}" fill="${opts.bg}" stroke="${opts.border}" stroke-width="1" />
    ${dot}
    ${labelSvg}
  </g>`;

  return { svg, width };
}

/** Subtle outer card frame helper */
export function cardShell(
  width: number,
  height: number,
  t: ThemePalette,
  radius = 16,
): string {
  return `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${t.bg}" stroke="${t.border}" stroke-width="1" />`;
}
