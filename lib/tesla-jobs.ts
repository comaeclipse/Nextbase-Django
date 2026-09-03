/*
 * Tesla careers — pure decoder for the browser-captured `cua-api` state blob
 * (issue #313, Phase 4 browser-only source).
 *
 * Tesla is the one seeded employer with NO curl-able feed: its careers backend
 * (https://www.tesla.com/cua-api/apps/careers/state) sits behind Akamai plus
 * Tesla's own `cpr_chlge` proof-of-work challenge, so a server-side fetch hard
 * -403s (then 429s the challenge). The one thing that works is a *same-origin*
 * fetch from a real browser tab that has already solved the challenge — see the
 * capture recipe in scripts/fetch-tesla-jobs.ts. That call returns the whole
 * careers state (one ~1.5 MB JSON: `lookup` reference tables + a flat
 * `listings` array). This module turns that captured blob into the standard
 * listings-CSV rows the importer/sync already parse. It is pure and IO-free so
 * it is unit-tested (tesla-jobs.test.ts) without a browser.
 *
 * Tesla is COMMERCIAL / dual-use (counts_as_defense: false, issue #336), so only
 * the defense slice is kept. The catch: the state blob is *list-level* — each
 * listing carries a title, a department, a location id and a type, but NO job
 * description. So the #336 classifier runs on title + department only. Tesla's
 * departments are all commercial ("Vehicle Service", "Tesla AI", "Energy"…) and
 * its titles rarely name a clearance, so the slice is near-empty today — the same
 * honest outcome as x.ai's clean-but-empty Greenhouse pull. A future cleared/gov
 * role whose *title* carries the signal is still caught.
 */
import { resolveStateAbbr } from "./states";
import { classifyDefenseRelevance, type DefenseRelevance } from "./defense-jobs-slice";

/** The listings-CSV contract (import-defense-job-listings.ts + defense-jobs-adapters.ts). */
export const TESLA_CSV_HEADER = [
  "Company", "ATS", "Title", "Field", "Team", "Location", "Region",
  "Employment", "PayMin", "PayMax", "PayInterval", "Education", "URL",
  "DefenseRelevance", "DefenseSignal",
] as const;

/** USPS codes that are US soil but outside the contiguous 48 + DC. */
const NON_CONUS = new Set(["AK", "HI", "PR", "GU", "VI", "MP", "AS"]);

/** The subset of the captured `state` blob this decoder reads. */
export interface TeslaState {
  lookup?: {
    /** location id -> "City, State-or-Province-or-Country". */
    locations?: Record<string, string>;
    /** department id -> display name. */
    departments?: Record<string, string>;
    /** type id -> "fulltime" | "parttime" | "intern" | "contract" | … */
    types?: Record<string, string>;
  };
  listings?: TeslaListing[];
}

/** One row of `state.listings`. `sp` is a per-row sort index and `pu` is a date, not a URL — both ignored. */
export interface TeslaListing {
  /** requisition id — the stable key for the apply URL. */
  id: string | number;
  /** title. */
  t: string;
  /** department id -> lookup.departments. */
  dp?: string | number;
  /** location id -> lookup.locations. */
  l?: string | number;
  /** type id -> lookup.types. */
  y?: string | number;
}

export interface TeslaDecodeStats {
  total: number;
  kept: number;
  droppedNotDefense: number;
  droppedNonUs: number;
  byRelevance: Record<string, number>;
}

const EMPLOYMENT: Record<string, string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  intern: "Internship",
  internship: "Internship",
  contract: "Contract",
};

/** "AI Engineer, Optimus" @ Palo Alto -> https://www.tesla.com/careers/search/job/224501.
 * The id-only form redirects to the slug URL and is fully deterministic across pulls,
 * so it is the stable upsert key; the title-slug form Tesla shows is cosmetic. */
export function teslaJobUrl(id: string | number): string {
  return `https://www.tesla.com/careers/search/job/${id}`;
}

