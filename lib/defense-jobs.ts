/*
 * Read-only access for the standalone /defense-jobs page.
 *
 * The page renders ~12k individual scraped listings (defense_job_listings). To
 * keep the initial document tiny, the data is NOT shipped whole to the client:
 *
 *   - `getDefenseJobFacets`          — the small distinct sets that drive the
 *                                       filter chips (sectors, employers, regions).
 *   - `getDefenseJobListingsPage`    — one filtered, paginated slice of listings
 *                                       (the list view; the `/api/defense-jobs`
 *                                       route serves subsequent pages).
 *   - `getDefenseJobMapAggregation`  — city-level GROUP BY of the *matching*
 *                                       listings for the map, so the client never
 *                                       has to derive it from 12k raw rows.
 *   - `getDefenseEmployerCityCounts` — the aggregate per-city posting counts we
 *                                       already track for defense primes
 *                                       (defense_employer_locations), used only for
 *                                       the count-only cross-reference markers.
 *
 * `getDefenseJobListings` (the whole-table read) is retained for callers that
 * still want every row, but the page no longer uses it.
 *
 * All reads swallow Postgres 42P01 (undefined_table) so the page renders before
 * the migrations/imports have run.
 */
import { unstable_cache } from "next/cache";
import { getSql } from "./db";
import { resolveStateAbbr } from "./states";
import type { DefenseEmployerCityCount, DefenseJobListingRow } from "./types";

const CACHE_REVALIDATE_SECONDS = 300;
const DEFENSE_JOBS_TAG = "defense-jobs";

/** Columns selected for a listing row, shared by the whole-table and paged reads. */
const LISTING_COLUMNS = `id, company, employer_slug, ats, title, field_raw, sector,
       location_raw, city, state, country, region, is_remote,
       latitude, longitude, employment_type, pay_min, pay_max,
       pay_interval, education, url, snapshot_date`;

const isMissingTable = (err: unknown): boolean =>
  (err as { code?: string })?.code === "42P01";

const SKILLBRIDGE_COLUMNS = [
  "skillbridge_status",
  "skillbridge_participation_type",
  "skillbridge_source_url",
  "skillbridge_verified_at",
] as const;

let skillBridgeColumnsPromise: Promise<boolean> | null = null;

async function hasSkillBridgeColumns(): Promise<boolean> {
  skillBridgeColumnsPromise ??= (async () => {
    try {
      const sql = getSql();
      const rows = (await sql.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'transition_employers'
           AND column_name = ANY($1)`,
        [SKILLBRIDGE_COLUMNS]
      )) as { column_name: string }[];
      const found = new Set(rows.map((r) => r.column_name));
      return SKILLBRIDGE_COLUMNS.every((column) => found.has(column));
    } catch (err) {
      if (isMissingTable(err)) return false;
      throw err;
    }
  })();
  return skillBridgeColumnsPromise;
}

/*
 * Listing lifecycle (issue #313): `last_seen_at` / `closed_at` on
 * defense_job_listings. A closed listing (its board no longer lists it) stays in
 * the table for history but must never render, so every read filters
 * `closed_at IS NULL`. Probed like the SkillBridge columns so the page keeps
 * serving before scripts/migrate-defense-job-listings.ts has added them.
 */
const LIFECYCLE_COLUMNS = ["last_seen_at", "closed_at"] as const;

let lifecycleColumnsPromise: Promise<boolean> | null = null;

async function hasListingLifecycleColumns(): Promise<boolean> {
  lifecycleColumnsPromise ??= (async () => {
    try {
      const sql = getSql();
      const rows = (await sql.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'defense_job_listings'
           AND column_name = ANY($1)`,
        [LIFECYCLE_COLUMNS]
      )) as { column_name: string }[];
      const found = new Set(rows.map((r) => r.column_name));
      return LIFECYCLE_COLUMNS.every((column) => found.has(column));
    } catch (err) {
      if (isMissingTable(err)) return false;
      throw err;
    }
  })();
  return lifecycleColumnsPromise;
}

/** `<alias>closed_at IS NULL` once the lifecycle columns exist, else a no-op `TRUE`. */
function openClause(include: boolean, alias = ""): string {
  return include ? `${alias}closed_at IS NULL` : "TRUE";
}

