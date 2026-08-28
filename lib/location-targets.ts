/** Reject misspelled targeting flags rather than accidentally running globally. */
export function parseLocationIds(args: string[], allowedFlags: string[] = ["--dry-run"]): number[] | null {
  let ids: number[] | null = null;
  for (let i = 0; i < args.length; i++) {
    if (allowedFlags.includes(args[i])) continue;
    if (args[i] !== "--ids" || ids !== null) throw new Error(`Unknown or repeated option: ${args[i]}`);
    const raw = args[++i];
    if (!raw || !/^\d+(,\d+)*$/.test(raw)) throw new Error("--ids requires comma-separated positive ids");
    ids = [...new Set(raw.split(",").map(Number))];
    if (ids.some((id) => id <= 0 || !Number.isSafeInteger(id))) throw new Error("Invalid location id");
  }
  return ids;
}

export function assertTargetsExist(ids: number[] | null, found: { id: number | string }[]): void {
  if (!ids) return;
  const missing = ids.filter((id) => !found.some((row) => Number(row.id) === id));
  if (missing.length) throw new Error(`Target ids not found: ${missing.join(", ")}`);
}

/** The identical row predicate is used by military preview and write queries. */
export const MILITARY_TARGET_PREDICATE = `($1::bigint[] IS NOT NULL AND l.id = ANY($1::bigint[]))
  OR ($1::bigint[] IS NULL AND (l.is_candidate OR l.parent_geo_id IS NOT NULL))`;
export const MILITARY_DISTANCE_SQL = `3958.8 * 2 * asin(least(1, sqrt(
  power(sin(radians((m.latitude::float8 - l.latitude::float8) / 2)), 2) +
  cos(radians(l.latitude::float8)) * cos(radians(m.latitude::float8)) *
  power(sin(radians((m.longitude::float8 - l.longitude::float8) / 2)), 2)
)))`;
export const MILITARY_PAIRS_SQL = `SELECT l.id AS location_id, m.id AS military_installation_id,
  round((${MILITARY_DISTANCE_SQL})::numeric, 2) AS distance_miles
  FROM locations_location l CROSS JOIN military_installations m
  WHERE (${MILITARY_TARGET_PREDICATE})
    AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL
    AND m.operational_status = 'active' AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL`;
