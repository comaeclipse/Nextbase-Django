/*
 * "Near a base" for the chatbot (issue #312, A3). Reads the derived
 * city x installation distance table (`location_military_proximity`, see
 * SCHEMA.md) in both directions:
 *
 *   findCitiesNearBase  -- "which of our cities are within 50 miles of a Navy
 *                          base / of Fort Bragg?"  (cities ranked by distance)
 *   basesNearCity       -- "what bases are near Pensacola, FL?"
 *                          (nearest overall, nearest per branch, all in radius)
 *
 * Same scope as every other chat tool: candidate cities only. Independent of
 * `defense_hub` and of defense employers (lib/military.ts explains why a
 * command is not a contractor footprint). Distances are great-circle miles
 * from the city centroid to the installation site, never drive time.
 *
 * Installation-name matching is code-owned, like the career resolver: an
 * ambiguous name returns candidates for the model to ASK about, an unknown
 * name returns nothing -- the model must never pick a nearby base itself.
 */
import { getSql } from "../../lib/db";
import { parsePopulation } from "./derive";
import { resolveStateAbbr } from "../../lib/states";
import {
  DEFAULT_BASE_MAX_DISTANCE_MILES,
  SERVICE_BRANCH_LABEL,
  isServiceBranchSlug,
  slugForBranch,
  type ServiceBranchSlug,
} from "../../lib/military";

export interface NearBaseInstallation {
  id: number;
  commandName: string;
  /** "Army" | "Navy" | "Air Force" | "Marine Corps" -- the owning service as filed. */
  branch: string;
  branchSlug: ServiceBranchSlug;
  /** The installation's principal municipality, as the source lists it (not one of our cities). */
  city: string;
  state: string;
}

export interface InstallationRow {
  id: number | string;
  command_name: string;
  service_branch: string;
  city: string;
  state: string;
}

export function toNearBaseInstallation(row: InstallationRow): NearBaseInstallation | null {
  const branchSlug = slugForBranch(row.service_branch);
  if (!branchSlug) return null;
  return {
    id: Number(row.id),
    commandName: row.command_name,
    branch: row.service_branch,
    branchSlug,
    city: row.city,
    state: row.state,
  };
}

/* ------------------------------------------------------------------ *
 * Installation-name resolution (pure)
 * ------------------------------------------------------------------ */

/** Common shorthand people use for the full command names stored in the DB. */
const ABBREVIATIONS: Record<string, string> = {
  nas: "naval air station",
  ns: "naval station",
  nb: "naval base",
  nsa: "naval support activity",
  nsb: "naval submarine base",
  nsf: "naval support facility",
  nws: "naval weapons station",
  mcb: "marine corps base",
  mcas: "marine corps air station",
  mcrd: "marine corps recruit depot",
  mclb: "marine corps logistics base",
  afb: "air force base",
  afs: "air force station",
  jb: "joint base",
  jber: "joint base elmendorf richardson",
  jblm: "joint base lewis mcchord",
  jbsa: "joint base san antonio",
  jbphh: "joint base pearl harbor hickam",
  jble: "joint base langley eustis",
  jbmdl: "joint base mcguire dix lakehurst",
  jbab: "joint base anacostia bolling",
  ft: "fort",
};

/**
 * The 2023 congressional renames and their 2025 restorations. The DB stores
 * whatever name is current; a person may say either. Each pair maps both ways
 * so a lookup works regardless of which name the row carries.
 */
const FORMER_NAME_PAIRS: [string, string][] = [
  ["fort bragg", "fort liberty"],
  ["fort hood", "fort cavazos"],
  ["fort benning", "fort moore"],
  ["fort gordon", "fort eisenhower"],
  ["fort lee", "fort gregg adams"],
  ["fort rucker", "fort novosel"],
  ["fort polk", "fort johnson"],
  ["fort pickett", "fort barfoot"],
  ["fort a p hill", "fort walker"],
];

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((tok) => ABBREVIATIONS[tok] ?? tok)
    .join(" ")
    .replace(/\s+/g, " ");
}

function alternateNames(normalized: string): string[] {
  const out: string[] = [];
  for (const [a, b] of FORMER_NAME_PAIRS) {
    if (normalized.includes(a)) out.push(normalized.replace(a, b));
    if (normalized.includes(b)) out.push(normalized.replace(b, a));
  }
  return out;
}

export type InstallationResolution =
  | {
      status: "resolved";
      installation: NearBaseInstallation;
      /** Every DB row for this installation -- a joint base can carry one row per service. */
      rowIds: number[];
      matchedVia: "name" | "former_name";
    }
  | { status: "ambiguous"; candidates: NearBaseInstallation[] }
  | { status: "unknown" };

