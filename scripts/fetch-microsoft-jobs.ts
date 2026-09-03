/*
 * Fetches Microsoft's defense slice from its Eightfold careers backend
 * (apply.careers.microsoft.com) and writes a CSV in the shape
 * import-defense-job-listings.ts expects, plus two trailing audit columns
 * DefenseRelevance,DefenseSignal (the importer reads by column name and ignores
 * extras until the persistence wiring lands).
 *
 * Microsoft is COMMERCIAL / dual-use (counts_as_defense: false, #336). Same
 * Eightfold family as Lockheed/Northrop, but its search rows are lightweight (no
 * JD), so unlike those pure-play list-level pulls this one fetches each
 * candidate's job description to classify it. Two gates:
 *   Gate 1 (source narrowing): /api/pcsx/search?domain=microsoft.com&query=<term>
 *     per defense term, unioned by position id. NOTE: Eightfold OR-matches
 *     multi-word queries ("national security" -> 1,782, basically "security"),
 *     and single tokens like "govcloud"/"azure" explode on "cloud"/"azure" — so
 *     only precise, non-exploding terms are used; the loose gov terms are still
 *     reached via "federal"/"public sector". Use /api/pcsx/search, NOT
 *     /api/apply/v2/jobs (that 403s "Not authorized for PCSX").
 *   Gate 2 (authority): classifyDefenseRelevance() on the JD, extracted from the
 *     JSON-LD JobPosting embedded in the position page (the apply/v2 detail API is
 *     blocked and pcsx has no detail endpoint).
 * US-only by default (list `locations` begins "United States"; --include-international
 * to keep the rest) — the US filter runs BEFORE the JD fetch to avoid pulling the
 * ~700KB page for non-US roles. Pay/education left blank.
 *
 * Eightfold rate-limits (429) and 403s bursts, so this paces requests and backs
 * off; never run two Eightfold pulls at once. A full pull is slow — background it.
 * Standalone fetcher; folds into the `eightfold` adapter of the unified sync
 * (#313 Phase 3) later. No DB access. Re-runnable; overwrites the dated CSV.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-microsoft-jobs.ts [--out <path>] [--max N] [--dry-run] [--include-international]
 */
import { writeFileSync } from "node:fs";
import { resolveStateAbbr } from "../lib/states";
import { classifyDefenseRelevance } from "../lib/defense-jobs-slice";

const HOST = "apply.careers.microsoft.com";
const DOMAIN = "microsoft.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

/*
 * Gate-1 query terms — precise / non-exploding only (see header). "sci" and
 * "secret" are omitted: they OR-match "science"/"scientist" and non-clearance
 * "secret", ballooning JD fetches; genuine TS/SCI roles are reached via
 * "clearance". "govcloud"/"azure government"/"national security" explode and are
 * covered by "federal"/"public sector".
 */
const SLICE_QUERIES = ["clearance", "security clearance", "polygraph", "federal", "public sector", "dod", "fedramp"];

interface Position {
  id: number;
  name: string;
  locations?: string[] | null;
  standardizedLocations?: string[] | null;
  department?: string | null;
  positionUrl?: string | null;
}

const q = (v: unknown): string => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const searchHeaders = {
  Accept: "application/json",
  "User-Agent": UA,
  "X-Requested-With": "XMLHttpRequest",
  "Accept-Encoding": "gzip, deflate",
  Referer: `https://${HOST}/careers`,
};

function stripHtml(html: string): string {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

/** "United States, Washington, Redmond" -> {location:"Redmond, WA", region}. */
function locate(raw: string | undefined): { location: string; region: string; isUS: boolean } {
  const s = (raw ?? "").trim();
  if (!/^United States/i.test(s)) return { location: s, region: "International", isUS: false };
  const parts = s.split(",").map((p) => p.trim());
  // [country, state, city] typically; [country, "Remote"] sometimes.
  if (parts.length >= 3) {
    const abbr = resolveStateAbbr(parts[1]) ?? parts[1];
    return { location: `${parts[2]}, ${abbr}`, region: /remote/i.test(s) ? "US/Remote" : "US (CONUS)", isUS: true };
  }
  return { location: parts.slice(1).join(", ") || "United States", region: "US/Remote", isUS: true };
}

/** GET with retry/back-off on Eightfold 429/403. Returns null after exhausting retries. */
async function getWithBackoff(url: string, kind: "json" | "text"): Promise<unknown | string | null> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: searchHeaders });
    if (res.status === 429 || res.status === 403) {
      await sleep(3000 * (attempt + 1)); // 3,6,9,12,15s
      continue;
    }
    if (!res.ok) return null;
    return kind === "json" ? await res.json() : await res.text();
  }
  return null;
}

