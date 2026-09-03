/*
 * Fetches the AWS defense slice from amazon.jobs and writes a CSV in the shape
 * import-defense-job-listings.ts expects, plus two trailing audit columns
 * DefenseRelevance,DefenseSignal (the importer reads by column name and ignores
 * extras until the persistence wiring lands).
 *
 * Amazon is a COMMERCIAL / dual-use employer (counts_as_defense: false, #336).
 * We scope to the Amazon Web Services (AWS) business category — Amazon's
 * defense/GovCloud arm — and ingest only the defense slice, via two gates:
 *   Gate 1 (source narrowing): amazon.jobs `search.json` with a defense
 *     `base_query` per term (clearance, GovCloud, public sector, DoD, …), unioned
 *     by id_icims. base_query is a loose relevance search, so it is a recall aid.
 *   Gate 2 (authority): classifyDefenseRelevance() on the row's own text —
 *     amazon.jobs returns the full description + basic/preferred qualifications in
 *     the LIST payload, so (unlike Cisco/Oracle) NO per-job detail fetch is
 *     needed.
 * Only admitted rows are written. US-only by default (country_code === "USA";
 * --include-international to keep the rest). Pay/education left blank.
 *
 * Standalone fetcher; folds into the `amazon_jobs` adapter of the unified sync
 * (#313 Phase 3) later. No DB access. Re-runnable; overwrites the dated CSV.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-amazon-jobs.ts [--out <path>] [--max N] [--dry-run] [--include-international]
 */
import { writeFileSync } from "node:fs";
import { classifyDefenseRelevance } from "../lib/defense-jobs-slice";

const COMPANY = "Amazon Web Services (AWS)";
const BUSINESS_CATEGORY = "amazon-web-services";
const BASE = "https://www.amazon.jobs/en/search.json";
const PAGE = 100; // amazon.jobs result_limit
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";

/*
 * Gate-1 defense-slice base_query terms (issue #336). Broad for recall; Gate 2 is
 * precision. Bare "federal" is intentionally omitted — it returns ~1,455 mostly
 * loose hits, and the real AWS federal roles are already reached via "public
 * sector" / "GovCloud" / "national security".
 */
const SLICE_QUERIES = [
  "security clearance",
  "TS/SCI",
  "top secret",
  "DoD",
  "GovCloud",
  "national security",
  "public sector",
  "fedramp",
  "intelligence community",
  "warfighter",
];

interface AmazonJob {
  id_icims: string;
  title: string;
  city?: string | null;
  state?: string | null;
  country_code?: string | null;
  normalized_location?: string | null;
  job_path: string;
  business_category?: string | null;
  job_family?: string | null;
  is_intern?: boolean;
  description?: string | null;
  basic_qualifications?: string | null;
  preferred_qualifications?: string | null;
  team?: { label?: string | null } | null;
}

const q = (v: unknown): string => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripHtml(html: string | null | undefined): string {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

async function fetchPage(baseQuery: string, offset: number): Promise<{ jobs: AmazonJob[]; hits: number }> {
  const url =
    `${BASE}?business_category%5B%5D=${BUSINESS_CATEGORY}&result_limit=${PAGE}&offset=${offset}` +
    `&sort=relevant&base_query=${encodeURIComponent(baseQuery)}`;
  // NOTE: force gzip/deflate. Node's fetch defaults to `Accept-Encoding: br`,
  // and amazon.jobs' brotli response truncates under undici at 1024 bytes
  // (a valid-looking HTTP 200 with an unterminated JSON body).
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA, "Accept-Encoding": "gzip, deflate" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} q="${baseQuery}" offset=${offset}`);
  const json = (await res.json()) as { jobs?: AmazonJob[]; hits?: number };
  return { jobs: json.jobs ?? [], hits: json.hits ?? 0 };
}

/** Gate 1: union of AWS candidates across the defense base_query terms. */
async function gather(): Promise<Map<string, AmazonJob>> {
  const byId = new Map<string, AmazonJob>();
  for (const term of SLICE_QUERIES) {
    const first = await fetchPage(term, 0);
    for (const j of first.jobs) byId.set(j.id_icims, j);
    for (let offset = PAGE; offset < first.hits; offset += PAGE) {
      let page: Awaited<ReturnType<typeof fetchPage>> | null = null;
      for (let attempt = 0; attempt < 5 && !page; attempt++) {
        try {
          page = await fetchPage(term, offset);
        } catch (err) {
          if (attempt === 4) throw err;
          await sleep(1500 * (attempt + 1));
        }
      }
      if (!page || page.jobs.length === 0) break;
      for (const j of page.jobs) byId.set(j.id_icims, j);
      await sleep(150);
    }
    console.log(`  Gate 1  "${term}": ${first.hits} hit(s), union now ${byId.size}`);
  }
  return byId;
}

async function main() {
  const args = process.argv.slice(2);
  const today = new Date().toISOString().slice(0, 10);
  const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : `data/aws_amazon-jobs_${today}.csv`;
  const max = args.includes("--max") ? Number(args[args.indexOf("--max") + 1]) : Infinity;
  const dryRun = args.includes("--dry-run");
  const usOnly = !args.includes("--include-international");

  console.log("Amazon Web Services / amazon.jobs — defense slice (#336)\n");
  const candidates = [...(await gather()).values()].slice(0, max);
  console.log(`\nGate 1 candidates: ${candidates.length}. Classifying (list text, no detail fetch)…\n`);

  const header = [
    "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
    "DefenseRelevance", "DefenseSignal",
  ];
  const lines = [header.map(q).join(",")];
  const relevanceCounts: Record<string, number> = {};
  let dropped = 0, intl = 0;

  for (const j of candidates) {
    const verdict = classifyDefenseRelevance(
      {
        title: j.title,
        description: stripHtml(j.description),
        qualifications: `${stripHtml(j.basic_qualifications)} ${stripHtml(j.preferred_qualifications)}`,
        businessUnit: [j.business_category, j.team?.label, j.job_family].filter(Boolean).join(" "),
      },
      { countsAsDefense: false },
    );
    if (verdict.relevance === null) { dropped++; continue; }

    const isUS = (j.country_code ?? "").toUpperCase() === "USA";
    if (usOnly && !isUS) { intl++; continue; }
    relevanceCounts[verdict.relevance] = (relevanceCounts[verdict.relevance] ?? 0) + 1;

    const location = isUS && j.city && j.state ? `${j.city}, ${j.state}` : (j.normalized_location ?? "");
    const region = isUS ? "US (CONUS)" : "International";
    const row = [
      COMPANY, "Amazon Jobs", j.title ?? "", j.team?.label ?? j.job_family ?? "", "",
      location, region, j.is_intern ? "Internship" : "Full-time", "", "", "", "",
      `https://www.amazon.jobs${j.job_path}`, verdict.relevance, verdict.signal ?? "",
    ];
    lines.push(row.map(q).join(","));
  }

  const kept = lines.length - 1;
  if (dryRun) console.log(`(dry run) would write ${kept} listing(s) to ${outPath}`);
  else { writeFileSync(outPath, lines.join("\n") + "\n", "utf-8"); console.log(`Wrote ${kept} listing(s) to ${outPath}`); }
  console.log(`By relevance:`);
  for (const [k, v] of Object.entries(relevanceCounts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log(`  dropped by Gate 2: ${dropped}` + (usOnly ? ` | non-US skipped: ${intl}` : ""));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
