/*
 * Generalized USAJOBS fetcher. Writes job listings as the 12-column CSV that
 * scripts/import-defense-job-listings.ts consumes, so any USAJOBS query can be
 * ingested onto /defense-jobs (and, via the career-listings bridge, surfaced on
 * /career-transition for a mapped military specialty).
 *
 * This generalizes scripts/fetch-usajobs-navsea.ts: instead of a hardcoded
 * NAVSEA query, the search is driven by CLI flags. The pagination loop, header
 * injection, Field/location builders, and CSV shape are the same contract.
 *
 * Data source: the official keyed USAJOBS Data API,
 *   GET https://data.usajobs.gov/api/search
 * (docs: https://developer.usajobs.gov/api-reference/get-api-search). Needs two
 * headers supplied via env vars so the secret never lives in the repo:
 *
 *   USAJOBS_API_KEY   (required)  the Authorization-Key value
 *   USAJOBS_UA        (optional)  the User-Agent; USAJOBS asks for the email you
 *                                 registered the key with. Defaults to a label.
 *
 * Output columns match the importer's expected CSV schema:
 *   URL, Title, Company, Region, Location, ATS, Field, Employment, PayMin,
 *   PayMax, PayInterval, Education
 *
 * This is a point-in-time snapshot; the importer upserts on `url`, so re-running
 * fetch + import refreshes the set. Multi-location postings keep only their
 * primary duty station (PositionLocation[0]), matching the importer's
 * one-row-per-url contract.
 *
 * Usage (no DB access, no .env needed — just the two env vars above):
 *   USAJOBS_API_KEY=... node --import tsx scripts/fetch-usajobs.ts \
 *     [--keyword <str>] [--title <a;b>] [--org <code>] [--series <a;b>] \
 *     [--results-per-page <n>] [--require-clearance] [--out <csv>] [--print]
 *
 * Example (cleared intelligence analysts):
 *   USAJOBS_API_KEY=... node --import tsx scripts/fetch-usajobs.ts \
 *     --keyword analyst --series 0132 --print
 */
import { writeFileSync } from "node:fs";

const API = "https://data.usajobs.gov/api/search";

/** OPM occupational-series family names for the codes we query. The Data API's
 * JobCategory[].Name capitalizes oddly ("Financial Administration And Program");
 * this map is the clean, canonical label and takes precedence, falling back to
 * the API name for any code not listed here. Keep in sync with the analyst
 * series we ingest. */
const SERIES_NAME: Record<string, string> = {
  "0080": "Security Administration",
  "0132": "Intelligence",
  "0201": "Human Resources Management",
  "0301": "Miscellaneous Administration",
  "0343": "Management and Program Analysis",
  "0346": "Logistics Management",
  "0501": "Financial Administration",
  "1101": "General Business and Industry",
  "1102": "Contracting",
  "1550": "Computer Science",
  "1910": "Quality Assurance",
  "2210": "Information Technology Management",
};

/*
 * A few LocationName values name an installation, not a municipality
 * ("Naval Base Newport", "Panama City Naval Surface Warfare Center"). Map those
 * to the enclosing city so the row geocodes against the importer's CITY_COORDS
 * and the map label stays readable. The rest already arrive as "City, State".
 * Extend empirically from a `--print` pull.
 */
const LOCATION_ALIASES: Record<string, string> = {
  "Naval Base Newport, Rhode Island": "Newport, Rhode Island",
  "Panama City Naval Surface Warfare Center, Florida": "Panama City, Florida",
};

interface Descriptor {
  PositionURI?: string;
  PositionTitle?: string;
  OrganizationName?: string;
  DepartmentName?: string;
  JobCategory?: { Name?: string; Code?: string }[];
  JobGrade?: { Code?: string }[];
  PositionLocation?: { LocationName?: string }[];
  PositionSchedule?: { Name?: string }[];
  PositionRemuneration?: {
    MinimumRange?: string;
    MaximumRange?: string;
    RateIntervalCode?: string;
    Description?: string;
  }[];
  UserArea?: {
    Details?: {
      LowGrade?: string;
      HighGrade?: string;
      // The clearance field's exact name has varied across API revisions; read
      // both and use whichever the live payload populates.
      SecurityClearance?: string;
      SecurityClearanceRequired?: string;
    };
  };
}