function skillBridgeJoin(include: boolean): string {
  if (!include) return "";
  return `LEFT JOIN (
      SELECT defense_employer_slug AS employer_slug,
             CASE
               WHEN bool_or(skillbridge_status = 'active') THEN 'active'
               WHEN bool_or(skillbridge_status = 'inactive') THEN 'inactive'
               ELSE 'unknown'
             END AS skillbridge_status,
             (array_agg(skillbridge_participation_type ORDER BY (skillbridge_status = 'active') DESC)
                FILTER (WHERE skillbridge_participation_type IS NOT NULL))[1]
                AS skillbridge_participation_type,
             (array_agg(skillbridge_source_url ORDER BY (skillbridge_status = 'active') DESC)
                FILTER (WHERE skillbridge_source_url IS NOT NULL))[1]
                AS skillbridge_source_url,
             max(skillbridge_verified_at) AS skillbridge_verified_at
      FROM transition_employers
      WHERE defense_employer_slug IS NOT NULL
      GROUP BY defense_employer_slug
    ) sb ON sb.employer_slug = j.employer_slug`;
}

function listingSelect(alias: string, includeSkillBridge: boolean): string {
  const base = LISTING_COLUMNS.split(",")
    .map((column) => `${alias}.${column.trim()}`)
    .join(", ");
  if (!includeSkillBridge) {
    return `${base},
       NULL::text AS skillbridge_status,
       NULL::text AS skillbridge_participation_type,
       NULL::text AS skillbridge_source_url,
       NULL::date AS skillbridge_verified_at`;
  }
  return `${base},
       sb.skillbridge_status,
       sb.skillbridge_participation_type,
       sb.skillbridge_source_url,
       sb.skillbridge_verified_at`;
}

/** Client-facing listing shape (camelCase), shared by the page and the API route. */
export interface ClientJobListing {
  id: number;
  company: string;
  employerSlug: string | null;
  title: string;
  fieldRaw: string | null;
  sector: string;
  city: string | null;
  state: string | null;
  region: string | null;
  isRemote: boolean;
  latitude: number | null;
  longitude: number | null;
  employmentType: string | null;
  payMin: number | null;
  payMax: number | null;
  payInterval: string | null;
  education: string | null;
  url: string;
  snapshotDate: string | null;
  skillBridgeStatus: string | null;
  skillBridgeParticipationType: string | null;
  skillBridgeSourceUrl: string | null;
  skillBridgeVerifiedAt: string | null;
}

/** Map a DB row to the trimmed camelCase shape the client component consumes. */
export function toClientListing(r: DefenseJobListingRow): ClientJobListing {
  return {
    id: r.id,
    company: r.company,
    employerSlug: r.employer_slug,
    title: r.title,
    fieldRaw: r.field_raw,
    sector: r.sector,
    city: r.city,
    state: r.state,
    region: r.region,
    isRemote: r.is_remote,
    latitude: r.latitude,
    longitude: r.longitude,
    employmentType: r.employment_type,
    payMin: r.pay_min,
    payMax: r.pay_max,
    payInterval: r.pay_interval,
    education: r.education,
    url: r.url,
    snapshotDate: r.snapshot_date,
    skillBridgeStatus: r.skillbridge_status ?? null,
    skillBridgeParticipationType: r.skillbridge_participation_type ?? null,
    skillBridgeSourceUrl: r.skillbridge_source_url ?? null,
    skillBridgeVerifiedAt: r.skillbridge_verified_at ?? null,
  };
}

function normalizeListingRow(r: Record<string, unknown>): DefenseJobListingRow {
  return {
    ...r,
    id: Number(r.id),
    latitude: r.latitude == null ? null : Number(r.latitude),
    longitude: r.longitude == null ? null : Number(r.longitude),
    pay_min: r.pay_min == null ? null : Number(r.pay_min),
    pay_max: r.pay_max == null ? null : Number(r.pay_max),
    is_remote: Boolean(r.is_remote),
    skillbridge_verified_at:
      r.skillbridge_verified_at instanceof Date
        ? r.skillbridge_verified_at.toISOString().slice(0, 10)
        : r.skillbridge_verified_at,
    snapshot_date:
      r.snapshot_date instanceof Date
        ? r.snapshot_date.toISOString().slice(0, 10)
        : r.snapshot_date,
  } as DefenseJobListingRow;
}

