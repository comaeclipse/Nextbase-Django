/*
 * Fetches Cisco's defense slice from its Workday careers backend and writes a CSV
 * in the shape import-defense-job-listings.ts expects:
 *   Company,ATS,Title,Field,Team,Location,Region,Employment,PayMin,PayMax,PayInterval,Education,URL
 * plus two trailing columns, DefenseRelevance,DefenseSignal, carrying the #336
 * slice verdict for audit (the importer reads by column name and ignores extras
 * until the persistence wiring lands).
 *
 * Cisco's careers.cisco.com is a Phenom front-end over a Workday system of record
 * (cisco.wd5.myworkdayjobs.com). We pull the Workday CXS JSON API, not Phenom.
 *
 * Cisco is a COMMERCIAL / dual-use employer (counts_as_defense: false, issue
 * #336): it posts ~1,282 roles, so we ingest only the defense slice, in two gates:
 *   Gate 1 (source narrowing): POST /jobs with each defense `searchText` term and
 *     union the hits by externalPath — this alone cuts ~1,282 to a few hundred.
 *   Gate 2 (authority): classifyDefenseRelevance() on each candidate's full JD
 *     (from the CXS detail endpoint) decides cleared / gov_customer / drop, so a
 *     Gate-1 false positive (e.g. a "Federal Reserve" client mention) is dropped.
 * Only admitted rows are written. Pay/education are left blank (list/detail JSON
 * carries no structured comp; a US-role pay range lives only in JD prose).
 *
 * This is the standalone Workday fetcher; it folds into the `workday` adapter of
 * the unified sync (#313 Phase 3) later. No DB access. Re-runnable; overwrites
 * the dated CSV.
 *
 * Usage:
 * US-only by default: the #336 slice is about US clearance / US-government
 * customers, so non-US roles (e.g. a UK "security clearance" role serving the
 * MoD) are dropped. Pass --include-international to keep them.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-cisco-jobs.ts [--out <path>] [--max N] [--dry-run] [--include-international]
 */
import { writeFileSync } from "node:fs";
import { resolveStateAbbr } from "../lib/states";
import { classifyDefenseRelevance } from "../lib/defense-jobs-slice";

const HOST = "cisco.wd5.myworkdayjobs.com";
const TENANT = "cisco";
const SITE = "Cisco_Careers";
const CXS = `https://${HOST}/wday/cxs/${TENANT}/${SITE}`;
const LIST_PAGE = 20;

/*
 * Gate-1 defense-slice queries (issue #336). Workday `searchText` matches title +
 * description server-side, so each term gathers candidates whose JD mentions it;
 * the union is the candidate pool. Deliberately broad for recall — Gate 2 is the
 * precision filter. (This is the seed's `ats_config.defense_slice` in prose.)
 */
const SLICE_QUERIES = [
  "clearance",
  "security clearance",
  "federal",
  "defense",
  "public sector",
  "national security",
  "government",
  "govcloud",
  "intelligence community",
  "dod",
  "warfighter",
  "fedramp",
];

/** USPS codes that are US soil but outside the contiguous 48 + DC. */
const NON_CONUS = new Set(["AK", "HI", "PR", "GU", "VI", "MP", "AS"]);

interface ListRow {
  title: string;
  externalPath: string;
  locationsText?: string;
  bulletFields?: string[];
}

interface Detail {
  title: string;
  jobDescription: string;
  location: string;
  additionalLocations?: string[];
  externalUrl: string;
  jobReqId?: string;
  timeType?: string;
  remoteType?: string;
}

const q = (v: unknown): string =>
  '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";

/** Strip HTML to plain text for keyword classification. */
function stripHtml(html: string): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map a Workday "City, State, US" (state may be a full name) to CSV Location + Region. */
function locate(raw: string, remote: boolean): { location: string; region: string } {
  const s = (raw ?? "").trim();
  const m = s.match(/^(.*),\s*([^,]+),\s*(US|United States)$/i);
  if (m) {
    const city = m[1].trim();
    const abbr = resolveStateAbbr(m[2].trim()) ?? m[2].trim();
    const region = remote
      ? "US/Remote"
      : NON_CONUS.has(abbr)
        ? "US (non-CONUS)"
        : "US (CONUS)";
    return { location: `${city}, ${abbr}`, region };
  }
  if (/,\s*(US|United States)$/i.test(s)) {
    return { location: s.replace(/,\s*(US|United States)$/i, "").trim(), region: remote ? "US/Remote" : "US (CONUS)" };
  }
  return { location: s, region: "International" };
}

