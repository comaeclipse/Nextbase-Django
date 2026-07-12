/*
 * Write helpers for the defense-employer tables. Shared by the CSV importer and
 * the careers-API sync so the two cannot drift.
 *
 * The two upsert paths favor disjoint column sets, and both use COALESCE so
 * neither erases what the other wrote:
 *
 *   upsertSourcedLocation — hand-researched provenance (source_url, is_featured,
 *     notes) plus any *attested* posting counts supplied in the CSV. Counts are
 *     COALESCEd in, so a provenance-only re-import leaves synced counts intact,
 *     and a later automated sync overwrites them. This is how an employer with
 *     no ATS feed (System High) records its onsite openings.
 *   upsertPostingCounts   — automated posting snapshots. Owns the count columns
 *     and never overwrites provenance, so re-syncing RTX cannot erase the
 *     hand-sourced official-location-page rows.
 */
import { getSql } from "../../lib/db";

export interface SourcedLocation {
  employer_slug: string;
  country: string;
  state: string;
  city: string;
  region_label: string;
  location_name: string | null;
  location_type: string | null;
  source_kind: string | null;
  source_url: string | null;
  source_retrieved_on: string | null;
  total_posting_count: number | null;
  /** Attested counts for employers without an ATS sync; NULL leaves any existing value. */
  onsite_posting_count: number | null;
  hybrid_posting_count: number | null;
  remote_posting_count: number | null;
  is_featured: boolean;
  notes: string | null;
}

export interface PostingCounts {
  employer_slug: string;
  country: string;
  state: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  onsite: number;
  hybrid: number;
  remote: number;
  total: number;
  snapshot_date: string;
  source_url: string;
}

export async function getEmployerIdBySlug(): Promise<Map<string, number>> {
  const sql = getSql();
  const rows = (await sql.query(`SELECT id, slug FROM defense_employers`)) as {
    id: string | number;
    slug: string;
  }[];
  return new Map(rows.map((r) => [r.slug, Number(r.id)]));
}

const locKey = (city: string, state: string) =>
  `${city.trim().toLowerCase()}|${state.trim().toUpperCase()}`;

/** (city, state) -> locations_location.id, for the subset that are retirement locations. */
export async function getLocationIdByCityState(): Promise<Map<string, number>> {
  const sql = getSql();
  const rows = (await sql.query(`SELECT id, name, state FROM locations_location`)) as {
    id: string | number;
    name: string;
    state: string;
  }[];
  return new Map(rows.map((r) => [locKey(r.name, r.state), Number(r.id)]));
}

export function resolveLocationId(
  index: Map<string, number>,
  city: string,
  state: string
): number | null {
  return index.get(locKey(city, state)) ?? null;
}

function requireEmployer(employers: Map<string, number>, slug: string): number {
  const id = employers.get(slug);
  if (id === undefined) {
    throw new Error(`Unknown employer slug "${slug}". Seed it in lib/defense.ts and re-run the migration.`);
  }
  return id;
}

/**
 * Hand-researched row. Owns provenance and any attested posting counts supplied
 * in the CSV. Counts are COALESCEd, so a count-less re-import never erases what an
 * automated sync wrote, and vice versa.
 */
export async function upsertSourcedLocation(
  row: SourcedLocation,
  employers: Map<string, number>,
  locations: Map<string, number>
): Promise<void> {
  const sql = getSql();
  await sql.query(
    `INSERT INTO defense_employer_locations (
       employer_id, location_id, country, state, city, region_label,
       location_name, location_type, source_kind, source_url, source_retrieved_on,
       total_posting_count, onsite_posting_count, hybrid_posting_count, remote_posting_count,
       is_featured, notes, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::date,$12,$13,$14,$15,$16,$17, now(), now())
     ON CONFLICT (employer_id, country, state, city, region_label) DO UPDATE SET
       location_id = EXCLUDED.location_id,
       location_name = EXCLUDED.location_name,
       location_type = EXCLUDED.location_type,
       source_kind = EXCLUDED.source_kind,
       source_url = EXCLUDED.source_url,
       source_retrieved_on = EXCLUDED.source_retrieved_on,
       total_posting_count = COALESCE(EXCLUDED.total_posting_count, defense_employer_locations.total_posting_count),
       onsite_posting_count = COALESCE(EXCLUDED.onsite_posting_count, defense_employer_locations.onsite_posting_count),
       hybrid_posting_count = COALESCE(EXCLUDED.hybrid_posting_count, defense_employer_locations.hybrid_posting_count),
       remote_posting_count = COALESCE(EXCLUDED.remote_posting_count, defense_employer_locations.remote_posting_count),
       is_featured = EXCLUDED.is_featured,
       notes = EXCLUDED.notes,
       updated_at = now()`,
    [
      requireEmployer(employers, row.employer_slug),
      resolveLocationId(locations, row.city, row.state),
      row.country,
      row.state,
      row.city,
      row.region_label,
      row.location_name,
      row.location_type,
      row.source_kind,
      row.source_url,
      row.source_retrieved_on,
      row.total_posting_count,
      row.onsite_posting_count,
      row.hybrid_posting_count,
      row.remote_posting_count,
      row.is_featured,
      row.notes,
    ]
  );
}

/**
 * Automated posting snapshot. On conflict it updates ONLY counts, coordinates and
 * snapshot_date — provenance columns (source_url, is_featured, notes) are left as
 * the hand-sourced importer wrote them.
 */
export async function upsertPostingCounts(
  row: PostingCounts,
  employers: Map<string, number>,
  locations: Map<string, number>
): Promise<void> {
  const sql = getSql();
  await sql.query(
    `INSERT INTO defense_employer_locations (
       employer_id, location_id, country, state, city, region_label,
       latitude, longitude,
       onsite_posting_count, hybrid_posting_count, remote_posting_count,
       total_posting_count, snapshot_date,
       source_kind, source_url, source_retrieved_on, is_featured,
       created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,'', $6,$7, $8,$9,$10, $11,$12::date,
               'careers_api', $13, $12::date, false, now(), now())
     ON CONFLICT (employer_id, country, state, city, region_label) DO UPDATE SET
       location_id = EXCLUDED.location_id,
       latitude = COALESCE(EXCLUDED.latitude, defense_employer_locations.latitude),
       longitude = COALESCE(EXCLUDED.longitude, defense_employer_locations.longitude),
       onsite_posting_count = EXCLUDED.onsite_posting_count,
       hybrid_posting_count = EXCLUDED.hybrid_posting_count,
       remote_posting_count = EXCLUDED.remote_posting_count,
       total_posting_count = EXCLUDED.total_posting_count,
       snapshot_date = EXCLUDED.snapshot_date,
       updated_at = now()`,
    [
      requireEmployer(employers, row.employer_slug),
      resolveLocationId(locations, row.city, row.state),
      row.country,
      row.state,
      row.city,
      row.latitude,
      row.longitude,
      row.onsite,
      row.hybrid,
      row.remote,
      row.total,
      row.snapshot_date,
      row.source_url,
    ]
  );
}