/* ------------------------------------------------------------------ *
 * Filtering
 * ------------------------------------------------------------------ */

/**
 * Server-side mirror of the client-side facets in DefenseJobsExplorer. Every
 * field is optional; an all-empty filter matches every listing. `employers`
 * holds `COALESCE(employer_slug, company)` keys (the same key the chips use).
 * `city` is a `"City|ST"` selection.
 */
export interface DefenseJobFilter {
  sectors?: string[];
  employers?: string[];
  regions?: string[];
  remote?: boolean;
  skillbridge?: boolean;
  q?: string;
  city?: string | null;
}

const splitCsv = (v: string | null): string[] =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

/** Parse a `DefenseJobFilter` from the API route's query string. */
export function parseDefenseJobFilter(sp: URLSearchParams): DefenseJobFilter {
  return {
    sectors: splitCsv(sp.get("sectors")),
    employers: splitCsv(sp.get("employers")),
    regions: splitCsv(sp.get("regions")),
    remote: sp.get("remote") === "true",
    skillbridge: sp.get("skillbridge") === "true",
    q: sp.get("q") ?? "",
    city: sp.get("city"),
  };
}

/** Escape LIKE wildcards so `q` behaves as a literal substring match (parity with the client's `includes`). */
function likeLiteral(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * Build the WHERE clause for a filter, pushing parameters onto `params` (1-based
 * `$n` placeholders for sql.query). Returns "" when the filter is empty.
 */
export function buildDefenseJobWhere(
  f: DefenseJobFilter,
  params: unknown[],
  options: { includeSkillBridge?: boolean; listingAlias?: string; openOnly?: boolean } = {}
): string {
  const clauses: string[] = [];
  const alias = options.listingAlias ? `${options.listingAlias}.` : "";
  if (options.openOnly) {
    clauses.push(openClause(true, alias));
  }
  if (f.sectors?.length) {
    params.push(f.sectors);
    clauses.push(`${alias}sector = ANY($${params.length})`);
  }
  if (f.employers?.length) {
    params.push(f.employers);
    clauses.push(`COALESCE(${alias}employer_slug, ${alias}company) = ANY($${params.length})`);
  }
  if (f.regions?.length) {
    params.push(f.regions);
    clauses.push(`${alias}region = ANY($${params.length})`);
  }
  if (f.remote) {
    clauses.push(`${alias}is_remote = TRUE`);
  }
  if (f.skillbridge) {
    clauses.push(options.includeSkillBridge ? `sb.skillbridge_status = 'active'` : "FALSE");
  }
  const q = f.q?.trim();
  if (q) {
    params.push(likeLiteral(q));
    const i = params.length;
    clauses.push(
      `(${alias}title ILIKE $${i} ESCAPE '\\' OR ${alias}company ILIKE $${i} ESCAPE '\\' ` +
        `OR COALESCE(${alias}city, '') ILIKE $${i} ESCAPE '\\' ` +
        `OR COALESCE(${alias}field_raw, '') ILIKE $${i} ESCAPE '\\')`
    );
  }
  if (f.city) {
    const sep = f.city.indexOf("|");
    const city = sep === -1 ? f.city : f.city.slice(0, sep);
    const state = sep === -1 ? "" : f.city.slice(sep + 1);
    params.push(city);
    const ci = params.length;
    params.push(state);
    const si = params.length;
    clauses.push(`${alias}city = $${ci} AND ${alias}state = $${si}`);
  }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

/* ------------------------------------------------------------------ *
 * Facets (filter-chip options)
 * ------------------------------------------------------------------ */

export interface DefenseJobFacets {
  sectors: string[];
  /** `key` is COALESCE(employer_slug, company); `name` is the display company. */
  employers: { key: string; name: string; skillBridgeActive: boolean }[];
  regions: string[];
  skillBridgeListings: number;
  /** Total listings in the table (for the "N of M" counter). */
  total: number;
}

async function fetchFacets(): Promise<DefenseJobFacets> {
  const sql = getSql();
  const includeSkillBridge = await hasSkillBridgeColumns();
  const join = skillBridgeJoin(includeSkillBridge);
  const skillBridgeEmployerExpr = includeSkillBridge
    ? "bool_or(sb.skillbridge_status = 'active')"
    : "FALSE";
  const skillBridgeListingExpr = includeSkillBridge
    ? "COUNT(*) FILTER (WHERE sb.skillbridge_status = 'active')::int"
    : "0::int";
  const open = openClause(await hasListingLifecycleColumns(), "j.");
  const [sectorRows, employerRows, regionRows, totalRows] = await Promise.all([
    sql.query(
      `SELECT DISTINCT j.sector FROM defense_job_listings j
        WHERE ${open} AND j.sector IS NOT NULL ORDER BY j.sector`
    ),
    sql.query(
      `SELECT COALESCE(j.employer_slug, j.company) AS key,
              MIN(j.company) AS name,
              ${skillBridgeEmployerExpr} AS skillbridge_active
         FROM defense_job_listings j
         ${join}
        WHERE ${open}
        GROUP BY COALESCE(j.employer_slug, j.company)
        ORDER BY name ASC`
    ),
    sql.query(
      `SELECT DISTINCT j.region FROM defense_job_listings j
        WHERE ${open} AND j.region IS NOT NULL ORDER BY j.region`
    ),
    sql.query(
      `SELECT COUNT(*)::int AS n,
              ${skillBridgeListingExpr}
                AS skillbridge_listings
         FROM defense_job_listings j
         ${join}
        WHERE ${open}`
    ),
  ]);
  return {
    sectors: (sectorRows as Record<string, unknown>[]).map((r) => String(r.sector)),
    employers: (employerRows as Record<string, unknown>[]).map((r) => ({
      key: String(r.key),
      name: String(r.name),
      skillBridgeActive: Boolean(r.skillbridge_active),
    })),
    regions: (regionRows as Record<string, unknown>[]).map((r) => String(r.region)),
    skillBridgeListings: Number(
      (totalRows as Record<string, unknown>[])[0]?.skillbridge_listings ?? 0
    ),
    total: Number((totalRows as Record<string, unknown>[])[0]?.n ?? 0),
  };
}

export const getDefenseJobFacets = unstable_cache(
  async (): Promise<DefenseJobFacets> => {
    try {
      return await fetchFacets();
    } catch (err) {
      if (isMissingTable(err)) {
        return { sectors: [], employers: [], regions: [], skillBridgeListings: 0, total: 0 };
      }
      throw err;
    }
  },
  ["defense-jobs:getDefenseJobFacets"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [DEFENSE_JOBS_TAG] }
);

/* ------------------------------------------------------------------ *
 * Paginated listings
 * ------------------------------------------------------------------ */

export const DEFENSE_JOBS_PAGE_SIZE = 50;

export interface DefenseJobListingsPage {
  listings: DefenseJobListingRow[];
  /** Total rows matching the filter (across all pages). */
  total: number;
}

/**
 * One filtered, ordered, paginated slice of listings. `page` is 1-based. Uses a
 * window `COUNT(*) OVER()` so the total for the current filter comes back in the
 * same round trip.
 */
export async function getDefenseJobListingsPage(
  filter: DefenseJobFilter = {},
  page = 1,
  pageSize = DEFENSE_JOBS_PAGE_SIZE
): Promise<DefenseJobListingsPage> {
  const sql = getSql();
  const includeSkillBridge = await hasSkillBridgeColumns();
  const params: unknown[] = [];
  const where = buildDefenseJobWhere(filter, params, {
    includeSkillBridge,
    listingAlias: "j",
    openOnly: await hasListingLifecycleColumns(),
  });
  const join = skillBridgeJoin(includeSkillBridge);
  const limit = Math.max(1, Math.min(pageSize, 200));
  const offset = Math.max(0, (Math.max(1, page) - 1) * limit);
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;
  try {
    const rows = (await sql.query(
      `SELECT ${listingSelect("j", includeSkillBridge)}, COUNT(*) OVER()::int AS _total
         FROM defense_job_listings j
         ${join}
         ${where}
        ORDER BY j.company ASC, j.title ASC, j.id ASC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )) as Record<string, unknown>[];
    const total = rows.length ? Number(rows[0]._total) : 0;
    return { listings: rows.map(normalizeListingRow), total };
  } catch (err) {
    if (isMissingTable(err)) return { listings: [], total: 0 };
    throw err;
  }
}

/**
 * Cached first page for the unfiltered initial render. The page hits this on
 * every request (force-dynamic), so caching keeps the render a warm read rather
 * than a fresh query. Filtered/paged reads go through the uncached function
 * above (arbitrary args would make cache keys unbounded).
 */
export const getDefenseJobInitialListings = unstable_cache(
  async (): Promise<DefenseJobListingsPage> => getDefenseJobListingsPage({}, 1),
  ["defense-jobs:getDefenseJobInitialListings"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [DEFENSE_JOBS_TAG] }
);

/* ------------------------------------------------------------------ *
 * Map aggregation (city-level rollup of the matching listings)
 * ------------------------------------------------------------------ */

/** A city plotted on the map: total matching listings + per-employer / per-sector breakdown. */
export interface DefenseJobCityPoint {
  key: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  count: number;
  employers: { name: string; count: number }[];
  /** Per-sector listing counts in this city, highest first. */
  sectors: { sector: string; count: number }[];
  /** The single most common sector in this city — drives the color-by-sector map. */
  dominantSector: string;
}

/**
 * City-level GROUP BY of the listings matching `filter`, geocoded only. This is
 * what the map renders — a few hundred rows instead of ~12k. The per-employer
 * breakdown feeds the map popup.
 */
export async function getDefenseJobMapAggregation(
  filter: DefenseJobFilter = {}
): Promise<DefenseJobCityPoint[]> {
  const sql = getSql();
  const includeSkillBridge = await hasSkillBridgeColumns();
  const params: unknown[] = [];
  const where = buildDefenseJobWhere(filter, params, {
    includeSkillBridge,
    listingAlias: "j",
    openOnly: await hasListingLifecycleColumns(),
  });
  const join = skillBridgeJoin(includeSkillBridge);
  const geoClause = where
    ? `${where} AND j.city IS NOT NULL AND j.state IS NOT NULL AND j.latitude IS NOT NULL AND j.longitude IS NOT NULL`
    : `WHERE j.city IS NOT NULL AND j.state IS NOT NULL AND j.latitude IS NOT NULL AND j.longitude IS NOT NULL`;
  // The geo/filter clause (with its `$n` params) is referenced by both CTEs;
  // the params array is built once and positional placeholders reuse it.
  try {
    const rows = (await sql.query(
      `WITH per_emp AS (
         SELECT j.city, j.state, j.company,
                COUNT(*)::int AS c,
                MAX(j.latitude)  AS lat,
                MAX(j.longitude) AS lng
           FROM defense_job_listings j
           ${join}
           ${geoClause}
          GROUP BY j.city, j.state, j.company
       ),
       per_sec AS (
         SELECT j.city, j.state, j.sector, COUNT(*)::int AS c
           FROM defense_job_listings j
           ${join}
           ${geoClause}
          GROUP BY j.city, j.state, j.sector
       ),
       emp AS (
         SELECT city, state,
                MAX(lat) AS lat, MAX(lng) AS lng,
                SUM(c)::int AS count,
                jsonb_agg(
                  jsonb_build_object('name', company, 'count', c)
                  ORDER BY c DESC, company ASC
                ) AS employers
           FROM per_emp
          GROUP BY city, state
       ),
       sec AS (
         SELECT city, state,
                jsonb_agg(
                  jsonb_build_object('sector', sector, 'count', c)
                  ORDER BY c DESC, sector ASC
                ) AS sectors,
                (array_agg(sector ORDER BY c DESC, sector ASC))[1] AS dominant_sector
           FROM per_sec
          GROUP BY city, state
       )
       SELECT emp.city, emp.state,
              emp.lat AS latitude, emp.lng AS longitude,
              emp.count, emp.employers,
              sec.sectors, sec.dominant_sector
         FROM emp
         JOIN sec ON emp.city = sec.city AND emp.state = sec.state
        ORDER BY emp.count DESC, emp.city ASC`,
      params
    )) as Record<string, unknown>[];
    return rows.map((r) => ({
      key: `${String(r.city)}|${String(r.state)}`,
      city: String(r.city),
      state: String(r.state),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      count: Number(r.count),
      employers: (r.employers as { name: string; count: number }[]).map((e) => ({
        name: String(e.name),
        count: Number(e.count),
      })),
      sectors: (r.sectors as { sector: string; count: number }[]).map((s) => ({
        sector: String(s.sector),
        count: Number(s.count),
      })),
      dominantSector: String(r.dominant_sector),
    }));
  } catch (err) {
    if (isMissingTable(err)) return [];
    throw err;
  }
}

/** Cached city aggregation for the unfiltered initial render (see initial-listings note). */
export const getDefenseJobInitialMap = unstable_cache(
  async (): Promise<DefenseJobCityPoint[]> => getDefenseJobMapAggregation({}),
  ["defense-jobs:getDefenseJobInitialMap"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [DEFENSE_JOBS_TAG] }
);

/* ------------------------------------------------------------------ *
 * Whole-table read (retained; the page no longer uses it)
 * ------------------------------------------------------------------ */

async function fetchListings(): Promise<DefenseJobListingRow[]> {
  const sql = getSql();
  const includeSkillBridge = await hasSkillBridgeColumns();
  const rows = await sql.query(
    `SELECT ${listingSelect("j", includeSkillBridge)}
     FROM defense_job_listings j
     ${skillBridgeJoin(includeSkillBridge)}
     WHERE ${openClause(await hasListingLifecycleColumns(), "j.")}
     ORDER BY j.company ASC, j.title ASC`
  );
  return (rows as Record<string, unknown>[]).map(normalizeListingRow);
}

export const getDefenseJobListings = unstable_cache(
  async (): Promise<DefenseJobListingRow[]> => {
    try {
      return await fetchListings();
    } catch (err) {
      if (isMissingTable(err)) return [];
      throw err;
    }
  },
  ["defense-jobs:getDefenseJobListings"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [DEFENSE_JOBS_TAG] }
);

/* ------------------------------------------------------------------ *
 * Aggregate per-city posting counts for tracked defense primes
 * ------------------------------------------------------------------ */

async function fetchEmployerCityCounts(): Promise<DefenseEmployerCityCount[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT e.slug AS employer_slug,
           e.display_name,
           d.city,
           d.state,
           MAX(d.latitude)  AS latitude,
           MAX(d.longitude) AS longitude,
           COALESCE(SUM(d.onsite_posting_count), 0) AS onsite,
           COALESCE(SUM(d.hybrid_posting_count), 0) AS hybrid,
           COALESCE(SUM(d.remote_posting_count), 0) AS remote,
           COALESCE(SUM(d.total_posting_count), 0)  AS total
    FROM defense_employer_locations d
    JOIN defense_employers e ON e.id = d.employer_id
    WHERE e.active
      AND d.latitude IS NOT NULL
      AND d.longitude IS NOT NULL
    GROUP BY e.slug, e.display_name, d.city, d.state
    HAVING COALESCE(SUM(d.total_posting_count), 0) > 0
    ORDER BY e.display_name ASC, d.city ASC`;
  return (rows as Record<string, unknown>[]).map((r) => ({
    employer_slug: String(r.employer_slug),
    display_name: String(r.display_name),
    city: String(r.city),
    state: String(r.state),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    onsite: Number(r.onsite),
    hybrid: Number(r.hybrid),
    remote: Number(r.remote),
    total: Number(r.total),
  }));
}

export const getDefenseEmployerCityCounts = unstable_cache(
  async (): Promise<DefenseEmployerCityCount[]> => {
    try {
      return await fetchEmployerCityCounts();
    } catch (err) {
      if (isMissingTable(err)) return [];
      throw err;
    }
  },
  ["defense-jobs:getDefenseEmployerCityCounts"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [DEFENSE_JOBS_TAG] }
);

/* ------------------------------------------------------------------ *
 * "Who's hiring in <City, ST>?" — a single-city read for the chat tool
 * ------------------------------------------------------------------ */

/** One employer with scraped openings in the city (real listings, apply URLs exist). */
export interface CityHiringEmployer {
  name: string;
  count: number;
}

/** A sample scraped opening in the city — this is the only place URLs may be cited from. */
export interface CityHiringSample {
  company: string;
  title: string;
  sector: string;
  payMin: number | null;
  payMax: number | null;
  payInterval: string | null;
  isRemote: boolean;
  snapshotDate: string | null;
  url: string;
}

export interface CityHiringDatasetSummary {
  /** Open listings that are remote/nationwide and therefore not evidence of a job in this city. */
  remoteListings: number;
  /** Open non-remote listings whose scraped location could not be parsed into city+state. */
  unlocatedListings: number;
  oldestSnapshotDate: string | null;
  newestSnapshotDate: string | null;
}

/**
 * A tracked defense prime for which we hold only an AGGREGATE posting count in
 * this city (defense_employer_locations) — no per-job listing, no apply URL.
 */
export interface CityHiringTrackedEmployer {
  name: string;
  total: number;
  onsite: number;
  hybrid: number;
  remote: number;
}

export interface CityHiringResult {
  /** false only when the job tables aren't loaded yet. */
  ready: boolean;
  /** Whether any listings OR tracked counts were found for the city. */
  matched: boolean;
  city: string | null;
  state: string | null;
  /** Total scraped listings in the city (sum over `employers`). */
  totalListings: number;
  employers: CityHiringEmployer[];
  sectors: { sector: string; count: number }[];
  sampleListings: CityHiringSample[];
  /** Deduped by employer slug against `employers`, so a company is never double-counted. */
  trackedEmployers: CityHiringTrackedEmployer[];
  listingSummary: CityHiringDatasetSummary;
  note: string;
}

/**
 * Answer "who's hiring in <City, ST>?" from our defense/tech job data, combining
 * the two granularities the /defense-jobs page keeps deliberately distinct:
 *   - individual scraped listings (real openings, each with an apply URL), and
 *   - tracked-employer aggregate posting counts (primes we hold only a per-city
 *     total for, no per-job link — the page's dashed "count-only" markers).
 * A tracked employer already represented by scraped listings in this city is
 * dropped (deduped by `employer_slug`), so no company is counted twice.
 *
 * `cityInput` is a single `"City, ST"` string; the state part accepts a USPS code
 * or a full name (both normalized via resolveStateAbbr).
 */
export async function hiringInCity(cityInput: string): Promise<CityHiringResult> {
  const base = (
    note: string,
    city: string | null,
    state: string | null,
    over: Partial<CityHiringResult> = {}
  ): CityHiringResult => ({
    ready: true,
    matched: false,
    city,
    state,
    totalListings: 0,
    employers: [],
    sectors: [],
    sampleListings: [],
    trackedEmployers: [],
    listingSummary: {
      remoteListings: 0,
      unlocatedListings: 0,
      oldestSnapshotDate: null,
      newestSnapshotDate: null,
    },
    note,
    ...over,
  });

  const sep = cityInput.lastIndexOf(",");
  const cityRaw = (sep === -1 ? cityInput : cityInput.slice(0, sep)).trim();
  const stateRaw = sep === -1 ? "" : cityInput.slice(sep + 1).trim();
  const stateAbbr = stateRaw ? resolveStateAbbr(stateRaw) : null;
  if (!cityRaw) return base('Give a city as "City, ST".', null, null);
  if (!stateAbbr) {
    return base(
      'I need a state to tell the city apart — ask for it as "City, ST" (e.g. "Palo Alto, CA").',
      cityRaw,
      null
    );
  }

  const sql = getSql();
  const cityMatch =
    `LOWER(TRIM(city)) = LOWER($1) AND UPPER(TRIM(state)) = UPPER($2) ` +
    `AND ${openClause(await hasListingLifecycleColumns())}`;
  try {
    const open = openClause(await hasListingLifecycleColumns());
    const [empRows, secRows, sampleRows, summaryRows] = await Promise.all([
      sql.query(
        `SELECT company AS name, MAX(employer_slug) AS slug, COUNT(*)::int AS count
           FROM defense_job_listings
          WHERE ${cityMatch}
          GROUP BY company
          ORDER BY count DESC, company ASC`,
        [cityRaw, stateAbbr]
      ),
      sql.query(
        `SELECT sector, COUNT(*)::int AS count
           FROM defense_job_listings
          WHERE ${cityMatch} AND sector IS NOT NULL
          GROUP BY sector
          ORDER BY count DESC, sector ASC`,
        [cityRaw, stateAbbr]
      ),
      sql.query(
        `SELECT company, title, sector, pay_min, pay_max, pay_interval, is_remote, snapshot_date, url
           FROM defense_job_listings
          WHERE ${cityMatch}
          ORDER BY (pay_max IS NULL) ASC, pay_max DESC, company ASC, title ASC
          LIMIT 8`,
        [cityRaw, stateAbbr]
      ),
      sql.query(
        `SELECT
            COUNT(*) FILTER (WHERE is_remote)::int AS remote_listings,
            COUNT(*) FILTER (WHERE NOT is_remote AND (city IS NULL OR state IS NULL))::int AS unlocated_listings,
            MIN(snapshot_date)::text AS oldest_snapshot_date,
            MAX(snapshot_date)::text AS newest_snapshot_date
           FROM defense_job_listings
          WHERE ${open}`
      ),
    ]);

    const empRaw = empRows as Record<string, unknown>[];
    const employers: CityHiringEmployer[] = empRaw.map((r) => ({
      name: String(r.name),
      count: Number(r.count),
    }));
    const listingSlugs = new Set(
      empRaw.map((r) => (r.slug == null ? "" : String(r.slug))).filter(Boolean)
    );
    const totalListings = employers.reduce((sum, e) => sum + e.count, 0);
    const sectors = (secRows as Record<string, unknown>[]).map((r) => ({
      sector: String(r.sector),
      count: Number(r.count),
    }));
    const sampleListings: CityHiringSample[] = (sampleRows as Record<string, unknown>[]).map(
      (r) => ({
        company: String(r.company),
        title: String(r.title),
        sector: String(r.sector),
        payMin: r.pay_min == null ? null : Number(r.pay_min),
        payMax: r.pay_max == null ? null : Number(r.pay_max),
        payInterval: r.pay_interval == null ? null : String(r.pay_interval),
        isRemote: Boolean(r.is_remote),
        snapshotDate:
          r.snapshot_date instanceof Date
            ? r.snapshot_date.toISOString().slice(0, 10)
            : r.snapshot_date == null
              ? null
              : String(r.snapshot_date),
        url: String(r.url),
      })
    );
    const summaryRaw = (summaryRows as Record<string, unknown>[])[0] ?? {};
    const listingSummary: CityHiringDatasetSummary = {
      remoteListings: Number(summaryRaw.remote_listings ?? 0),
      unlocatedListings: Number(summaryRaw.unlocated_listings ?? 0),
      oldestSnapshotDate:
        summaryRaw.oldest_snapshot_date == null ? null : String(summaryRaw.oldest_snapshot_date),
      newestSnapshotDate:
        summaryRaw.newest_snapshot_date == null ? null : String(summaryRaw.newest_snapshot_date),
    };

    // Tracked-employer aggregate counts for this city, minus any employer already
    // represented by scraped listings above (deduped by slug so we never double-count).
    const trackedEmployers: CityHiringTrackedEmployer[] = (await getDefenseEmployerCityCounts())
      .filter(
        (c) =>
          c.city.trim().toLowerCase() === cityRaw.toLowerCase() &&
          c.state.trim().toUpperCase() === stateAbbr.toUpperCase() &&
          !listingSlugs.has(c.employer_slug)
      )
      .map((c) => ({
        name: c.display_name,
        total: c.total,
        onsite: c.onsite,
        hybrid: c.hybrid,
        remote: c.remote,
      }));

    const matched = totalListings > 0 || trackedEmployers.length > 0;
    return base(
      matched
        ? "Listings are real openings with apply links; tracked-employer figures are aggregate posting counts with no per-job link. Remote and unlocated listings are counted separately because they are not evidence of a job in this city."
        : "No defense job listings or tracked-employer postings for that city. Remote and unlocated listings are counted separately because they are not evidence of a job in this city.",
      cityRaw,
      stateAbbr,
      { matched, totalListings, employers, sectors, sampleListings, trackedEmployers, listingSummary }
    );
  } catch (err) {
    if (isMissingTable(err)) {
      return base("Job data isn't loaded yet.", cityRaw, stateAbbr, { ready: false });
    }
    throw err;
  }
}

/**
 * Cached per-city wrapper around `hiringInCity`, keyed by the `"City, ST"` string,
 * for the city detail page's "Defense & Tech Jobs" card. `hiringInCity` already
 * swallows the missing-table error, so this is safe before the job tables load.
 */
export const getCityHiring = (cityInput: string) =>
  unstable_cache(
    () => hiringInCity(cityInput),
    ["defense-jobs:getCityHiring", cityInput],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [DEFENSE_JOBS_TAG] }
  )();
