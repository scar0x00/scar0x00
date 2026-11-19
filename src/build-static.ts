import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PROFILE_BUTTONS, renderButton } from "./components/buttons";
import { renderFooter } from "./components/footer";
import { renderHero } from "./components/hero";
import { PROJECT_CARDS, renderProjectCard } from "./components/project-cards";
import { renderRemainArch } from "./components/remain-arch";
import { renderSectionHeader, SECTIONS } from "./components/section-header";
import { renderStack } from "./components/stack";
import type { ThemeMode } from "./theme";

const OUT_DIR = join(import.meta.dir, "..", "assets");
const MODES: ThemeMode[] = ["dark", "light"];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files: Array<{ name: string; content: string }> = [];

  for (const mode of MODES) {
    files.push({ name: `hero-${mode}.svg`, content: renderHero(mode) });
    files.push({ name: `remain-arch-${mode}.svg`, content: renderRemainArch(mode) });
    files.push({ name: `stack-${mode}.svg`, content: renderStack(mode) });
    files.push({ name: `footer-${mode}.svg`, content: renderFooter(mode) });

    for (const btn of PROFILE_BUTTONS) {
      files.push({
        name: `btn-${btn.id}-${mode}.svg`,
        content: renderButton(btn, mode),
      });
    }

    for (const sec of SECTIONS) {
      files.push({
        name: `section-${sec.id}-${mode}.svg`,
        content: renderSectionHeader(sec, mode),
      });
    }

    for (const card of PROJECT_CARDS) {
      files.push({
        name: `project-${card.id}-${mode}.svg`,
        content: renderProjectCard(card, mode),
      });
    }
  }

  await Promise.all(
    files.map((file) => writeFile(join(OUT_DIR, file.name), file.content, "utf8")),
  );

  console.log(`Generated ${files.length} static profile SVGs into assets/`);
}

await main();
