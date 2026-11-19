import { cardShell, renderBrandMark, signalGlowFilter, wrapSvg } from "../svg";
import { THEMES, type ThemeMode } from "../theme";

export function renderFooter(mode: ThemeMode): string {
  const t = THEMES[mode];
  const W = 880;
  const H = 64;
  const id = `footer-${mode}`;

  const carrierPath =
    "M 300 32 H 416 L 425 32 L 433 20 L 442 44 L 450 24 L 457 32 H 580";

  const defs = `
    ${signalGlowFilter(`${id}-glow`, 2)}
  `;

  const styles = `
    @keyframes footerPulse {
      0% { stroke-dashoffset: 310; opacity: 0.2; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { stroke-dashoffset: -310; opacity: 0.2; }
    }
    .${id}-wave {
      stroke-dasharray: 56 260;
      animation: footerPulse 3.6s linear infinite;
    }
    .${id}-brand-wave {
      stroke-dasharray: 34 34;
    }
  `;

  const body = `
  ${cardShell(W, H, t, 14)}

  ${renderBrandMark(18, 20, 24, id)}
  <text x="52" y="30" class="mono" font-size="11" font-weight="700" fill="${t.textPrimary}">scar0x00</text>
  <text x="52" y="45" class="mono" font-size="9.5" letter-spacing="0.8" fill="${t.textMuted}">BUILT TO CONNECT THE DOTS</text>

  <!-- Center Animated Signal Line -->
  <path d="${carrierPath}" stroke="${t.borderStrong}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <path class="${id}-wave" d="${carrierPath}" stroke="${mode === "dark" ? "#C7F36B" : "#4A851B"}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${id}-glow)" />
  <circle cx="300" cy="32" r="2.3" fill="${t.accentText}" />
  <circle cx="580" cy="32" r="2.3" fill="${t.accentText}" />

  <!-- Right Sign-off -->
  <text x="${W - 22}" y="30" text-anchor="end" class="mono" font-size="10.2" font-weight="600" letter-spacing="0.8" fill="${t.textPrimary}">VALENCIA, VE  ·  UTC-4</text>
  <text x="${W - 22}" y="45" text-anchor="end" class="mono" font-size="9.5" letter-spacing="0.6" fill="${t.textSecondary}">OPEN TO AMBITIOUS CLOUD &amp; AI SYSTEMS</text>
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: "scar0x00 — Built to connect the dots",
    defs,
    styles,
    body,
  });
}
