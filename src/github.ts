export interface ContributionDay {
  date: string;
  count: number;
}

export interface WeekBucket {
  weekStart: string;
  count: number;
}

export interface LanguageStat {
  name: string;
  bytes: number;
  percent: number;
}

export interface LatestRepo {
  name: string;
  language: string;
  updatedAt: string;
}

export interface TelemetryData {
  username: string;
  syncedAt: string;
  source: "graphql" | "public";
  totalContributions: number;
  activeDays: number;
  peakDayCount: number;
  bestStreak: number;
  currentStreak: number;
  publicRepos: number;
  totalStars: number;
  createdAt: string;
  latestRepo: LatestRepo;
  weeklyTotals: WeekBucket[];
  languages: LanguageStat[];
}

export interface CalendarMetrics {
  totalContributions: number;
  activeDays: number;
  peakDayCount: number;
  bestStreak: number;
  currentStreak: number;
  weeklyTotals: WeekBucket[];
}

/**
 * Pure calendar statistics calculator from sorted daily contribution entries.
 */
export function computeCalendarStats(
  days: ContributionDay[],
  overrideTotal?: number,
): CalendarMetrics {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let computedTotal = 0;
  let activeDays = 0;
  let peakDayCount = 0;
  let bestStreak = 0;
  let running = 0;

  for (const day of sorted) {
    computedTotal += day.count;
    if (day.count > 0) {
      activeDays++;
      running++;
      if (running > bestStreak) bestStreak = running;
      if (day.count > peakDayCount) peakDayCount = day.count;
    } else {
      running = 0;
    }
  }

  let currentStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const day = sorted[i];
    if (!day) continue;
    if (day.count > 0) {
      currentStreak++;
    } else if (i === sorted.length - 1) {
      // Today might not have commits yet; check yesterday before breaking
      continue;
    } else {
      break;
    }
  }

  // Group into 7-day Sunday-aligned (or sequential 7-day) weekly buckets, taking last 36 weeks
  const buckets: WeekBucket[] = [];
  for (let i = 0; i < sorted.length; i += 7) {
    const slice = sorted.slice(i, i + 7);
    const first = slice[0];
    if (!first) continue;
    const sum = slice.reduce((acc, d) => acc + d.count, 0);
    buckets.push({ weekStart: first.date, count: sum });
  }

  return {
    totalContributions: overrideTotal ?? computedTotal,
    activeDays,
    peakDayCount,
    bestStreak,
    currentStreak,
    weeklyTotals: buckets.slice(-36),
  };
}

/**
 * Aggregates language byte totals into top N entries with normalized percentages.
 */
export function aggregateLanguages(
  byteMap: Record<string, number>,
  maxEntries = 5,
): LanguageStat[] {
  const entries = Object.entries(byteMap)
    .filter(([, bytes]) => bytes > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (totalBytes === 0) return [];

  const top = entries.slice(0, maxEntries);
  const remainderBytes = entries
    .slice(maxEntries)
    .reduce((sum, [, bytes]) => sum + bytes, 0);

  const result: LanguageStat[] = top.map(([name, bytes]) => ({
    name,
    bytes,
    percent: Number(((bytes / totalBytes) * 100).toFixed(1)),
  }));

  if (remainderBytes > 0 && result.length === maxEntries) {
    const last = result[result.length - 1];
    if (last && remainderBytes / totalBytes >= 0.01) {
      result[result.length - 1] = {
        name: "Other",
        bytes: last.bytes + remainderBytes,
        percent: Number((((last.bytes + remainderBytes) / totalBytes) * 100).toFixed(1)),
      };
    }
  }

  return result;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate.slice(0, 10);
  return `${MONTHS[d.getUTCMonth()] ?? "Jan"} ${d.getUTCDate()}`;
}

export function formatMonthYear(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate.slice(0, 4);
  return `${MONTHS[d.getUTCMonth()] ?? "Jan"} ${d.getUTCFullYear()}`;
}

export function formatUtcTimestamp(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}

export function computeTenureLabel(createdAt: string, now = new Date()): string {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "5+ yrs";
  const years = Math.max(
    1,
    Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
  );
  return `${years}+ yrs`;
}

interface GraphQLResponse {
  data?: {
    user?: {
      createdAt: string;
      repositories: {
        totalCount: number;
        nodes: Array<{
          name: string;
          isFork: boolean;
          stargazerCount: number;
          pushedAt: string;
          primaryLanguage: { name: string } | null;
          languages: {
            edges: Array<{
              size: number;
              node: { name: string };
            }>;
          };
        }>;
      };
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{
              date: string;
              contributionCount: number;
            }>;
          }>;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

const GRAPHQL_QUERY = `
query ProfileTelemetry($login: String!) {
  user(login: $login) {
    createdAt
    repositories(first: 50, ownerAffiliations: OWNER, isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes {
        name
        isFork
        stargazerCount
        pushedAt
        primaryLanguage { name }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node { name }
          }
        }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
`;

async function fetchViaGraphQL(username: string, token: string): Promise<TelemetryData> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "scar0x00-profile-telemetry",
    },
    body: JSON.stringify({ query: GRAPHQL_QUERY, variables: { login: username } }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GraphQLResponse;
  if (json.errors?.length || !json.data?.user) {
    throw new Error(json.errors?.[0]?.message ?? "Missing user in GraphQL response");
  }

  const user = json.data.user;
  const cal = user.contributionsCollection.contributionCalendar;
  const days: ContributionDay[] = cal.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  );
  const metrics = computeCalendarStats(days, cal.totalContributions);

  const repos = user.repositories.nodes.filter((r) => !r.isFork);
  const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0);
  const latestNode =
    repos.find((r) => r.name.toLowerCase() !== username.toLowerCase()) ?? repos[0];

  const langBytes: Record<string, number> = {};
  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      langBytes[edge.node.name] = (langBytes[edge.node.name] ?? 0) + edge.size;
    }
  }

  return {
    username,
    syncedAt: formatUtcTimestamp(),
    source: "graphql",
    ...metrics,
    publicRepos: user.repositories.totalCount,
    totalStars,
    createdAt: user.createdAt,
    latestRepo: latestNode
      ? {
          name: latestNode.name,
          language: latestNode.primaryLanguage?.name ?? "TypeScript",
          updatedAt: latestNode.pushedAt,
        }
      : { name: "remain-monorepo", language: "TypeScript", updatedAt: new Date().toISOString() },
    languages: aggregateLanguages(langBytes, 5),
  };
}

