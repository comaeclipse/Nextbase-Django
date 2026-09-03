/*
 * Fetches the defense slice from an Oracle Cloud Recruiting (Fusion "CX" / ORC)
 * careers site and writes a CSV in the shape import-defense-job-listings.ts
 * expects, plus two trailing audit columns DefenseRelevance,DefenseSignal (the
 * importer reads by column name and ignores extras until the persistence wiring
 * lands).
 *
 * ONE adapter, TWO employers on the same platform (different tenant host + site):
 *   Oracle  -> eeho.fa.us2.oraclecloud.com, siteNumber CX_45001, site "jobsearch"
 *   Dell    -> enterpriseplatform.dell.com, siteNumber CX_1001,  site "careers"
 * NOTE: an unrecognized siteNumber silently returns a small default set (Oracle
 * CX_1, Dell CX_1..CX_6 all gave the fallback), so the real siteNumber is read
 * from each site's own page — do not guess CX_1.
 *
 * Oracle and Dell are COMMERCIAL / dual-use (counts_as_defense: false, #336), so
 * we ingest only the defense slice via the two gates:
 *   Gate 1 (source narrowing): the ORC `findReqs` finder with a `keyword` per
 *     defense term (clearance, federal, defense, national security, public
 *     sector, …), unioned by requisition Id. Oracle's keyword search is loose (a
 *     trainee role matched "clearance"), so it is only a recall aid.
 *   Gate 2 (authority): classifyDefenseRelevance() on each candidate's FULL text
 *     (the list rows carry only ShortDescriptionStr; the quals/responsibilities
 *     are NULL there, so we fetch the requisition detail) decides cleared /
 *     gov_customer / drop.
 * Only admitted rows are written. US-only by default (--include-international).
 * Pay/education left blank (no structured comp in the JSON).
 *
 * Standalone fetcher; folds into the `oracle_orc` adapter of the unified sync
 * (#313 Phase 3) later. No DB access. Re-runnable; overwrites the dated CSV.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-oracle-orc-jobs.ts [--employer oracle|dell|all] [--out <path>] [--max N] [--dry-run] [--include-international]
 */
import { writeFileSync } from "node:fs";
import { resolveStateAbbr } from "../lib/states";
import { classifyDefenseRelevance } from "../lib/defense-jobs-slice";

interface Employer {
  key: string;
  company: string;
  host: string;
  siteNumber: string;
  sitePath: string; // the /sites/<sitePath>/ segment of the candidate-experience apply URL
}

const EMPLOYERS: Employer[] = [
  { key: "oracle", company: "Oracle", host: "eeho.fa.us2.oraclecloud.com", siteNumber: "CX_45001", sitePath: "jobsearch" },
  { key: "dell", company: "Dell Technologies", host: "enterpriseplatform.dell.com", siteNumber: "CX_1001", sitePath: "careers" },
];

/** Gate-1 defense-slice keywords (issue #336). Broad for recall; Gate 2 is precision. */
const SLICE_QUERIES = [
  "clearance",
  "security clearance",
  "defense",
  "federal",
  "national security",
  "public sector",
  "govcloud",
  "dod",
  "fedramp",
  "intelligence community",
];