async function searchPage(query: string, start: number): Promise<{ positions: Position[]; count: number } | null> {
  const url = `https://${HOST}/api/pcsx/search?domain=${DOMAIN}&query=${encodeURIComponent(query)}&start=${start}&num=50&sort_by=relevance`;
  const json = (await getWithBackoff(url, "json")) as { data?: { positions?: Position[]; count?: number } } | null;
  if (!json) return null;
  return { positions: json.data?.positions ?? [], count: json.data?.count ?? 0 };
}

/** Gate 1: union of candidates across the defense query terms. */
async function gather(): Promise<Map<number, Position>> {
  const byId = new Map<number, Position>();
  for (const term of SLICE_QUERIES) {
    let start = 0;
    for (;;) {
      const page = await searchPage(term, start);
      if (!page || page.positions.length === 0) break;
      for (const p of page.positions) byId.set(p.id, p);
      start += page.positions.length;
      await sleep(250);
      if (start >= page.count) break;
    }
    console.log(`  Gate 1  "${term}": union now ${byId.size}`);
  }
  return byId;
}

/** Pull the JD out of the JSON-LD JobPosting embedded in a position page. */
function extractJobPosting(html: string): { title?: string; description: string } | null {
  const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const j = JSON.parse(m[1]) as { "@type"?: string; title?: string; description?: string };
      if (j["@type"] === "JobPosting") return { title: j.title, description: stripHtml(j.description ?? "") };
    } catch {
      /* not the block we want */
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const today = new Date().toISOString().slice(0, 10);
  const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : `data/microsoft_eightfold_${today}.csv`;
  const max = args.includes("--max") ? Number(args[args.indexOf("--max") + 1]) : Infinity;
  const dryRun = args.includes("--dry-run");
  const usOnly = !args.includes("--include-international");

  console.log("Microsoft / Eightfold (pcsx) — defense slice (#336)\n");
  const all = [...(await gather()).values()];
  // US pre-filter BEFORE the expensive JD page fetch.
  const candidates = all
    .map((p) => ({ p, loc: locate((p.locations ?? p.standardizedLocations ?? [])[0]) }))
    .filter(({ loc }) => !usOnly || loc.isUS)
    .slice(0, max);
  const preIntl = all.length - all.filter((p) => locate((p.locations ?? p.standardizedLocations ?? [])[0]).isUS).length;
  console.log(`\nGate 1 union: ${all.length}${usOnly ? ` (${preIntl} non-US pre-filtered)` : ""}. Fetching JDs for ${candidates.length}…\n`);

  const header = [
    "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
    "DefenseRelevance", "DefenseSignal",
  ];
  const lines = [header.map(q).join(",")];
  const relevanceCounts: Record<string, number> = {};
  let dropped = 0, missing = 0;

  for (const { p, loc } of candidates) {
    const html = (await getWithBackoff(`https://${HOST}/careers/job/${p.id}`, "text")) as string | null;
    await sleep(400);
    if (!html) { missing++; continue; }
    const jd = extractJobPosting(html);
    if (!jd) { missing++; continue; }

    const verdict = classifyDefenseRelevance(
      { title: p.name ?? jd.title, description: jd.description, businessUnit: p.department ?? "" },
      { countsAsDefense: false },
    );
    if (verdict.relevance === null) { dropped++; continue; }
    relevanceCounts[verdict.relevance] = (relevanceCounts[verdict.relevance] ?? 0) + 1;

    const row = [
      "Microsoft", "Eightfold", p.name ?? jd.title ?? "", p.department ?? "", "",
      loc.location, loc.region, "Full-time", "", "", "", "",
      `https://${HOST}/careers/job/${p.id}`, verdict.relevance, verdict.signal ?? "",
    ];
    lines.push(row.map(q).join(","));
  }

  const kept = lines.length - 1;
  if (dryRun) console.log(`(dry run) would write ${kept} listing(s) to ${outPath}`);
  else { writeFileSync(outPath, lines.join("\n") + "\n", "utf-8"); console.log(`Wrote ${kept} listing(s) to ${outPath}`); }
  console.log(`By relevance:`);
  for (const [k, v] of Object.entries(relevanceCounts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log(`  dropped by Gate 2: ${dropped}${missing ? ` | JD unavailable: ${missing}` : ""}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
