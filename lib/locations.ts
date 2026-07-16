import { unstable_cache } from "next/cache";
import { getSql } from "./db";
import type { EmployerIndex, EmployerPresence } from "./defense";
import type {
  DefenseEmployerRow,
  HourlyWeatherNormalRow,
  LocationRow,
  StateInfoRow,
  WeatherMonthlyRow,
} from "./types";

/*
 * Read-only data access against the existing Neon schema.
 * `SELECT *` returns rows keyed by the original snake_case column names, which
 * match LocationRow / StateInfoRow exactly.
 *
 * `id` is a Postgres bigint, which the driver returns as a string; we coerce it
 * back to a number so it matches LocationRow and is safe for URLs/keys/equality.
 *
 * All reads are wrapped in `unstable_cache`: this data only changes via the
 * data-maintenance scripts (import-csv, categorize-climate), never per-request,
 * so paying a fresh Neon round trip on every page view / filter click is pure
 * waste. A short revalidate window keeps pages fast while still picking up
 * script-driven updates within a few minutes.
 */
const CACHE_REVALIDATE_SECONDS = 300;
const LOCATIONS_TAG = "locations";
const STATE_INFO_TAG = "state-info";
const EMPLOYERS_TAG = "defense-employers";

function normalizeLocation(row: Record<string, unknown>): LocationRow {
  const pace = row.pace_category;
  return {
    ...row,
    id: Number(row.id),
    pace_category:
      pace === "urban" ||
      pace === "suburban" ||
      pace === "small_town" ||
      pace === "rural"
        ? pace
        : null,
  } as LocationRow;
}

const LOCATION_SELECT = `
  l.*,
  p.category AS pace_category
`;

const LOCATION_FROM = `
  FROM locations_location l
  LEFT JOIN location_pace_current p ON p.location_id = l.id
`;

/*
 * Uncached read. Exported so standalone scripts (scripts/verify_scores.ts) can
 * query outside a Next.js request context — `unstable_cache` throws an
 * "incrementalCache missing" invariant when called from a bare tsx process.
 * Application code should use `getAllLocations` below.
 */
export async function fetchAllLocations(): Promise<LocationRow[]> {
  const sql = getSql();
  // Match Django's Location.Meta.ordering = ['-featured', 'name'] so that the
  // base order is identical. This matters as the stable-sort tie-break when
  // two rows share a sort key (e.g. same-named cities), keeping filter/sort
  // results byte-for-byte with the Django views.
  const rows = await sql.query(
    `SELECT ${LOCATION_SELECT}
     ${LOCATION_FROM}
     ORDER BY l.featured DESC, l.name ASC`
  );
  return (rows as Record<string, unknown>[]).map(normalizeLocation);
}

