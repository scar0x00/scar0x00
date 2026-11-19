import { esc, estimateTextWidth, wrapSvg } from "../svg";
import { THEMES, type ThemeMode } from "../theme";

export type ButtonVariant = "primary" | "secondary" | "amber";

export interface ButtonSpec {
  id: string;
  label: string;
  variant: ButtonVariant;
  icon: "signal" | "linkedin" | "x" | "mail" | "github";
}

export const PROFILE_BUTTONS: ButtonSpec[] = [
  { id: "website", label: "scar0x00.click", variant: "primary", icon: "signal" },
  { id: "linkedin", label: "LinkedIn", variant: "secondary", icon: "linkedin" },
  { id: "x", label: "@scar0x00", variant: "secondary", icon: "x" },
  { id: "email", label: "Email Óscar", variant: "secondary", icon: "mail" },
  { id: "remain", label: "Inspect Remain on GitHub", variant: "amber", icon: "github" },
];

function renderIcon(icon: ButtonSpec["icon"], color: string, x: number, y: number): string {
  switch (icon) {
    case "signal":
      return `<g transform="translate(${x}, ${y})">
        <path d="M1 8.5h3.2l2.2-5 2.2 5H12" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="1" cy="8.5" r="1.2" fill="${color}" />
        <circle cx="12" cy="8.5" r="1.2" fill="${color}" />
      </g>`;
    case "linkedin":
      return `<g transform="translate(${x}, ${y})">
        <rect x="0.8" y="0.8" width="12.4" height="12.4" rx="2.6" fill="none" stroke="${color}" stroke-width="1.4" />
        <circle cx="4.3" cy="4.4" r="1" fill="${color}" />
        <path d="M4.3 6.5v3.8M7 10.3V6.5m0 1.4c0-1 .7-1.5 1.5-1.5s1.4.5 1.4 1.5v2.4" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </g>`;
    case "x":
      return `<g transform="translate(${x}, ${y})">
        <path d="M2 2l10 10M12 2L2 12" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" />
      </g>`;
    case "mail":
      return `<g transform="translate(${x}, ${y})">
        <rect x="1" y="2.4" width="12" height="9.2" rx="1.8" fill="none" stroke="${color}" stroke-width="1.4" />
        <path d="M1.6 3.5l5.4 4.1 5.4-4.1" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </g>`;
    case "github":
      return `<g transform="translate(${x}, ${y})">
        <path d="M7 1.2a5.8 5.8 0 0 0-1.83 11.3c.29.05.4-.13.4-.28v-1c-1.62.35-1.96-.78-1.96-.78-.27-.67-.65-.85-.65-.85-.53-.36.04-.35.04-.35.58.04.89.6.89.6.52.89 1.36.63 1.7.48.05-.37.2-.63.36-.77-1.29-.15-2.65-.65-2.65-2.88 0-.64.23-1.16.6-1.57-.06-.15-.26-.74.06-1.54 0 0 .49-.16 1.6.6a5.5 5.5 0 0 1 2.9 0c1.1-.76 1.6-.6 1.6-.6.32.8.12 1.39.06 1.54.37.41.6.93.6 1.57 0 2.24-1.36 2.73-2.66 2.88.21.18.4.54.4 1.08v1.6c0 .15.1.33.4.28A5.8 5.8 0 0 0 7 1.2Z" fill="${color}" />
      </g>`;
  }
}

export function renderButton(spec: ButtonSpec, mode: ThemeMode): string {
  const t = THEMES[mode];
  const H = 36;
  const fontSize = 12;
  const textW = estimateTextWidth(spec.label, fontSize, "sans", 0.1, 600);
  const W = Math.ceil(36 + textW + 12 + 8 + 16);

  let fill: string;
  let stroke: string;
  let textColor: string;
  let arrowColor: string;

  if (spec.variant === "primary") {
    fill = "#C7F36B";
    stroke = mode === "dark" ? "#C7F36B" : "#B4E254";
    textColor = "#101A1B";
    arrowColor = "#101A1B";
  } else if (spec.variant === "amber") {
    fill = mode === "dark" ? "#FBBF24" : "#101A1B";
    stroke = mode === "dark" ? "#FBBF24" : "#101A1B";
    textColor = mode === "dark" ? "#101A1B" : "#F4F7F5";
    arrowColor = mode === "dark" ? "#101A1B" : "#FBBF24";
  } else {
    fill = t.bgElevated;
    stroke = t.borderStrong;
    textColor = t.textPrimary;
    arrowColor = t.accentText;
  }

  const arrowX = W - 22;

  const body = `
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="${H / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" />
  ${renderIcon(spec.icon, textColor, 15, 11)}
  <text x="36" y="22.3" class="sans" font-size="${fontSize}" font-weight="600" letter-spacing="0.1" fill="${textColor}">${esc(spec.label)}</text>
  <path d="M ${arrowX} 21.5 L ${arrowX + 6.5} 15 M ${arrowX + 1.5} 15 H ${arrowX + 6.5} V 20" fill="none" stroke="${arrowColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  `;

  return wrapSvg({
    width: W,
    height: H,
    title: spec.label,
    body,
  });
}
