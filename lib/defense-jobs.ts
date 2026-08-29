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
import type { DefenseEmployerCityCount, DefenseJobListingRow } from "./types";

const CACHE_REVALIDATE_SECONDS = 300;
const DEFENSE_JOBS_TAG = "defense-jobs";

/** Columns selected for a listing row, shared by the whole-table and paged reads. */
const LISTING_COLUMNS = `id, company, employer_slug, ats, title, field_raw, sector,
       location_raw, city, state, country, region, is_remote,
       latitude, longitude, employment_type, pay_min, pay_max,
       pay_interval, education, url`;

const isMissingTable = (err: unknown): boolean =>
  (err as { code?: string })?.code === "42P01";

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
function buildWhere(f: DefenseJobFilter, params: unknown[]): string {
  const clauses: string[] = [];
  if (f.sectors?.length) {
    params.push(f.sectors);
    clauses.push(`sector = ANY($${params.length})`);
  }
  if (f.employers?.length) {
    params.push(f.employers);
    clauses.push(`COALESCE(employer_slug, company) = ANY($${params.length})`);
  }
  if (f.regions?.length) {
    params.push(f.regions);
    clauses.push(`region = ANY($${params.length})`);
  }
  if (f.remote) {
    clauses.push(`is_remote = TRUE`);
  }
  const q = f.q?.trim();
  if (q) {
    params.push(likeLiteral(q));
    const i = params.length;
    clauses.push(
      `(title ILIKE $${i} ESCAPE '\\' OR company ILIKE $${i} ESCAPE '\\' ` +
        `OR COALESCE(city, '') ILIKE $${i} ESCAPE '\\' ` +
        `OR COALESCE(field_raw, '') ILIKE $${i} ESCAPE '\\')`
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
    clauses.push(`city = $${ci} AND state = $${si}`);
  }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

/* ------------------------------------------------------------------ *
 * Facets (filter-chip options)
 * ------------------------------------------------------------------ */

export interface DefenseJobFacets {
  sectors: string[];
  /** `key` is COALESCE(employer_slug, company); `name` is the display company. */
  employers: { key: string; name: string }[];
  regions: string[];
  /** Total listings in the table (for the "N of M" counter). */
  total: number;
}

async function fetchFacets(): Promise<DefenseJobFacets> {
  const sql = getSql();
  const [sectorRows, employerRows, regionRows, totalRows] = await Promise.all([
    sql.query(
      `SELECT DISTINCT sector FROM defense_job_listings WHERE sector IS NOT NULL ORDER BY sector`
    ),
    sql.query(
      `SELECT COALESCE(employer_slug, company) AS key, MIN(company) AS name
         FROM defense_job_listings
        GROUP BY COALESCE(employer_slug, company)
        ORDER BY name ASC`
    ),
    sql.query(
      `SELECT DISTINCT region FROM defense_job_listings WHERE region IS NOT NULL ORDER BY region`
    ),
    sql.query(`SELECT COUNT(*)::int AS n FROM defense_job_listings`),
  ]);
  return {
    sectors: (sectorRows as Record<string, unknown>[]).map((r) => String(r.sector)),
    employers: (employerRows as Record<string, unknown>[]).map((r) => ({
      key: String(r.key),
      name: String(r.name),
    })),
    regions: (regionRows as Record<string, unknown>[]).map((r) => String(r.region)),
    total: Number((totalRows as Record<string, unknown>[])[0]?.n ?? 0),
  };
}

export const getDefenseJobFacets = unstable_cache(
  async (): Promise<DefenseJobFacets> => {
    try {
      return await fetchFacets();
    } catch (err) {
      if (isMissingTable(err)) {
        return { sectors: [], employers: [], regions: [], total: 0 };
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
  const params: unknown[] = [];
  const where = buildWhere(filter, params);
  const limit = Math.max(1, Math.min(pageSize, 200));
  const offset = Math.max(0, (Math.max(1, page) - 1) * limit);
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;
  try {
    const rows = (await sql.query(
      `SELECT ${LISTING_COLUMNS}, COUNT(*) OVER()::int AS _total
         FROM defense_job_listings
         ${where}
        ORDER BY company ASC, title ASC, id ASC
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
  const params: unknown[] = [];
  const where = buildWhere(filter, params);
  const geoClause = where
    ? `${where} AND city IS NOT NULL AND state IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL`
    : `WHERE city IS NOT NULL AND state IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL`;
  // The geo/filter clause (with its `$n` params) is referenced by both CTEs;
  // the params array is built once and positional placeholders reuse it.
  try {
    const rows = (await sql.query(
      `WITH per_emp AS (
         SELECT city, state, company,
                COUNT(*)::int AS c,
                MAX(latitude)  AS lat,
                MAX(longitude) AS lng
           FROM defense_job_listings
           ${geoClause}
          GROUP BY city, state, company
       ),
       per_sec AS (
         SELECT city, state, sector, COUNT(*)::int AS c
           FROM defense_job_listings
           ${geoClause}
          GROUP BY city, state, sector
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
  const rows = await sql`
    SELECT id, company, employer_slug, ats, title, field_raw, sector,
           location_raw, city, state, country, region, is_remote,
           latitude, longitude, employment_type, pay_min, pay_max,
           pay_interval, education, url
    FROM defense_job_listings
    ORDER BY company ASC, title ASC`;
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