const LIST_LIMIT = 200; // ORC caps a page around here; paginate by offset if needed.
const NON_CONUS = new Set(["AK", "HI", "PR", "GU", "VI", "MP", "AS"]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";

interface ListReq {
  Id: number;
  Title: string;
  PrimaryLocation?: string;
  JobFamily?: string | null;
  Department?: string | null;
  Organization?: string | null;
  ShortDescriptionStr?: string | null;
}

interface DetailReq {
  Title?: string;
  ExternalDescriptionStr?: string | null;
  ExternalQualificationsStr?: string | null;
  ExternalResponsibilitiesStr?: string | null;
  Department?: string | null;
  Organization?: string | null;
}

const q = (v: unknown): string => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripHtml(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * Oracle appends boilerplate that trips the clearance signal on non-defense
 * roles, so remove it BEFORE classifying:
 *  - Oracle Health (Cerner) facility-access clause: many clinical / customer
 *    roles say "…obtain the appropriate government security clearance…". That is
 *    a hospital-site access requirement, not a defense personnel clearance, so a
 *    real defense role still has to carry TS/SCI / Secret / DoD / a gov-org
 *    signal to survive.
 *  - Oracle's US export-control / clearance legal disclaimer.
 * Anything genuinely cleared (TS/SCI, Secret, active/obtain-a-Secret, polygraph)
 * or gov_customer is unaffected.
 */
function stripBoilerplate(text: string): string {
  return text
    .replace(/[^.]*\bgovernment security clearance\b[^.]*\.?/gi, " ")
    .replace(/certain (?:u\.?s\.?|united states)[^.]*?(?:export control|security clearance)[^.]*?\.?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "City, ST, United States" (or a bare country) -> CSV Location + Region. */
function locate(raw: string | undefined): { location: string; region: string } {
  const s = (raw ?? "").trim();
  const m = s.match(/^(.*),\s*([^,]+),\s*(United States|US)$/i);
  if (m) {
    const city = m[1].trim();
    const abbr = resolveStateAbbr(m[2].trim()) ?? m[2].trim();
    return {
      location: `${city}, ${abbr}`,
      region: NON_CONUS.has(abbr) ? "US (non-CONUS)" : "US (CONUS)",
    };
  }
  if (/(United States|US)$/i.test(s)) return { location: s.replace(/,?\s*(United States|US)$/i, "").trim(), region: "US (CONUS)" };
  return { location: s, region: "International" };
}

async function listPage(emp: Employer, keyword: string, offset: number): Promise<{ rows: ListReq[]; total: number }> {
  const finder =
    `findReqs;siteNumber=${emp.siteNumber},keyword=${encodeURIComponent(keyword)}` +
    `,limit=${LIST_LIMIT},offset=${offset},sortBy=POSTING_DATES_DESC`;
  const url =
    `https://${emp.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions` +
    `?onlyData=true&expand=requisitionList.secondaryLocations&finder=${finder}`;
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  if (!res.ok) throw new Error(`list HTTP ${res.status} ${emp.key} kw="${keyword}" off=${offset}`);
  const json = (await res.json()) as { items?: { TotalJobsCount?: number; requisitionList?: ListReq[] }[] };
  const it = json.items?.[0];
  return { rows: it?.requisitionList ?? [], total: it?.TotalJobsCount ?? 0 };
}

async function detail(emp: Employer, id: number): Promise<DetailReq | null> {
  const url = `https://${emp.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails/${id}?expand=all&onlyData=true`;
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  if (!res.ok) return null;
  return (await res.json()) as DetailReq;
}

/** Gate 1: union of candidate requisitions across the slice keywords. */
async function gather(emp: Employer): Promise<Map<number, ListReq>> {
  const byId = new Map<number, ListReq>();
  for (const kw of SLICE_QUERIES) {
    const first = await listPage(emp, kw, 0);
    for (const r of first.rows) byId.set(r.Id, r);
    for (let off = LIST_LIMIT; off < first.total; off += LIST_LIMIT) {
      let page: Awaited<ReturnType<typeof listPage>> | null = null;
      for (let attempt = 0; attempt < 5 && !page; attempt++) {
        try {
          page = await listPage(emp, kw, off);
        } catch (err) {
          if (attempt === 4) throw err;
          await sleep(1500 * (attempt + 1));
        }
      }
      if (!page || page.rows.length === 0) break;
      for (const r of page.rows) byId.set(r.Id, r);
      await sleep(120);
    }
    console.log(`  Gate 1  "${kw}": ${first.total} hit(s), union now ${byId.size}`);
  }
  return byId;
}

async function run(emp: Employer, opts: { max: number; dryRun: boolean; usOnly: boolean; out?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const outPath = opts.out ?? `data/${emp.key}_oracle-orc_${today}.csv`;
  console.log(`\n=== ${emp.company} / Oracle Cloud Recruiting — defense slice (#336) ===`);

  const candidates = [...(await gather(emp)).values()].slice(0, opts.max);
  console.log(`\nGate 1 candidates: ${candidates.length}. Classifying via requisition details…\n`);

  const header = [
    "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
    "DefenseRelevance", "DefenseSignal",
  ];
  const lines = [header.map(q).join(",")];
  const relevanceCounts: Record<string, number> = {};
  let dropped = 0, intl = 0, missing = 0;

  for (const c of candidates) {
    const d = await detail(emp, c.Id);
    await sleep(90);
    if (!d) { missing++; continue; }
    const fullText = stripBoilerplate(
      [d.ExternalDescriptionStr, d.ExternalQualificationsStr, d.ExternalResponsibilitiesStr].map(stripHtml).join(" "),
    );
    const businessUnit = [c.JobFamily, c.Department ?? d.Department, c.Organization ?? d.Organization]
      .filter(Boolean).join(" ");
    const verdict = classifyDefenseRelevance(
      { title: c.Title, description: fullText, businessUnit },
      { countsAsDefense: false },
    );
    if (verdict.relevance === null) { dropped++; continue; }

    const { location, region } = locate(c.PrimaryLocation);
    if (opts.usOnly && !region.startsWith("US")) { intl++; continue; }
    relevanceCounts[verdict.relevance] = (relevanceCounts[verdict.relevance] ?? 0) + 1;

    const url = `https://${emp.host}/hcmUI/CandidateExperience/en/sites/${emp.sitePath}/job/${c.Id}`;
    const row = [
      emp.company, "Oracle Recruiting", c.Title ?? d.Title ?? "", c.JobFamily ?? "", "",
      location, region, "", "", "", "", "", url, verdict.relevance, verdict.signal ?? "",
    ];
    lines.push(row.map(q).join(","));
  }

  const kept = lines.length - 1;
  if (opts.dryRun) console.log(`(dry run) would write ${kept} listing(s) to ${outPath}`);
  else { writeFileSync(outPath, lines.join("\n") + "\n", "utf-8"); console.log(`Wrote ${kept} listing(s) to ${outPath}`); }
  console.log(`By relevance:`);
  for (const [k, v] of Object.entries(relevanceCounts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log(
    `  dropped by Gate 2: ${dropped}` +
      (opts.usOnly ? ` | non-US skipped: ${intl}` : "") +
      (missing ? ` | detail unavailable: ${missing}` : ""),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const which = args.includes("--employer") ? args[args.indexOf("--employer") + 1] : "all";
  const selected = which === "all" ? EMPLOYERS : EMPLOYERS.filter((e) => e.key === which);
  if (selected.length === 0) throw new Error(`unknown --employer "${which}" (oracle|dell|all)`);
  const opts = {
    max: args.includes("--max") ? Number(args[args.indexOf("--max") + 1]) : Infinity,
    dryRun: args.includes("--dry-run"),
    usOnly: !args.includes("--include-international"),
    out: args.includes("--out") ? args[args.indexOf("--out") + 1] : undefined,
  };
  for (const emp of selected) await run(emp, opts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