/**
 * A few joint bases are stored once per owning service (Joint Base
 * Lewis-McChord: Army + Air Force). Collapse rows that share a command name
 * into one installation whose `branch` lists every service, keeping the ids so
 * a distance query can still match all of them. Order is preserved.
 */
export function mergeDuplicateInstallations<T extends NearBaseInstallation>(
  items: readonly T[]
): (T & { rowIds: number[] })[] {
  const out: (T & { rowIds: number[] })[] = [];
  const byName = new Map<string, T & { rowIds: number[] }>();
  for (const item of items) {
    const key = normalizeName(item.commandName);
    const existing = byName.get(key);
    if (!existing) {
      const merged = { ...item, rowIds: [item.id] };
      byName.set(key, merged);
      out.push(merged);
      continue;
    }
    existing.rowIds.push(item.id);
    if (!existing.branch.split(" / ").includes(item.branch)) existing.branch = `${existing.branch} / ${item.branch}`;
  }
  return out;
}

/**
 * Match a person's words for a base against the installation list. Every
 * query token (after abbreviation expansion) must appear in the command name;
 * an exact normalized match wins outright. Falls back to the former/restored
 * name pairs so "Fort Liberty" still finds the row filed as "Fort Bragg".
 */
export function resolveInstallation(
  query: string,
  installations: readonly NearBaseInstallation[]
): InstallationResolution {
  const normalized = normalizeName(query);
  if (!normalized) return { status: "unknown" };

  const attempt = (needle: string) => {
    const exact = installations.filter((i) => normalizeName(i.commandName) === needle);
    if (exact.length) return mergeDuplicateInstallations(exact);
    const tokens = needle.split(" ");
    return mergeDuplicateInstallations(
      installations.filter((i) => {
        const hay = ` ${normalizeName(i.commandName)} `;
        return tokens.every((t) => hay.includes(` ${t} `));
      })
    );
  };

  const settle = (
    matches: ReturnType<typeof attempt>,
    matchedVia: "name" | "former_name"
  ): InstallationResolution | null => {
    if (matches.length === 1) {
      const { rowIds, ...installation } = matches[0];
      return { status: "resolved", installation, rowIds, matchedVia };
    }
    if (matches.length > 1)
      return { status: "ambiguous", candidates: matches.slice(0, 8).map(({ rowIds: _ids, ...i }) => i) };
    return null;
  };

  const direct = settle(attempt(normalized), "name");
  if (direct) return direct;
  for (const alt of alternateNames(normalized)) {
    const viaFormer = settle(attempt(alt), "former_name");
    if (viaFormer) return viaFormer;
  }
  return { status: "unknown" };
}

/* ------------------------------------------------------------------ *
 * Cities near a base (pure ranking over distance rows)
 * ------------------------------------------------------------------ */

export interface ProximityRow {
  location_id: number | string;
  city_name: string;
  city_state: string;
  population: string | number | null;
  installation_id: number | string;
  command_name: string;
  service_branch: string;
  installation_city: string;
  installation_state: string;
  distance_miles: number | string;
}

export interface CityNearBase {
  city: string;
  population: number | null;
  /** The closest installation that satisfies the branch/installation filter. */
  nearest: NearBaseInstallation & { distanceMiles: number };
  /** Other qualifying installations inside the radius, nearest first (capped). */
  othersWithinRadius: (NearBaseInstallation & { distanceMiles: number })[];
}

export interface CitiesNearBaseResult {
  scopeNote: string;
  caveats: string[];
  radiusMiles: number;
  branch: ServiceBranchSlug | null;
  branchLabel: string | null;
  /** How the installation input resolved, when one was given. */
  installation: InstallationResolution | null;
  /** Candidate cities that had a qualifying installation inside the radius. */
  citiesMatched: number;
  cities: CityNearBase[];
}

export const NEAR_BASE_SCOPE_NOTE =
  "Only cities in this database are screened, not every town near the base. Distances are straight-line miles from the city center to the installation site, not driving time.";

