import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderTelemetry } from "./components/telemetry";
import { fetchGitHubTelemetry } from "./github";
import { PROFILE_META, type ThemeMode } from "./theme";

const OUT_DIR = join(import.meta.dir, "..", process.env.TELEMETRY_OUT_DIR ?? "dist");
const MODES: ThemeMode[] = ["dark", "light"];

async function main() {
  const username = process.env.GITHUB_USERNAME ?? PROFILE_META.username;
  const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;

  console.log(`Fetching live GitHub telemetry for @${username}...`);
  const data = await fetchGitHubTelemetry(username, token);
  console.log(
    `Loaded telemetry (${data.source}): ${data.totalContributions} contributions (1y), ${data.activeDays} active days, ${data.bestStreak}d best streak, latest=${data.latestRepo.name}`,
  );

  await mkdir(OUT_DIR, { recursive: true });

  await Promise.all(
    MODES.map((mode) =>
      writeFile(
        join(OUT_DIR, `telemetry-${mode}.svg`),
        renderTelemetry(data, mode),
        "utf8",
      ),
    ),
  );

  console.log(`Generated telemetry-dark.svg and telemetry-light.svg into ${OUT_DIR}`);
}

await main();