/**
 * Parses GitHub's public contributions HTML page for unauthenticated local builds.
 */
function parsePublicContributionsHtml(html: string): {
  days: ContributionDay[];
  totalHeader?: number;
} {
  const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/i);
  const totalHeader = totalMatch?.[1]
    ? Number(totalMatch[1].replaceAll(",", ""))
    : undefined;

  // Map cell id -> exact count from tooltip text when available
  const tooltipCounts = new Map<string, number>();
  for (const m of html.matchAll(
    /<tool-tip[^>]*for="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/tool-tip>/g,
  )) {
    const id = m[1];
    const text = m[2];
    if (!id || !text) continue;
    if (text.startsWith("No")) {
      tooltipCounts.set(id, 0);
    } else {
      const n = text.match(/^([\d,]+)\s+contribution/i);
      if (n?.[1]) tooltipCounts.set(id, Number(n[1].replaceAll(",", "")));
    }
  }

  const levelFallback = [0, 2, 5, 10, 18];
  const days: ContributionDay[] = [];
  for (const m of html.matchAll(/<td\b([^>]*data-date="\d{4}-\d{2}-\d{2}"[^>]*)>/g)) {
    const attrs = m[1] ?? "";
    const date = attrs.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const level = Number(attrs.match(/data-level="(\d)"/)?.[1] ?? "0");
    const id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (!date) continue;
    const count =
      (id ? tooltipCounts.get(id) : undefined) ?? levelFallback[level] ?? 0;
    days.push({ date, count });
  }

  return { days, totalHeader };
}

async function fetchViaPublicApi(username: string): Promise<TelemetryData> {
  const headers = { "User-Agent": "scar0x00-profile-telemetry" };

  const [userRes, reposRes, contribRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=30`, {
      headers,
    }),
    fetch(`https://github.com/users/${username}/contributions`, { headers }),
  ]);

  if (!userRes.ok || !reposRes.ok) {
    throw new Error(`GitHub public API error: user=${userRes.status}, repos=${reposRes.status}`);
  }

  const user = (await userRes.json()) as {
    public_repos: number;
    created_at: string;
  };
  const repos = (
    (await reposRes.json()) as Array<{
      name: string;
      fork: boolean;
      stargazers_count: number;
      pushed_at: string;
      language: string | null;
      languages_url: string;
    }>
  ).filter((r) => !r.fork);

  const langResponses = await Promise.all(
    repos.slice(0, 12).map(async (repo) => {
      const r = await fetch(repo.languages_url, { headers });
      if (!r.ok) return {} as Record<string, number>;
      return (await r.json()) as Record<string, number>;
    }),
  );

  const langBytes: Record<string, number> = {};
  for (const map of langResponses) {
    for (const [lang, bytes] of Object.entries(map)) {
      langBytes[lang] = (langBytes[lang] ?? 0) + bytes;
    }
  }

  const contribHtml = contribRes.ok ? await contribRes.text() : "";
  const { days, totalHeader } = parsePublicContributionsHtml(contribHtml);
  const metrics = computeCalendarStats(days, totalHeader);

  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const latestNode =
    repos.find((r) => r.name.toLowerCase() !== username.toLowerCase()) ?? repos[0];

  return {
    username,
    syncedAt: formatUtcTimestamp(),
    source: "public",
    ...metrics,
    publicRepos: user.public_repos,
    totalStars,
    createdAt: user.created_at,
    latestRepo: latestNode
      ? {
          name: latestNode.name,
          language: latestNode.language ?? "TypeScript",
          updatedAt: latestNode.pushed_at,
        }
      : { name: "remain-monorepo", language: "TypeScript", updatedAt: new Date().toISOString() },
    languages: aggregateLanguages(langBytes, 5),
  };
}

export async function fetchGitHubTelemetry(
  username: string,
  token?: string,
): Promise<TelemetryData> {
  if (token) {
    try {
      return await fetchViaGraphQL(username, token);
    } catch (err) {
      console.warn("GraphQL fetch failed, falling back to public GitHub endpoints:", err);
    }
  }
  return fetchViaPublicApi(username);
}
