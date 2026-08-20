import { unstable_cache } from "next/cache";
import { getSql } from "./db";
import type { MosqueRow } from "./types";

/*
 * Read-only access to `mosques`, sourced from OpenStreetMap by
 * scripts/fetch-mosques-overpass.ts + scripts/import-mosques.ts. Independent
 * of locations_location — see SCHEMA.md "Mosques".
 */
const CACHE_REVALIDATE_SECONDS = 300;
const MOSQUES_TAG = "mosques";

export async function fetchAllMosques(): Promise<MosqueRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, osm_type, osm_id, name, address, city, state,
           latitude, longitude, phone, website, source_url
    FROM mosques
    ORDER BY state ASC NULLS LAST, city ASC NULLS LAST, name ASC NULLS LAST`;
  return (rows as Record<string, unknown>[]).map((r) => ({
    ...r,
    id: Number(r.id),
    osm_id: Number(r.osm_id),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
  })) as MosqueRow[];
}

export const getAllMosques = unstable_cache(
  async (): Promise<MosqueRow[]> => {
    try {
      return await fetchAllMosques();
    } catch (err) {
      // 42P01 = undefined_table: migrate-mosques.ts hasn't run yet.
      if ((err as { code?: string })?.code === "42P01") return [];
      throw err;
    }
  },
  ["mosques:getAllMosques"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [MOSQUES_TAG] }
);