async function postList(searchText: string, offset: number): Promise<{ rows: ListRow[]; total: number }> {
  const res = await fetch(`${CXS}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": UA },
    body: JSON.stringify({ limit: LIST_PAGE, offset, searchText, appliedFacets: {} }),
  });
  if (!res.ok) throw new Error(`list HTTP ${res.status} q="${searchText}" offset=${offset}`);
  const json = (await res.json()) as { jobPostings?: ListRow[]; total?: number };
  return { rows: json.jobPostings ?? [], total: json.total ?? 0 };
}

async function getDetail(externalPath: string): Promise<Detail | null> {
  const res = await fetch(`${CXS}${externalPath}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return null; // a pulled-since req: skip, don't abort the run
  const json = (await res.json()) as { jobPostingInfo?: Detail };
  return json.jobPostingInfo ?? null;
}

/** Gate 1: union of candidate externalPaths across the slice queries. */
async function gatherCandidates(): Promise<Map<string, ListRow>> {
  const byPath = new Map<string, ListRow>();
  for (const query of SLICE_QUERIES) {
    const first = await postList(query, 0);
    for (const r of first.rows) byPath.set(r.externalPath, r);
    for (let offset = LIST_PAGE; offset < first.total; offset += LIST_PAGE) {
      let page: Awaited<ReturnType<typeof postList>> | null = null;
      for (let attempt = 0; attempt < 5 && !page; attempt++) {
        try {
          page = await postList(query, offset);
        } catch (err) {
          if (attempt === 4) throw err;
          await sleep(1500 * (attempt + 1));
        }
      }
      if (!page || page.rows.length === 0) break;
      for (const r of page.rows) byPath.set(r.externalPath, r);
      await sleep(120);
    }
    console.log(`  Gate 1  "${query}": ${first.total} hit(s), union now ${byPath.size}`);
  }
  return byPath;
}

async function main() {
  const args = process.argv.slice(2);
  const today = new Date().toISOString().slice(0, 10);
  const outPath =
    args.includes("--out") && args[args.indexOf("--out") + 1]
      ? args[args.indexOf("--out") + 1]
      : `data/cisco_workday_${today}.csv`;
  const max = args.includes("--max") ? Number(args[args.indexOf("--max") + 1]) : Infinity;
  const dryRun = args.includes("--dry-run");
  const usOnly = !args.includes("--include-international");

  console.log("Cisco / Workday CXS — defense slice (#336)\n");
  const candidates = [...(await gatherCandidates()).values()].slice(0, max);
  console.log(`\nGate 1 candidates: ${candidates.length}. Classifying via detail JDs…\n`);

  const header = [
    "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
    "DefenseRelevance", "DefenseSignal",
  ];
  const lines = [header.map(q).join(",")];
  const relevanceCounts: Record<string, number> = {};
  let dropped = 0;
  let missing = 0;
  let intl = 0;

  for (const c of candidates) {
    let detail: Detail | null = null;
    for (let attempt = 0; attempt < 4 && !detail; attempt++) {
      try {
        detail = await getDetail(c.externalPath);
        break; // a null from getDetail (404) is a real "gone", not a retry
      } catch {
        if (attempt === 3) { detail = null; break; }
        await sleep(1500 * (attempt + 1));
      }
    }
    await sleep(100);
    if (!detail) { missing++; continue; }

    const jd = stripHtml(detail.jobDescription ?? "");
    const verdict = classifyDefenseRelevance({ title: detail.title, description: jd }, { countsAsDefense: false });
    if (verdict.relevance === null) { dropped++; continue; }

    const remote = /remote/i.test(detail.remoteType ?? "");
    const { location, region } = locate(detail.location ?? "", remote);
    if (usOnly && !region.startsWith("US")) { intl++; continue; }
    relevanceCounts[verdict.relevance] = (relevanceCounts[verdict.relevance] ?? 0) + 1;
    const employment = /full/i.test(detail.timeType ?? "") ? "Full-time" : (detail.timeType ?? "");
    const row = [
      "Cisco", "Workday", detail.title ?? c.title, "", "", location, region,
      employment, "", "", "", "",
      detail.externalUrl ?? `https://${HOST}/${SITE}${c.externalPath}`,
      verdict.relevance, verdict.signal ?? "",
    ];
    lines.push(row.map(q).join(","));
  }

  const kept = lines.length - 1;
  if (dryRun) {
    console.log(`(dry run) would write ${kept} listing(s) to ${outPath}`);
  } else {
    writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
    console.log(`Wrote ${kept} listing(s) to ${outPath}`);
  }
  console.log(`\nBy relevance:`);
  for (const [k, v] of Object.entries(relevanceCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
  console.log(
    `  dropped by Gate 2: ${dropped}` +
      (usOnly ? ` | non-US skipped: ${intl}` : "") +
      (missing ? ` | detail unavailable: ${missing}` : ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
