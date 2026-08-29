/*
 * Read-only access for the standalone /defense-jobs page.
 *
 * `getDefenseJobListings` reads individual scraped listings (defense_job_listings)
 * — the page's primary content. `getDefenseEmployerCityCounts` reads the aggregate
 * per-city posting counts we already track for defense primes
 * (defense_employer_locations) — used only for the count-only cross-reference
 * markers. The two are deliberately kept separate: one is listing-level (title,
 * pay, apply URL), the other is count-level. Both swallow Postgres 42P01 so the
 * page renders before the migrations/imports have run.
 */
import { unstable_cache } from "next/cache";
import { getSql } from "./db";
import type { DefenseEmployerCityCount, DefenseJobListingRow } from "./types";

const CACHE_REVALIDATE_SECONDS = 300;
const DEFENSE_JOBS_TAG = "defense-jobs";

const isMissingTable = (err: unknown): boolean =>
  (err as { code?: string })?.code === "42P01";

async function fetchListings(): Promise<DefenseJobListingRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, company, employer_slug, ats, title, field_raw, sector,
           location_raw, city, state, country, region, is_remote,
           latitude, longitude, employment_type, pay_min, pay_max,
           pay_interval, education, url
    FROM defense_job_listings
    ORDER BY company ASC, title ASC`;
  return (rows as Record<string, unknown>[]).map((r) => ({
    ...r,
    id: Number(r.id),
    latitude: r.latitude == null ? null : Number(r.latitude),
    longitude: r.longitude == null ? null : Number(r.longitude),
    pay_min: r.pay_min == null ? null : Number(r.pay_min),
    pay_max: r.pay_max == null ? null : Number(r.pay_max),
    is_remote: Boolean(r.is_remote),
  })) as DefenseJobListingRow[];
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
