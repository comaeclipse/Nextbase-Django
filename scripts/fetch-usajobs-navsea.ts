/*
 * Fetches NAVSEA (Naval Sea Systems Command) job listings from USAJOBS and
 * writes them as a CSV for scripts/import-defense-job-listings.ts.
 *
 * Data source: the official keyed USAJOBS Data API,
 *   GET https://data.usajobs.gov/api/search
 * (docs: https://developer.usajobs.gov/api-reference/get-api-search). It needs
 * two headers — a registered API key and a User-Agent — supplied via env vars
 * so the secret never lives in the repo:
 *
 *   USAJOBS_API_KEY   (required)  the Authorization-Key value
 *   USAJOBS_UA        (optional)  the User-Agent; USAJOBS asks for the email you
 *                                 registered the key with. Defaults to a label.
 *
 * The query reproduces the Results URL the user supplied:
 *   /Search/Results?jt=Acquisition+Specialist&jt=Contract+Specialist&a=NV24
 *     Organization = "NV24"                              (NAVSEA's agency code;
 *                                                         NOT a Nevada filter)
 *     PositionTitle = "Acquisition Specialist;Contract Specialist"
 * which returns the same 21 postings as the website. (A keyless alternative is
 * the site's own POST /Search/ExecuteSearch backend, but the keyed API is the
 * documented, stable source and also carries salary max + coordinates.)
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
 *   USAJOBS_API_KEY=... node --import tsx scripts/fetch-usajobs-navsea.ts [--out <csv>] [--print]
 */
import { writeFileSync } from "node:fs";

const API = "https://data.usajobs.gov/api/search";
const QUERY: Record<string, string> = {
  Organization: "NV24", // NAVSEA
  PositionTitle: "Acquisition Specialist;Contract Specialist",
  ResultsPerPage: "500",
};

/*
 * A few LocationName values name an installation, not a municipality
 * ("Naval Base Newport", "Panama City Naval Surface Warfare Center"). Map those
 * to the enclosing city so the row geocodes against the importer's CITY_COORDS
 * and the map label stays readable. The rest already arrive as "City, State".
 */
const LOCATION_ALIASES: Record<string, string> = {
  "Naval Base Newport, Rhode Island": "Newport, Rhode Island",
  "Panama City Naval Surface Warfare Center, Florida": "Panama City, Florida",
};

/** Title-case a SHOUTING USAJOBS title, preserving known acronyms. */
function titleCaseTitle(raw: string): string {
  let s = raw.toLowerCase().replace(/\b([a-z])/g, (_m, c: string) => c.toUpperCase());
  const fixes: [RegExp, string][] = [
    [/\bIt\b/g, "IT"],
    [/\bInfosec\b/g, "INFOSEC"],
    [/\bEr\/lr\b/gi, "ER/LR"],
    [/\bHr\b/g, "HR"],
  ];
  for (const [re, rep] of fixes) s = s.replace(re, rep);
  return s;
}

/*
 * OPM occupational-series family names for the codes NAVSEA returns. The Data
 * API's JobCategory[].Name capitalizes conjunctions oddly ("Financial
 * Administration And Program"); this map is the clean, canonical label and takes
 * precedence, falling back to the API name for any code not listed here.
 */
const SERIES_NAME: Record<string, string> = {
  "0080": "Security Administration",
  "0201": "Human Resources Management",
  "0301": "Miscellaneous Administration",
  "0343": "Management and Program Analysis",
  "0346": "Logistics Management",
  "0501": "Financial Administration",
  "1101": "General Business and Industry",
  "1102": "Contracting",
  "1910": "Quality Assurance",
  "2210": "Information Technology Management",
};

interface Descriptor {
  PositionURI?: string;
  PositionTitle?: string;
  OrganizationName?: string;
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
  UserArea?: { Details?: { LowGrade?: string; HighGrade?: string } };
}

interface SearchResponse {
  SearchResult?: {
    SearchResultCount?: number;
    SearchResultCountAll?: number;
    SearchResultItems?: { MatchedObjectDescriptor: Descriptor }[];
  };
}

async function fetchAll(): Promise<Descriptor[]> {
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
    const url = `${API}?${new URLSearchParams({ ...QUERY, Page: String(page) })}`;
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
    // SearchResultCount is this page's size; stop once we've collected them all.
    if (out.length >= (sr?.SearchResultCountAll ?? out.length) || items.length === 0) {
      break;
    }
    page++;
  }
  return out;
}

/** Strip the `:443` port so the URL matches the canonical /job/<id> apply link. */
function normalizeUrl(d: Descriptor): string | null {
  const raw = d.PositionURI?.trim();
  return raw ? raw.replace(":443", "") : null;
}

/** "<Series Name> (<code>) · <PayPlan> <Low>-<High>" — folds the grade in. */
function buildField(d: Descriptor): string | null {
  const cat = d.JobCategory?.[0];
  const code = cat?.Code?.trim();
  const name = (code && SERIES_NAME[code]) || cat?.Name?.trim();
  if (!name && !code) return null;
  const head = code ? `${name ?? "Series"} (${code})` : name;

  const plan = d.JobGrade?.[0]?.Code?.trim();
  const low = d.UserArea?.Details?.LowGrade?.trim();
  const high = d.UserArea?.Details?.HighGrade?.trim();
  let grade = "";
  if (low || high) {
    const range = low && high && low !== high ? `${low}-${high}` : low || high;
    grade = plan ? `${plan} ${range}` : `${range}`;
  } else if (plan) {
    grade = plan;
  }
  return grade ? `${head} · ${grade}` : head!;
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
  const outIdx = argv.indexOf("--out");
  const today = new Date().toISOString().slice(0, 10);
  const out = outIdx >= 0 ? argv[outIdx + 1] : `data/usajobs_navsea_${today}.csv`;
  const printOnly = argv.includes("--print");

  const descriptors = await fetchAll();

  const header = [
    "URL", "Title", "Company", "Region", "Location", "ATS", "Field",
    "Employment", "PayMin", "PayMax", "PayInterval", "Education",
  ];
  const lines = [header.join(",")];
  let skipped = 0;
  for (const d of descriptors) {
    const url = normalizeUrl(d);
    const title = titleCaseTitle((d.PositionTitle ?? "").trim());
    if (!url || !title) {
      skipped++;
      continue;
    }
    const pay = d.PositionRemuneration;
    lines.push([
      csvCell(url),
      csvCell(title),
      csvCell(d.OrganizationName?.trim() || "Naval Sea Systems Command"),
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
    `Fetched ${descriptors.length} NAVSEA descriptor(s); wrote ${lines.length - 1} row(s), skipped ${skipped}.`
  );
  if (printOnly) {
    console.log("\n" + csv);
    return;
  }
  writeFileSync(out, csv, "utf-8");
  console.log(`Wrote ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