interface SearchResponse {
  SearchResult?: {
    SearchResultCount?: number;
    SearchResultCountAll?: number;
    SearchResultItems?: { MatchedObjectDescriptor: Descriptor }[];
  };
}

interface Options {
  query: Record<string, string>;
  requireClearance: boolean;
  out: string;
  printOnly: boolean;
}

/** Pull a flag's value: `--flag value`. Returns undefined if absent. */
function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function parseArgs(argv: string[], today: string): Options {
  const query: Record<string, string> = {
    ResultsPerPage: flag(argv, "--results-per-page") ?? "500",
  };
  const keyword = flag(argv, "--keyword");
  const title = flag(argv, "--title");
  const org = flag(argv, "--org");
  const series = flag(argv, "--series");
  if (keyword) query.Keyword = keyword;
  if (title) query.PositionTitle = title;
  if (org) query.Organization = org;
  if (series) query.JobCategoryCode = series;

  if (!keyword && !title && !org && !series) {
    throw new Error(
      "Provide at least one of --keyword / --title / --org / --series so the " +
        "search is scoped (an unscoped query would pull the entire board)."
    );
  }

  const outFlag = flag(argv, "--out");
  return {
    query,
    requireClearance: argv.includes("--require-clearance"),
    out: outFlag ?? `data/usajobs_${today}.csv`,
    printOnly: argv.includes("--print"),
  };
}

async function fetchAll(query: Record<string, string>): Promise<Descriptor[]> {
  const key = process.env.USAJOBS_API_KEY;
  if (!key) {
    throw new Error(
      "USAJOBS_API_KEY is not set. Export the USAJOBS Data API key (a secret; " +
        "keep it out of the repo — store it in .env / Vercel env) and re-run."
    );
  }
  const ua = process.env.USAJOBS_UA || "vetretire-defense-jobs-ingest";
  const out: Descriptor[] = [];
  let page = 1;
  for (;;) {
    const url = `${API}?${new URLSearchParams({ ...query, Page: String(page) })}`;
    const res = await fetch(url, {
      headers: { Host: "data.usajobs.gov", "User-Agent": ua, "Authorization-Key": key },
    });
    const text = await res.text();
    let json: SearchResponse;
    try {
      json = JSON.parse(text) as SearchResponse;
    } catch {
      throw new Error(
        `Data API page ${page} did not return JSON (HTTP ${res.status}). First 200 chars:\n${text.slice(0, 200)}`
      );
    }
    const sr = json.SearchResult;
    const items = sr?.SearchResultItems ?? [];
    out.push(...items.map((i) => i.MatchedObjectDescriptor));
    // SearchResultCountAll is the total across pages; stop once we've collected
    // them all (or a page comes back empty).
    if (out.length >= (sr?.SearchResultCountAll ?? out.length) || items.length === 0) {
      break;
    }
    page++;
  }
  return out;
}

/** Title-case a SHOUTING USAJOBS title, preserving known acronyms. Titles that
 * already carry lowercase letters are left untouched (they're human-cased). */
function titleCaseTitle(raw: string): string {
  if (/[a-z]/.test(raw)) return raw; // already mixed-case; don't mangle it
  let s = raw.toLowerCase().replace(/\b([a-z])/g, (_m, c: string) => c.toUpperCase());
  const fixes: [RegExp, string][] = [
    [/\bIt\b/g, "IT"],
    [/\bInfosec\b/g, "INFOSEC"],
    [/\bEr\/lr\b/gi, "ER/LR"],
    [/\bHr\b/g, "HR"],
    [/\bIsso\b/g, "ISSO"],
    [/\bIssm\b/g, "ISSM"],
    [/\bSigint\b/g, "SIGINT"],
    [/\bElint\b/g, "ELINT"],
    [/\bGeoint\b/g, "GEOINT"],
    [/\bOsint\b/g, "OSINT"],
    [/\bC4isr\b/gi, "C4ISR"],
  ];
  for (const [re, rep] of fixes) s = s.replace(re, rep);
  return s;
}

/** Strip the `:443` port so the URL matches the canonical /job/<id> apply link. */
function normalizeUrl(d: Descriptor): string | null {
  const raw = d.PositionURI?.trim();
  return raw ? raw.replace(":443", "") : null;
}

