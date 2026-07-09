import { unstable_cache } from "next/cache";
import { getSql } from "./db";
import type { LocationRow, StateInfoRow } from "./types";

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

function normalizeLocation(row: Record<string, unknown>): LocationRow {
  return { ...row, id: Number(row.id) } as LocationRow;
}

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
  const rows = await sql`
    SELECT * FROM locations_location
    ORDER BY featured DESC, name ASC`;
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
    const rows = await sql`SELECT * FROM locations_location WHERE id = ${id}`;
    return rows[0] ? normalizeLocation(rows[0] as Record<string, unknown>) : null;
  },
  ["locations:getLocationById"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

/** "More like this" — up to 3 other locations from the same state. */
export const getSimilarLocations = unstable_cache(
  async (state: string, excludeId: number): Promise<LocationRow[]> => {
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM locations_location
      WHERE state = ${state} AND id <> ${excludeId}
      LIMIT 3`;
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