/** Tesla gives "City, FullStateName" (or "City, Province/Country"). Resolve the
 * trailing token as a US state to decide US vs international and to normalize to
 * the "City, ST" the rest of the pipeline expects. */
function locate(raw: string): { location: string; region: string; isUS: boolean } {
  const s = (raw ?? "").trim();
  const remote = /\bremote\b/i.test(s);
  const comma = s.lastIndexOf(",");
  if (comma > 0) {
    const city = s.slice(0, comma).trim();
    const tail = s.slice(comma + 1).trim();
    const abbr = resolveStateAbbr(tail);
    if (abbr) {
      const region = remote ? "US/Remote" : NON_CONUS.has(abbr) ? "US (non-CONUS)" : "US (CONUS)";
      return { location: `${city}, ${abbr}`, region, isUS: true };
    }
  } else if (remote) {
    return { location: s || "Remote", region: "US/Remote", isUS: true };
  }
  return { location: s, region: "International", isUS: false };
}

function employmentFor(type: string | undefined): string {
  if (!type) return "";
  return EMPLOYMENT[type.toLowerCase()] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

export interface TeslaDecodeOptions {
  /** Keep non-US roles (the #336 slice is US clearance / US gov, so default false). */
  includeInternational?: boolean;
  /** Employer display name written to the Company column. */
  company?: string;
}

/**
 * Decode a captured Tesla careers state into sliced listings-CSV rows.
 *
 * Mirrors defense-jobs-adapters.sliceAndFilter for a commercial employer: classify
 * on the (list-level) title + department, drop what is not defense-relevant, then
 * drop non-US roles unless includeInternational. Every kept row carries its #336
 * verdict in DefenseRelevance/DefenseSignal for audit.
 */
export function teslaStateToRows(
  state: TeslaState,
  opts: TeslaDecodeOptions = {},
): { rows: Record<string, string>[]; stats: TeslaDecodeStats } {
  const company = opts.company ?? "Tesla";
  const usOnly = !opts.includeInternational;
  const locations = state.lookup?.locations ?? {};
  const departments = state.lookup?.departments ?? {};
  const types = state.lookup?.types ?? {};
  const listings = state.listings ?? [];

  const rows: Record<string, string>[] = [];
  const stats: TeslaDecodeStats = { total: listings.length, kept: 0, droppedNotDefense: 0, droppedNonUs: 0, byRelevance: {} };
  const seenUrl = new Set<string>();

  for (const j of listings) {
    if (!j.t || j.id == null || String(j.id).trim() === "") continue;
    const department = j.dp != null ? departments[String(j.dp)] ?? "" : "";
    const verdict = classifyDefenseRelevance({ title: j.t, businessUnit: department }, { countsAsDefense: false });
    if (verdict.relevance === null) { stats.droppedNotDefense++; continue; }

    const loc = locate(j.l != null ? locations[String(j.l)] ?? "" : "");
    if (usOnly && !loc.isUS) { stats.droppedNonUs++; continue; }

    const url = teslaJobUrl(j.id);
    if (seenUrl.has(url)) continue; // a duplicate id would break the upsert conflict key
    seenUrl.add(url);

    const relevance: DefenseRelevance = verdict.relevance;
    stats.byRelevance[relevance] = (stats.byRelevance[relevance] ?? 0) + 1;
    stats.kept++;
    rows.push({
      Company: company,
      ATS: "Tesla",
      Title: j.t,
      Field: department,
      Team: "",
      Location: loc.location,
      Region: loc.region,
      Employment: employmentFor(j.y != null ? types[String(j.y)] : undefined),
      PayMin: "",
      PayMax: "",
      PayInterval: "",
      Education: "",
      URL: url,
      DefenseRelevance: relevance,
      DefenseSignal: verdict.signal ?? "",
    });
  }

  return { rows, stats };
}