/** The security-clearance level, only when the API returns a real one. Returns
 * null for empty / "Not Applicable" / "None" / "Not Required" so we never assert
 * a clearance the source didn't state. */
function clearanceLevel(d: Descriptor): string | null {
  const raw = (
    d.UserArea?.Details?.SecurityClearance ??
    d.UserArea?.Details?.SecurityClearanceRequired ??
    ""
  ).trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "not applicable" || lower === "none" || lower === "not required" || lower === "n/a") {
    return null;
  }
  return raw;
}

/** "<Series Name> (<code>) · <PayPlan> <Low>-<High> · Clearance: <level>". The
 * clearance suffix is appended only when the API states one. */
function buildField(d: Descriptor): string | null {
  const cat = d.JobCategory?.[0];
  const code = cat?.Code?.trim();
  const name = (code && SERIES_NAME[code]) || cat?.Name?.trim();
  const parts: string[] = [];

  if (name || code) {
    parts.push(code ? `${name ?? "Series"} (${code})` : name!);
  }

  const plan = d.JobGrade?.[0]?.Code?.trim();
  const low = d.UserArea?.Details?.LowGrade?.trim();
  const high = d.UserArea?.Details?.HighGrade?.trim();
  if (low || high) {
    const range = low && high && low !== high ? `${low}-${high}` : low || high;
    parts.push(plan ? `${plan} ${range}` : `${range}`);
  } else if (plan) {
    parts.push(plan);
  }

  const clearance = clearanceLevel(d);
  if (clearance) parts.push(`Clearance: ${clearance}`);

  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Primary duty station: PositionLocation[0], normalized past installation names. */
function primaryLocation(d: Descriptor): string {
  const loc = d.PositionLocation?.[0]?.LocationName?.trim() ?? "";
  return LOCATION_ALIASES[loc] ?? loc;
}

/** USAJOBS RateIntervalCode / Description -> the importer's interval vocabulary. */
function payInterval(r: Descriptor["PositionRemuneration"]): string {
  const code = r?.[0]?.RateIntervalCode?.trim().toUpperCase();
  if (code === "PA") return "year";
  if (code === "PH") return "hour";
  const desc = (r?.[0]?.Description ?? "").toLowerCase();
  if (desc.includes("hour")) return "hour";
  return "year";
}

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const argv = process.argv.slice(2);
  const today = new Date().toISOString().slice(0, 10);
  const opts = parseArgs(argv, today);

  const descriptors = await fetchAll(opts.query);

  const header = [
    "URL", "Title", "Company", "Region", "Location", "ATS", "Field",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education",
  ];
  const lines = [header.join(",")];
  let skipped = 0;
  let droppedNoClearance = 0;
  for (const d of descriptors) {
    const url = normalizeUrl(d);
    const title = titleCaseTitle((d.PositionTitle ?? "").trim());
    if (!url || !title) {
      skipped++;
      continue;
    }
    if (opts.requireClearance && !clearanceLevel(d)) {
      droppedNoClearance++;
      continue;
    }
    const pay = d.PositionRemuneration;
    lines.push([
      csvCell(url),
      csvCell(title),
      // Federal listings are hired by an agency; fall back to the department.
      csvCell(d.OrganizationName?.trim() || d.DepartmentName?.trim() || "U.S. Government"),
      csvCell("US"),
      csvCell(primaryLocation(d)),
      csvCell("USAJOBS"),
      csvCell(buildField(d)),
      csvCell(d.PositionSchedule?.[0]?.Name?.trim() || "Full-time"),
      csvCell(pay?.[0]?.MinimumRange ?? ""),
      csvCell(pay?.[0]?.MaximumRange ?? ""),
      csvCell(payInterval(pay)),
      csvCell(""),
    ].join(","));
  }

  const csv = lines.join("\n") + "\n";
  console.log(
    `Fetched ${descriptors.length} descriptor(s); wrote ${lines.length - 1} row(s), ` +
      `skipped ${skipped}${opts.requireClearance ? `, dropped ${droppedNoClearance} with no stated clearance` : ""}.`
  );
  if (opts.printOnly) {
    console.log("\n" + csv);
    return;
  }
  writeFileSync(opts.out, csv, "utf-8");
  console.log(`Wrote ${opts.out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