const NEAR_BASE_CAVEATS = [
  "Straight-line miles, not drive time: a base across a bay or mountain range can be much farther by road.",
  "Only Army, Navy, Air Force, and Marine Corps installations are indexed. Coast Guard and Space Force sites are not, so 'no base within N miles' is only true for those four services.",
  "A joint base is usually filed under one owning service (Joint Base Langley-Eustis under Air Force, for example), so a branch filter can miss a joint base that also hosts that service; the named installation is what to trust.",
  "Proximity says nothing about access, gate hours, or whether a base has the commissary, exchange, or clinic the person wants.",
];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Group distance rows by city, nearest-first, cap the per-city list. Pure. */
export function rankCitiesNearBase(rows: readonly ProximityRow[], opts: { limit?: number; perCityCap?: number } = {}): CityNearBase[] {
  const perCityCap = opts.perCityCap ?? 3;
  const byCity = new Map<number, { city: string; population: number | null; hits: (NearBaseInstallation & { distanceMiles: number })[] }>();
  for (const r of rows) {
    const inst = toNearBaseInstallation({
      id: r.installation_id,
      command_name: r.command_name,
      service_branch: r.service_branch,
      city: r.installation_city,
      state: r.installation_state,
    });
    if (!inst) continue;
    const id = Number(r.location_id);
    const abbr = resolveStateAbbr(r.city_state) ?? r.city_state.trim().toUpperCase();
    let bucket = byCity.get(id);
    if (!bucket) {
      byCity.set(
        id,
        (bucket = {
          city: `${r.city_name}, ${abbr}`,
          population: r.population === null ? null : parsePopulation(String(r.population)),
          hits: [],
        })
      );
    }
    bucket.hits.push({ ...inst, distanceMiles: round1(Number(r.distance_miles)) });
  }

  const cities: CityNearBase[] = [];
  for (const b of byCity.values()) {
    b.hits.sort((x, y) => x.distanceMiles - y.distanceMiles || x.commandName.localeCompare(y.commandName));
    // A joint base stored once per service must not show up as two bases.
    const [nearest, ...rest] = mergeDuplicateInstallations(b.hits).map(({ rowIds: _ids, ...h }) => h);
    cities.push({ city: b.city, population: b.population, nearest, othersWithinRadius: rest.slice(0, perCityCap) });
  }
  cities.sort((a, b) => a.nearest.distanceMiles - b.nearest.distanceMiles || a.city.localeCompare(b.city));
  return cities.slice(0, opts.limit ?? 10);
}

function clampRadius(miles: number | undefined): number {
  if (miles === undefined || !Number.isFinite(miles)) return DEFAULT_BASE_MAX_DISTANCE_MILES;
  return Math.min(150, Math.max(5, Math.round(miles)));
}

/**
 * "Which cities are within N miles of a base / a <branch> base / <installation>?"
 * Returns cities ranked by distance to their nearest qualifying installation.
 */
export async function findCitiesNearBase(
  opts: {
    installation?: string;
    branch?: string;
    states?: string[];
    maxDistanceMiles?: number;
    limit?: number;
  } = {}
): Promise<CitiesNearBaseResult> {
  const sql = getSql();
  const radius = clampRadius(opts.maxDistanceMiles);
  const branch = opts.branch && isServiceBranchSlug(opts.branch) ? opts.branch : null;
  const base = {
    scopeNote: NEAR_BASE_SCOPE_NOTE,
    caveats: NEAR_BASE_CAVEATS,
    radiusMiles: radius,
    branch,
    branchLabel: branch ? SERVICE_BRANCH_LABEL[branch] : null,
  };

  let installationIds: number[] | null = null;
  let resolution: InstallationResolution | null = null;
  if (opts.installation?.trim()) {
    const instRows = (await sql.query(
      `SELECT id, command_name, service_branch, city, state
         FROM military_installations
        WHERE operational_status = 'active' AND latitude IS NOT NULL`
    )) as InstallationRow[];
    const installations = instRows.map(toNearBaseInstallation).filter((i): i is NearBaseInstallation => i !== null);
    resolution = resolveInstallation(opts.installation, installations);
    if (resolution.status !== "resolved") {
      return { ...base, installation: resolution, citiesMatched: 0, cities: [] };
    }
    installationIds = resolution.rowIds;
  }

  const params: unknown[] = [radius];
  const where: string[] = ["l.is_candidate", "p.distance_miles <= $1"];
  if (installationIds !== null) {
    params.push(installationIds);
    where.push(`m.id = ANY($${params.length}::bigint[])`);
  }
  if (branch) {
    params.push(SERVICE_BRANCH_LABEL[branch]);
    where.push(`m.service_branch = $${params.length}`);
  }
  if (opts.states?.length) {
    const abbrs = opts.states.map((s) => resolveStateAbbr(s) ?? s.trim().toUpperCase());
    params.push(abbrs);
    where.push(`l.state = ANY($${params.length}::text[])`);
  }

  const rows = (await sql.query(
    `SELECT l.id AS location_id, l.name AS city_name, l.state AS city_state, l.population,
            m.id AS installation_id, m.command_name, m.service_branch,
            m.city AS installation_city, m.state AS installation_state,
            p.distance_miles
       FROM location_military_proximity p
       JOIN locations_location l ON l.id = p.location_id
       JOIN military_installations m ON m.id = p.military_installation_id
      WHERE ${where.join(" AND ")}
      ORDER BY p.distance_miles`,
    params
  )) as ProximityRow[];

  const citiesMatched = new Set(rows.map((r) => Number(r.location_id))).size;
  return {
    ...base,
    installation: resolution,
    citiesMatched,
    cities: rankCitiesNearBase(rows, { limit: opts.limit }),
  };
}

