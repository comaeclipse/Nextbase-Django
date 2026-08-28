import { unstable_cache } from "next/cache";
import { getSql } from "./db";
import type {
  EmployerIndex,
  EmployerPresence,
  MetroEmployerIndex,
  MetroEmployment,
} from "./defense";
import {
  resolveLocationFields,
  type GeoNode,
  type ResolvedLocation,
} from "./geo-inheritance";
import {
  buildMilitaryProximityIndex,
  type MilitaryProximityIndex,
} from "./military";
import type {
  AirQualityAnnualRow,
  GeoRelationshipType,
  GeoType,
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
  const geoType = row.bea_geo_type;
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
    goods_rpp: row.goods_rpp == null ? null : Number(row.goods_rpp),
    housing_rpp: row.housing_rpp == null ? null : Number(row.housing_rpp),
    utilities_rpp: row.utilities_rpp == null ? null : Number(row.utilities_rpp),
    other_services_rpp:
      row.other_services_rpp == null ? null : Number(row.other_services_rpp),
    bea_geo_type:
      geoType === "msa" || geoType === "nonmetro_state" ? geoType : null,
    rpp_vintage_year:
      row.rpp_vintage_year == null ? null : Number(row.rpp_vintage_year),
  } as LocationRow;
}

const LOCATION_SELECT = `
  l.*,
  p.category AS pace_category,
  COALESCE(s.state_party, l.state_party) AS state_party,
  COALESCE(s.governor, l.governor) AS governor,
  COALESCE(s.income_tax, l.income_tax) AS income_tax,
  CASE
    WHEN s.vet_benefits_verified_on IS NOT NULL THEN s.vet_benefits_summary
  END AS veterans_benefits,
  COALESCE(s.marijuana_status, l.marijuana_status) AS marijuana_status,
  COALESCE(s.lgbtq_state_policy_score, l.lgbtq_state_policy_score) AS lgbtq_state_policy_score,
  s.retired_pay_tax,
  s.no_income_tax,
  s.ss_tax_treatment,
  s.ss_tax_threshold_single,
  s.ss_tax_threshold_married,
  s.ss_tax_min_age,
  s.ss_tax_age_exempts_fully,
  s.senior_deduction_amount,
  s.senior_deduction_min_age,
  s.senior_deduction_per_qualifying_person,
  rpp.goods_rpp,
  rpp.housing_rpp,
  rpp.utilities_rpp,
  rpp.other_services_rpp,
  rpp.bea_geo_type,
  rpp.bea_geo_code,
  rpp.bea_geo_name,
  rpp.vintage_year AS rpp_vintage_year
`;

/*
 * The locations_stateinfo join denormalizes the two state tax fields onto each
 * location row. Take-home income depends on them (lib/income.ts), and both the
 * explore page and filterAndSort work over LocationRow[] alone — carrying the
 * fields here is far less churn than threading a second table through every
 * filter and scorer for the same result.
 *
 * Both tables key state as the two-letter USPS abbreviation, so this joins
 * directly with no name resolution.
 */
const LOCATION_FROM = `
  FROM locations_location l
  LEFT JOIN location_pace_current p ON p.location_id = l.id
  LEFT JOIN locations_stateinfo s ON s.state = l.state
  LEFT JOIN location_cost_rpp rpp ON rpp.location_id = l.id
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
  //
  // `is_candidate` is the ranking gate for every surface fed by this function
  // (/explore, /quiz, /quiz2, /map, /profile, /weather, /api/locations). It is
  // deliberately not `geo_type = 'city'`: Los Angeles is a city, and it exists
  // only so Canoga Park has a municipality to inherit sales tax and RPP from —
  // ranking it as a retirement destination would be wrong. Neighborhoods sit
  // behind the same gate until their cost, safety and housing data is
  // genuinely neighborhood-scoped rather than inherited.
  const rows = await sql.query(
    `SELECT ${LOCATION_SELECT}
     ${LOCATION_FROM}
     WHERE l.is_candidate
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