export const getAllLocations = unstable_cache(
  fetchAllLocations,
  ["locations:getAllLocations"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

export const getLocationById = unstable_cache(
  async (id: number): Promise<LocationRow | null> => {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT ${LOCATION_SELECT}
       ${LOCATION_FROM}
       WHERE l.id = $1`,
      [id]
    );
    return rows[0]
      ? normalizeLocation(rows[0] as Record<string, unknown>)
      : null;
  },
  ["locations:getLocationById"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

/** "More like this" — up to 3 other locations from the same state. */
export const getSimilarLocations = unstable_cache(
  async (state: string, excludeId: number): Promise<LocationRow[]> => {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT ${LOCATION_SELECT}
       ${LOCATION_FROM}
       WHERE l.state = $1 AND l.id <> $2
       LIMIT 3`,
      [state, excludeId]
    );
    return (rows as Record<string, unknown>[]).map(normalizeLocation);
  },
  ["locations:getSimilarLocations"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

export const getAllStateInfo = unstable_cache(
  async (): Promise<StateInfoRow[]> => {
    const sql = getSql();
    const rows = await sql`SELECT * FROM locations_stateinfo`;
    return rows as StateInfoRow[];
  },
  ["locations:getAllStateInfo"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [STATE_INFO_TAG] }
);

export const getStateInfo = unstable_cache(
  async (stateAbbr: string): Promise<StateInfoRow | null> => {
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM locations_stateinfo WHERE state = ${stateAbbr}`;
    return (rows[0] as StateInfoRow) ?? null;
  },
  ["locations:getStateInfo"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [STATE_INFO_TAG] }
);

/**
 * Monthly weather normals for one city, ordered Jan→Dec.
 *
 * Returns `[]` if the `location_weather_monthly` table doesn't exist yet (the
 * migration is additive and may not have been applied), so callers can render
 * an "unavailable" state instead of crashing.
 */
export const getMonthlyWeather = unstable_cache(
  async (locationId: number): Promise<WeatherMonthlyRow[]> => {
    const sql = getSql();
    try {
      const rows = await sql`
        SELECT * FROM location_weather_monthly
        WHERE location_id = ${locationId}
        ORDER BY month ASC`;
      return (rows as Record<string, unknown>[]).map((r) => ({
        ...r,
        id: Number(r.id),
        location_id: Number(r.location_id),
      })) as WeatherMonthlyRow[];
    } catch (err) {
      // 42P01 = undefined_table: table not migrated yet.
      if ((err as { code?: string })?.code === "42P01") return [];
      throw err;
    }
  },
  ["locations:getMonthlyWeather"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

/**
 * Every monthly weather row, sorted by location then month. One query for the
 * whole /weather page; callers group by `location_id`. Returns a flat array
 * (not a Map) because `unstable_cache` serializes results to JSON. Empty if the
 * table isn't migrated yet.
 */
export const getAllMonthlyWeather = unstable_cache(
  async (): Promise<WeatherMonthlyRow[]> => {
    const sql = getSql();
    try {
      const rows = await sql`
        SELECT * FROM location_weather_monthly
        ORDER BY location_id ASC, month ASC`;
      return (rows as Record<string, unknown>[]).map((raw) => ({
        ...raw,
        id: Number(raw.id),
        location_id: Number(raw.location_id),
      })) as WeatherMonthlyRow[];
    } catch (err) {
      if ((err as { code?: string })?.code === "42P01") return [];
      throw err;
    }
  },
  ["locations:getAllMonthlyWeather"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

/**
 * Hourly climate normals for one city: 12 months x 24 hours, ordered
 * month→hour. Backs the moisture charts; see `HourlyWeatherNormalRow` for why
 * temperature still comes from `location_weather_monthly`.
 *
 * Returns `[]` if `location_hourly_normals` isn't migrated yet, matching
 * `getMonthlyWeather`.
 */
export const getHourlyWeatherNormals = unstable_cache(
  async (locationId: number): Promise<HourlyWeatherNormalRow[]> => {
    const sql = getSql();
    try {
      const rows = await sql`
        SELECT * FROM location_hourly_normals
        WHERE location_id = ${locationId}
        ORDER BY month ASC, hour ASC`;
      return (rows as Record<string, unknown>[]).map((r) => ({
        ...r,
        id: Number(r.id),
        location_id: Number(r.location_id),
      })) as HourlyWeatherNormalRow[];
    } catch (err) {
      // 42P01 = undefined_table: table not migrated yet.
      if ((err as { code?: string })?.code === "42P01") return [];
      throw err;
    }
  },
  ["locations:getHourlyWeatherNormals"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

/** Employers offered by the explore filter, ordered for display. */
export const getActiveEmployers = unstable_cache(
  async (): Promise<DefenseEmployerRow[]> => {
    const sql = getSql();
    const rows = await sql`
      SELECT id, slug, display_name, parent_company, sector, counts_as_defense, active
      FROM defense_employers
      WHERE active
      ORDER BY parent_company ASC, display_name ASC`;
    return (rows as Record<string, unknown>[]).map((r) => ({
      ...r,
      id: Number(r.id),
    })) as DefenseEmployerRow[];
  },
  ["locations:getActiveEmployers"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [EMPLOYERS_TAG] }
);

/*
 * location_id -> employers present in that city.
 *
 * Only rows already linked to a curated retirement location are returned; the
 * ~150 other employer cities are irrelevant to filtering. Shipped to the client
 * as a plain object so ExploreClient can filter without a round trip, mirroring
 * how `stateInfos` is passed down.
 */
export const getEmployerIndex = unstable_cache(
  async (): Promise<EmployerIndex> => {
    const sql = getSql();
    const rows = (await sql`
      SELECT
        d.location_id,
        e.slug,
        e.display_name,
        e.parent_company,
        e.counts_as_defense,
        COALESCE(d.onsite_posting_count, 0) AS onsite,
        COALESCE(d.hybrid_posting_count, 0) AS hybrid,
        COALESCE(d.remote_posting_count, 0) AS remote,
        COALESCE(d.total_posting_count, 0)  AS total
      FROM defense_employer_locations d
      JOIN defense_employers e ON e.id = d.employer_id
      WHERE d.location_id IS NOT NULL AND e.active
      ORDER BY d.location_id, COALESCE(d.total_posting_count, 0) DESC, e.display_name`) as Record<
      string,
      unknown
    >[];

    const index: EmployerIndex = {};
    for (const row of rows) {
      const id = Number(row.location_id);
      const presence: EmployerPresence = {
        slug: String(row.slug),
        display_name: String(row.display_name),
        parent_company: String(row.parent_company),
        counts_as_defense: Boolean(row.counts_as_defense),
        onsite: Number(row.onsite),
        hybrid: Number(row.hybrid),
        remote: Number(row.remote),
        total: Number(row.total),
      };
      (index[id] ??= []).push(presence);
    }
    return index;
  },
  ["locations:getEmployerIndex"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [EMPLOYERS_TAG] }
);