/* ------------------------------------------------------------------ *
 * Bases near one city
 * ------------------------------------------------------------------ */

export interface BasesNearCityResult {
  matched: boolean;
  city: string | null;
  scopeNote: string;
  caveats: string[];
  radiusMiles: number;
  nearest: (NearBaseInstallation & { distanceMiles: number }) | null;
  nearestByBranch: Partial<Record<ServiceBranchSlug, NearBaseInstallation & { distanceMiles: number }>>;
  /** Every indexed installation inside the radius, nearest first. */
  withinRadius: (NearBaseInstallation & { distanceMiles: number })[];
  note: string;
}

/** "What bases are near <City, ST>?" */
export async function basesNearCity(
  cityInput: string,
  opts: { maxDistanceMiles?: number } = {}
): Promise<BasesNearCityResult> {
  const radius = clampRadius(opts.maxDistanceMiles ?? 100);
  const empty = (note: string, city: string | null): BasesNearCityResult => ({
    matched: false,
    city,
    scopeNote: NEAR_BASE_SCOPE_NOTE,
    caveats: NEAR_BASE_CAVEATS,
    radiusMiles: radius,
    nearest: null,
    nearestByBranch: {},
    withinRadius: [],
    note,
  });

  const sep = cityInput.lastIndexOf(",");
  const cityRaw = (sep === -1 ? cityInput : cityInput.slice(0, sep)).trim();
  const stateRaw = sep === -1 ? "" : cityInput.slice(sep + 1).trim();
  const stateAbbr = stateRaw ? resolveStateAbbr(stateRaw) : null;
  if (!cityRaw) return empty('Give a city as "City, ST".', null);
  if (!stateAbbr) return empty('I need a state to tell the city apart -- ask for it as "City, ST".', cityRaw);

  const sql = getSql();
  const rows = (await sql.query(
    `SELECT l.id AS location_id, l.name AS city_name, l.state AS city_state, l.population,
            m.id AS installation_id, m.command_name, m.service_branch,
            m.city AS installation_city, m.state AS installation_state,
            p.distance_miles
       FROM locations_location l
       JOIN location_military_proximity p ON p.location_id = l.id
       JOIN military_installations m ON m.id = p.military_installation_id
      WHERE l.is_candidate AND LOWER(l.name) = LOWER($1) AND l.state = $2
      ORDER BY p.distance_miles, m.command_name`,
    [cityRaw, stateAbbr]
  )) as ProximityRow[];

  if (rows.length === 0) {
    return empty(
      `No city named "${cityRaw}, ${stateAbbr}" is in this database (or it has no base distances yet).`,
      `${cityRaw}, ${stateAbbr}`
    );
  }

  const rawHits = rows
    .map((r) => {
      const inst = toNearBaseInstallation({
        id: r.installation_id,
        command_name: r.command_name,
        service_branch: r.service_branch,
        city: r.installation_city,
        state: r.installation_state,
      });
      return inst ? { ...inst, distanceMiles: round1(Number(r.distance_miles)) } : null;
    })
    .filter((h): h is NearBaseInstallation & { distanceMiles: number } => h !== null);

  // Per-service is computed on the raw rows so a joint base counts for each
  // service it is filed under; the displayed lists collapse those duplicates.
  const nearestByBranch: BasesNearCityResult["nearestByBranch"] = {};
  for (const h of rawHits) if (!nearestByBranch[h.branchSlug]) nearestByBranch[h.branchSlug] = h;
  const hits = mergeDuplicateInstallations(rawHits).map(({ rowIds: _ids, ...h }) => h);

  const city = `${rows[0].city_name}, ${stateAbbr}`;
  return {
    matched: true,
    city,
    scopeNote: NEAR_BASE_SCOPE_NOTE,
    caveats: NEAR_BASE_CAVEATS,
    radiusMiles: radius,
    nearest: hits[0] ?? null,
    nearestByBranch,
    withinRadius: hits.filter((h) => h.distanceMiles <= radius),
    note: `Nearest overall plus nearest per service; withinRadius lists every indexed installation within ${radius} miles of ${city}.`,
  };
}