/**
 * Every active containing geography of `geoId`, nearest first.
 *
 * Selects each ancestor's OWN columns rather than LOCATION_SELECT's join
 * output, because the resolver reads raw values -- pulling the parent's
 * state-info join here would make a state-owned field look locally inherited.
 *
 * The depth cap matches geo_closure's; scripts/verify-geo-hierarchy.ts is what
 * actually detects a cycle.
 */
export const getLocationAncestry = unstable_cache(
  async (geoId: number): Promise<GeoNode[]> => {
    const sql = getSql();
    const rows = (await sql.query(
      `WITH RECURSIVE chain AS (
         SELECT r.parent_geo_id AS ancestor_id, r.relationship_type, 1 AS depth
         FROM geo_relationships r
         WHERE r.child_geo_id = $1 AND r.valid_to IS NULL
         UNION ALL
         SELECT r.parent_geo_id, r.relationship_type, c.depth + 1
         FROM chain c
         JOIN geo_relationships r
           ON r.child_geo_id = c.ancestor_id AND r.valid_to IS NULL
         WHERE c.depth < 6
       )
       SELECT c.relationship_type, c.depth, l.*
       FROM chain c
       JOIN locations_location l ON l.id = c.ancestor_id
       ORDER BY c.depth ASC, l.name ASC`,
      [geoId]
    )) as Record<string, unknown>[];

    return rows.map((row) => ({
      geo_id: Number(row.id),
      slug: String(row.slug),
      name: String(row.name),
      state: String(row.state),
      geo_type: row.geo_type as GeoType,
      relationship: row.relationship_type as GeoRelationshipType,
      depth: Number(row.depth),
      row: normalizeLocation(row),
    }));
  },
  ["locations:getLocationAncestry"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

/**
 * A location plus its resolved fields and provenance.
 *
 * A curated city has no ancestry, so this costs it exactly one extra query
 * that returns no rows, and the resolver short-circuits.
 */
export async function getResolvedLocation(
  id: number
): Promise<ResolvedLocation | null> {
  const row = await getLocationById(id);
  if (!row) return null;
  if (row.parent_geo_id == null) {
    return { row, resolution: {}, chain: [] };
  }
  return resolveLocationFields(row, await getLocationAncestry(id));
}

/**
 * Walk `id` then its ancestors, returning the first that `load` answers for.
 *
 * Weather normals and EPA air quality are keyed by station and monitor, not by
 * containment: a neighborhood has no rows of its own, and the right answer is
 * the containing city's station rather than a duplicated copy of it. Returns
 * the source geography so the page can say whose station it is.
 */
export async function resolveFromAncestry<T>(
  id: number,
  chain: readonly GeoNode[],
  load: (geoId: number) => Promise<T | null>
): Promise<{ value: T; sourceGeoId: number; sourceLabel: string | null } | null> {
  const direct = await load(id);
  if (direct) return { value: direct, sourceGeoId: id, sourceLabel: null };

  for (const node of chain) {
    const value = await load(node.geo_id);
    if (value) {
      return {
        value,
        sourceGeoId: node.geo_id,
        sourceLabel: `${node.name}, ${node.state}`,
      };
    }
  }
  return null;
}

/** Latest EPA annual AQI summary matched to a location's source geography. */
export const getLatestAirQuality = unstable_cache(
  async (locationId: number): Promise<AirQualityAnnualRow | null> => {
    const sql = getSql();
    try {
      const rows = await sql`
        SELECT * FROM location_air_quality_annual
        WHERE location_id = ${locationId}
        ORDER BY year DESC
        LIMIT 1`;
      return (rows[0] as AirQualityAnnualRow) ?? null;
    } catch (err) {
      if ((err as { code?: string })?.code === "42P01") return null;
      throw err;
    }
  },
  ["locations:getLatestAirQuality"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);

/**
 * "More like this" — up to 3 other locations from the same state.
 *
 * Candidates only: a structural parent like Los Angeles is not somewhere you
 * would relocate to, and a neighborhood would otherwise surface as a peer of
 * the very city that contains it.
 *
 * The ORDER BY is required, not cosmetic. Without it Postgres picks whichever
 * three rows it likes, so the cards under a city page could change between two
 * identical requests. Matching fetchAllLocations' ordering makes the choice
 * deterministic and consistent with every other list in the app.
 */
export const getSimilarLocations = unstable_cache(
  async (state: string, excludeId: number): Promise<LocationRow[]> => {
    const sql = getSql();
    const rows = await sql.query(
      `SELECT ${LOCATION_SELECT}
       ${LOCATION_FROM}
       WHERE l.state = $1 AND l.id <> $2 AND l.is_candidate
       ORDER BY l.featured DESC, l.name ASC
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
    /*
     * Employer presence rolls UP: a facility inside a neighborhood is also
     * employment in the city that contains it, however the job posting spells
     * the location. `self_and_descendants` pairs each geography with itself
     * and everything inside it, so one join covers both. With no containment
     * rows recorded it degenerates to `l.id = l.id` and this is exactly the
     * query it was before.
     *
     * Counts are summed across the group; `member_id <> geo_id` rows are also
     * listed individually so the page can attribute them.
     */
    const rows = (await sql`
      WITH self_and_descendants AS (
        SELECT l.id AS geo_id, l.id AS member_id FROM locations_location l
        UNION
        SELECT c.ancestor_id, c.descendant_id
        FROM geo_closure c
        WHERE c.relationship_type = 'municipal_containment'
      )
      SELECT
        sd.geo_id AS location_id,
        e.slug,
        e.display_name,
        e.parent_company,
        e.counts_as_defense,
        SUM(COALESCE(d.onsite_posting_count, 0))::int AS onsite,
        SUM(COALESCE(d.hybrid_posting_count, 0))::int AS hybrid,
        SUM(COALESCE(d.remote_posting_count, 0))::int AS remote,
        SUM(COALESCE(d.total_posting_count, 0))::int  AS total,
        COALESCE(
          json_agg(
            json_build_object(
              'geo_id', m.id, 'name', m.name, 'state', m.state,
              'onsite', COALESCE(d.onsite_posting_count, 0),
              'hybrid', COALESCE(d.hybrid_posting_count, 0),
              'remote', COALESCE(d.remote_posting_count, 0),
              'total',  COALESCE(d.total_posting_count, 0)
            ) ORDER BY COALESCE(d.total_posting_count, 0) DESC
          ) FILTER (WHERE sd.member_id <> sd.geo_id),
          '[]'::json
        ) AS rolled_up_from
      FROM self_and_descendants sd
      JOIN defense_employer_locations d ON d.location_id = sd.member_id
      JOIN defense_employers e ON e.id = d.employer_id
      JOIN locations_location m ON m.id = sd.member_id
      WHERE e.active
      GROUP BY sd.geo_id, e.slug, e.display_name, e.parent_company, e.counts_as_defense
      ORDER BY sd.geo_id, SUM(COALESCE(d.total_posting_count, 0)) DESC, e.display_name`) as Record<
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
      const rolled = row.rolled_up_from as EmployerPresence["rolled_up_from"];
      // Left undefined rather than [] so the common case serializes unchanged
      // across the server/client boundary.
      if (rolled && rolled.length > 0) presence.rolled_up_from = rolled;
      (index[id] ??= []).push(presence);
    }
    return index;
  },
  ["locations:getEmployerIndex"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [EMPLOYERS_TAG] }
);

/**
 * Defense employment elsewhere in each city's metro.
 *
 * A city sees the facilities of its metro siblings -- the other geographies
 * sharing its CBSA -- with itself and anything inside it excluded, because
 * those are already counted by getEmployerIndex. So Lexington MA sees
 * Tewksbury and Andover; it does not see itself twice.
 *
 * Keyed the same way as getEmployerIndex so a page can read both with one
 * lookup. Cities with no metro membership simply have no entry.
 */
export const getMetroEmployerIndex = unstable_cache(
  async (): Promise<MetroEmployerIndex> => {
    const sql = getSql();
    const rows = (await sql`
      WITH membership AS (
        SELECT r.child_geo_id AS member_id, r.parent_geo_id AS metro_id
        FROM geo_relationships r
        WHERE r.relationship_type = 'metro_membership' AND r.valid_to IS NULL
      ),
      -- Everything a city already counts as its own, so it is not counted twice.
      own AS (
        SELECT l.id AS geo_id, l.id AS member_id FROM locations_location l
        UNION
        SELECT c.ancestor_id, c.descendant_id
        FROM geo_closure c
        WHERE c.relationship_type = 'municipal_containment'
      ),
      siblings AS (
        SELECT me.member_id AS city_id, sib.member_id AS sibling_id, me.metro_id
        FROM membership me
        JOIN membership sib ON sib.metro_id = me.metro_id
        WHERE sib.member_id <> me.member_id
          AND NOT EXISTS (
            SELECT 1 FROM own o
            WHERE o.geo_id = me.member_id AND o.member_id = sib.member_id
          )
      )
      SELECT
        s.city_id,
        m.name AS metro_name,
        e.slug,
        e.display_name,
        e.counts_as_defense,
        SUM(COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0))::int AS onsite_hybrid,
        json_agg(
          json_build_object(
            'name', p.name, 'state', p.state,
            'onsiteHybrid', COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0)
          )
          ORDER BY COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0) DESC
        ) AS places
      FROM siblings s
      JOIN defense_employer_locations d ON d.location_id = s.sibling_id
      JOIN defense_employers e ON e.id = d.employer_id
      JOIN locations_location p ON p.id = s.sibling_id
      JOIN locations_location m ON m.id = s.metro_id
      WHERE e.active
        AND COALESCE(d.onsite_posting_count,0) + COALESCE(d.hybrid_posting_count,0) >= 1
      GROUP BY s.city_id, m.name, e.slug, e.display_name, e.counts_as_defense
      ORDER BY s.city_id, 6 DESC, e.display_name` ) as Record<string, unknown>[];

    const index: MetroEmployerIndex = {};
    for (const row of rows) {
      const id = Number(row.city_id);
      const entry: MetroEmployment =
        (index[id] ??= { metroName: String(row.metro_name), employers: [] });
      entry.employers.push({
        slug: String(row.slug),
        display_name: String(row.display_name),
        counts_as_defense: Boolean(row.counts_as_defense),
        onsiteHybrid: Number(row.onsite_hybrid),
        places: (row.places as MetroEmployment["employers"][number]["places"]) ?? [],
      });
    }
    return index;
  },
  ["locations:getMetroEmployerIndex"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [EMPLOYERS_TAG] }
);

/*
 * location_id -> nearest military installation + nearest per branch.
 *
 * The full city×installation table stays in Neon; this compact index is what
 * Explore filters client-side and what the city page uses for the named-base
 * line. Independent of defense_hub / employer presence.
 */
export const getMilitaryProximityIndex = unstable_cache(
  async (): Promise<MilitaryProximityIndex> => {
    const sql = getSql();
    try {
      const rows = (await sql.query(
        `WITH ranked AS (
           SELECT
             p.location_id,
             p.military_installation_id AS installation_id,
             m.command_name,
             m.service_branch,
             m.city,
             m.state,
             p.distance_miles,
             ROW_NUMBER() OVER (
               PARTITION BY p.location_id
               ORDER BY p.distance_miles, m.command_name
             ) AS nearest_rank,
             ROW_NUMBER() OVER (
               PARTITION BY p.location_id, m.service_branch
               ORDER BY p.distance_miles, m.command_name
             ) AS branch_rank
           FROM location_military_proximity p
           JOIN military_installations m ON m.id = p.military_installation_id
         )
         SELECT *
         FROM ranked
         WHERE nearest_rank = 1 OR branch_rank = 1`
      )) as Record<string, unknown>[];

      return buildMilitaryProximityIndex(
        rows.map((row) => ({
          location_id: Number(row.location_id),
          installation_id: Number(row.installation_id),
          command_name: String(row.command_name),
          service_branch: String(row.service_branch),
          city: String(row.city),
          state: String(row.state),
          distance_miles: Number(row.distance_miles),
          nearest_rank: Number(row.nearest_rank),
          branch_rank: Number(row.branch_rank),
        }))
      );
    } catch (err) {
      // 42P01 = undefined_table: table not migrated yet.
      if ((err as { code?: string })?.code === "42P01") return {};
      throw err;
    }
  },
  ["locations:getMilitaryProximityIndex"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [LOCATIONS_TAG] }
);
