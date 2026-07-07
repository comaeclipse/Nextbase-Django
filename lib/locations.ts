import { getSql } from "./db";
import type { LocationRow, StateInfoRow } from "./types";

/*
 * Read-only data access against the existing Neon schema.
 * `SELECT *` returns rows keyed by the original snake_case column names, which
 * match LocationRow / StateInfoRow exactly.
 *
 * `id` is a Postgres bigint, which the driver returns as a string; we coerce it
 * back to a number so it matches LocationRow and is safe for URLs/keys/equality.
 */

function normalizeLocation(row: Record<string, unknown>): LocationRow {
  return { ...row, id: Number(row.id) } as LocationRow;
}

export async function getAllLocations(): Promise<LocationRow[]> {
  const sql = getSql();
  // Match Django's Location.Meta.ordering = ['-featured', 'name'] so that the
  // base order is identical. This matters as the stable-sort tie-break when two
  // rows share a sort key (e.g. same-named cities), keeping filter/sort results
  // byte-for-byte with the Django views.
  const rows = await sql`
    SELECT * FROM locations_location
    ORDER BY featured DESC, name ASC`;
  return (rows as Record<string, unknown>[]).map(normalizeLocation);
}

export async function getLocationById(id: number): Promise<LocationRow | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM locations_location WHERE id = ${id}`;
  return rows[0] ? normalizeLocation(rows[0] as Record<string, unknown>) : null;
}

/** "More like this" — up to 3 other locations from the same state. */
export async function getSimilarLocations(
  state: string,
  excludeId: number
): Promise<LocationRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM locations_location
    WHERE state = ${state} AND id <> ${excludeId}
    LIMIT 3`;
  return (rows as Record<string, unknown>[]).map(normalizeLocation);
}

export async function getAllStateInfo(): Promise<StateInfoRow[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM locations_stateinfo`;
  return rows as StateInfoRow[];
}

export async function getStateInfo(
  stateAbbr: string
): Promise<StateInfoRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM locations_stateinfo WHERE state = ${stateAbbr}`;
  return (rows[0] as StateInfoRow) ?? null;
}
