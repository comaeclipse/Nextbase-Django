/*
 * "Tell me about <City, ST>" for the chatbot (issue #312, A4): the plain facts
 * already on a `locations_location` row that the other tools only see as 0..1
 * traits -- named VA facilities and their distances, pace, lake/ocean/mountain
 * adjacency, vibes, Walmart/Costco, election results, political lean, the
 * crime index, climate normals, a housing snapshot, and the nearest base.
 *
 * Two honesty rules are encoded in the shape rather than left to the prompt:
 *   - Fields lib/geo-inheritance.ts marks `context_only` (crime, elections,
 *     political lean) describe a wider jurisdiction than the city; they are
 *     grouped under a `contextOnly: true` block with a `scope` note.
 *   - Three-valued booleans (Walmart, Costco, hubs) come back as
 *     "yes" | "no" | "not_recorded", never a null the model could read as "no".
 *
 * Unlike the ranking tools this one also answers for a NON-candidate place
 * (Los Angeles exists so Canoga Park can inherit from it); the result says so
 * via `isCandidate` and a note instead of pretending the place is unknown.
 */
import { getSql } from "../../lib/db";
import { parsePopulation } from "./derive";
import { resolveStateAbbr, STATE_NAME_TO_ABBR } from "../../lib/states";
import { slugForBranch } from "../../lib/military";

export type Flag = "yes" | "no" | "not_recorded";

function flag(v: boolean | null | undefined): Flag {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "not_recorded";
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** "7 miles" / "193 miles" / "<1 miles" -> number. */
export function parseMiles(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s.startsWith("<")) return 0.5;
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export const PACE_LABELS: Record<string, string> = {
  urban: "urban",
  suburban: "suburban",
  small_town: "small town",
  rural: "rural",
};

export const VIBE_LABELS: Record<string, string> = {
  beach_life: "beach life",
  desert_life: "desert life",
  mountain_living: "mountain living",
  southern_living: "southern living",
  lake_living: "lake living",
  great_outdoors: "great outdoors",
  nightlife: "nightlife",
  quiet_retreat: "quiet retreat",
};

export const CLIMATE_CATEGORY_LABELS: Record<string, string> = {
  cold_snowy: "four seasons with real winter",
  hot_humid: "hot and humid summers",
  hot_dry: "hot and dry",
  mild_coastal: "mild coastal",
};

const ABBR_TO_STATE_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_ABBR).map(([name, abbr]) => [abbr, name])
);

/** The raw joined row, as Postgres returns it (bigints and numerics as strings). */
export interface CityFactsRow {
  id: number | string;
  name: string;
  state: string;
  county: string | null;
  geo_type: string;
  is_candidate: boolean;
  description: string | null;
  population: string | null;
  density: number | string | null;
  pace_category: string | null;
  tags: string[] | null;
  vibes: string[] | null;
  near_lake: boolean | null;
  near_ocean: boolean | null;
  near_mountains: boolean | null;
  climate: string | null;
  climate_category: string | null;
  snow_annual: number | string | null;
  rain_annual: number | string | null;
  sun_days: number | string | null;
  alw: number | string | null;
  avg_high_summer: number | string | null;
  has_va: boolean | null;
  nearest_va: string | null;
  distance_to_va: string | null;
  nearest_va_kind: string | null;
  nearest_va_hospital: string | null;
  distance_to_va_hospital: string | null;
  has_walmart: boolean | null;
  has_costco: boolean | null;
  tech_hub: boolean | null;
  defense_hub: boolean | null;
  col_index: number | string | null;
  cost_of_living: string | null;
  avg_home_value: string | number | null;
  entry_home_value: number | string | null;
  median_rent: number | string | null;
  property_tax_rate: string | number | null;
  tci: number | string | null;
  crime: string | null;
  city_politics: string | null;
  election_2016: string | null;
  election_2016_percent: number | string | null;
  election_2024: string | null;
  election_2024_percent: number | string | null;
  election_change: string | null;
  lgbtq_rating: string | null;
  lgbtq_mei_score: number | string | null;
  lgbtq_score_source: string | null;
  lgbtq_state_policy_score: string | number | null;
  marijuana_status: string | null;
  no_income_tax: boolean | null;
  base_command_name: string | null;
  base_service_branch: string | null;
  base_city: string | null;
  base_state: string | null;
  base_distance_miles: number | string | null;
}

export interface CityFacts {
  matched: true;
  city: string;
  stateName: string | null;
  county: string | null;
  geoType: string;
  /** False for a place kept only as a containment parent; never ranked. */
  isCandidate: boolean;
  summary: string | null;
  population: number | null;
  densityPerSqMi: number | null;
  pace: string | null;
  tags: string[];
  vibes: string[];
  geography: { nearLake: Flag; nearOcean: Flag; nearMountains: Flag };
  climate: {
    category: string | null;
    categoryLabel: string | null;
    description: string | null;
    snowInchesPerYear: number | null;
    rainInchesPerYear: number | null;
    sunnyDaysPerYear: number | null;
    avgWinterLowF: number | null;
    avgSummerHighF: number | null;
  };
  va: {
    /** True when an outpatient-capable VA site is within 25 straight-line miles. */
    nearbyAccess: Flag;
    nearestOutpatient: { name: string; miles: number | null; kind: "hospital" | "outpatient" | null } | null;
    nearestMedicalCenter: { name: string; miles: number | null } | null;
  };
  nearestBase: { commandName: string; branch: string; city: string; state: string; miles: number | null } | null;
  retail: { walmart: Flag; costco: Flag };
  hubs: { techHub: Flag; defenseHub: Flag };
  housing: {
    typicalHomeValue: number | null;
    entryHomeValue: number | null;
    medianRent: number | null;
    costOfLivingIndex: number | null;
    costOfLivingLabel: string | null;
    propertyTaxRatePct: number | null;
  };
  safety: {
    contextOnly: true;
    scope: string;
    totalCrimeIndex: number | null;
    label: string | null;
  };
  politics: {
    contextOnly: true;
    scope: string;
    lean: string | null;
    election2016: { winner: string; percent: number | null } | null;
    election2024: { winner: string; percent: number | null } | null;
    shift: string | null;
  };
  lgbtq: { rating: string | null; meiScore: number | null; source: string | null; statePolicyScore: number | null };
  marijuana: string | null;
  /** Verified state fact; the full retired-pay / Social Security rules live in compare_state_veteran_benefits. */
  noStateIncomeTax: Flag;
  notes: string[];
  caveats: string[];
}

export type CityFactsResult =
  | CityFacts
  | { matched: false; status: "ambiguous"; query: string; candidates: string[]; note: string }
  | { matched: false; status: "unknown"; query: string; note: string };

const CITY_FACTS_CAVEATS = [
  "Distances are straight-line miles from the city center, not drive time.",
  "VA nearbyAccess is a 25-mile straight-line gate to an outpatient-capable site; a VA medical center can be much farther (see nearestMedicalCenter).",
  'Crime and election figures are reported for the county or agency jurisdiction, not the city alone (contextOnly) -- always say which.',
  '"not_recorded" means nobody has researched that fact for this place; it is not "no".',
  "Climate figures are long-run normals from the nearest station, which can sit tens of miles away.",
  "The housing snapshot is a typical/entry stock value and a median gross rent, not a quote; the cost tool prices a household.",
];

const SAFETY_SCOPE =
  "Total Crime Index (FBI-derived, national average = 100, lower is safer) for the reporting agency's jurisdiction, which is usually the county or metro -- a citywide or countywide figure, not a neighborhood one.";
const POLITICS_SCOPE =
  "Election results and lean are countywide unless the lean text says city- or precinct-level; a county margin can describe a city badly.";

export function shapeCityFacts(row: CityFactsRow): CityFacts {
  const abbr = resolveStateAbbr(row.state) ?? row.state.trim().toUpperCase();
  const vaKind = row.nearest_va_kind === "hospital" || row.nearest_va_kind === "outpatient" ? row.nearest_va_kind : null;
  const notes: string[] = [];
  if (!row.is_candidate) {
    notes.push(
      `${row.name}, ${abbr} is in the database only as a containing place for its neighborhoods; it is not one of the retirement candidates and never ranks, so most researched fields are empty.`
    );
  }
  if (row.nearest_va_hospital && parseMiles(row.distance_to_va_hospital) !== null && (parseMiles(row.distance_to_va_hospital) ?? 0) > 60) {
    notes.push("The nearest VA medical center is a long way off; routine care would be at the closer clinic, hospital-level care a real trip.");
  }
  const branch = row.base_service_branch;
  const nearestBase =
    row.base_command_name && branch && slugForBranch(branch)
      ? {
          commandName: row.base_command_name,
          branch,
          city: row.base_city ?? "",
          state: row.base_state ?? "",
          miles: num(row.base_distance_miles) === null ? null : Math.round(Number(row.base_distance_miles) * 10) / 10,
        }
      : null;
  const propertyTaxRate = num(row.property_tax_rate);
  return {
    matched: true,
    city: `${row.name}, ${abbr}`,
    stateName: ABBR_TO_STATE_NAME[abbr] ?? null,
    county: row.county,
    geoType: row.geo_type,
    isCandidate: Boolean(row.is_candidate),
    summary: row.description,
    population: row.population === null ? null : parsePopulation(String(row.population)),
    densityPerSqMi: num(row.density),
    pace: row.pace_category ? (PACE_LABELS[row.pace_category] ?? row.pace_category) : null,
    tags: row.tags ?? [],
    vibes: (row.vibes ?? []).map((v) => VIBE_LABELS[v] ?? v),
    geography: { nearLake: flag(row.near_lake), nearOcean: flag(row.near_ocean), nearMountains: flag(row.near_mountains) },
    climate: {
      category: row.climate_category,
      categoryLabel: row.climate_category ? (CLIMATE_CATEGORY_LABELS[row.climate_category] ?? row.climate_category) : null,
      description: row.climate,
      snowInchesPerYear: num(row.snow_annual),
      rainInchesPerYear: num(row.rain_annual),
      sunnyDaysPerYear: num(row.sun_days),
      avgWinterLowF: num(row.alw),
      avgSummerHighF: num(row.avg_high_summer),
    },
    va: {
      nearbyAccess: flag(row.has_va),
      nearestOutpatient: row.nearest_va ? { name: row.nearest_va, miles: parseMiles(row.distance_to_va), kind: vaKind } : null,
      nearestMedicalCenter: row.nearest_va_hospital
        ? { name: row.nearest_va_hospital, miles: parseMiles(row.distance_to_va_hospital) }
        : null,
    },
    nearestBase,
    retail: { walmart: flag(row.has_walmart), costco: flag(row.has_costco) },
    hubs: { techHub: flag(row.tech_hub), defenseHub: flag(row.defense_hub) },
    housing: {
      typicalHomeValue: num(row.avg_home_value) === null ? null : Math.round(Number(row.avg_home_value)),
      entryHomeValue: num(row.entry_home_value),
      medianRent: num(row.median_rent),
      costOfLivingIndex: num(row.col_index),
      costOfLivingLabel: row.cost_of_living,
      propertyTaxRatePct: propertyTaxRate === null ? null : Math.round(propertyTaxRate * 10000) / 100,
    },
    safety: { contextOnly: true, scope: SAFETY_SCOPE, totalCrimeIndex: num(row.tci), label: row.crime },
    politics: {
      contextOnly: true,
      scope: POLITICS_SCOPE,
      lean: row.city_politics,
      election2016: row.election_2016 ? { winner: row.election_2016, percent: num(row.election_2016_percent) } : null,
      election2024: row.election_2024 ? { winner: row.election_2024, percent: num(row.election_2024_percent) } : null,
      shift: row.election_change,
    },
    lgbtq: {
      rating: row.lgbtq_rating,
      meiScore: num(row.lgbtq_mei_score),
      source: row.lgbtq_score_source,
      statePolicyScore: num(row.lgbtq_state_policy_score),
    },
    marijuana: row.marijuana_status,
    noStateIncomeTax: flag(row.no_income_tax),
    notes,
    caveats: CITY_FACTS_CAVEATS,
  };
}

const FACTS_SELECT = `
  SELECT l.id, l.name, l.state, l.county, l.geo_type, l.is_candidate, l.description,
         l.population, l.density, p.category AS pace_category, l.tags, l.vibes,
         l.near_lake, l.near_ocean, l.near_mountains,
         l.climate, l.climate_category, l.snow_annual, l.rain_annual, l.sun_days, l.alw, l.avg_high_summer,
         l.has_va, l.nearest_va, l.distance_to_va, l.nearest_va_kind, l.nearest_va_hospital, l.distance_to_va_hospital,
         l.has_walmart, l.has_costco, l.tech_hub, l.defense_hub,
         l.col_index, l.cost_of_living, l.avg_home_value, l.entry_home_value, l.median_rent, l.property_tax_rate,
         l.tci, l.crime, l.city_politics,
         l.election_2016, l.election_2016_percent, l.election_2024, l.election_2024_percent, l.election_change,
         l.lgbtq_rating, l.lgbtq_mei_score, l.lgbtq_score_source,
         COALESCE(s.lgbtq_state_policy_score, l.lgbtq_state_policy_score) AS lgbtq_state_policy_score,
         COALESCE(s.marijuana_status, l.marijuana_status) AS marijuana_status,
         CASE WHEN s.vet_benefits_verified_on IS NOT NULL THEN s.no_income_tax END AS no_income_tax,
         b.command_name AS base_command_name, b.service_branch AS base_service_branch,
         b.city AS base_city, b.state AS base_state, b.distance_miles AS base_distance_miles
    FROM locations_location l
    LEFT JOIN location_pace_current p ON p.location_id = l.id
    LEFT JOIN locations_stateinfo s ON s.state = l.state
    LEFT JOIN LATERAL (
      SELECT m.command_name, m.service_branch, m.city, m.state, x.distance_miles
        FROM location_military_proximity x
        JOIN military_installations m ON m.id = x.military_installation_id
       WHERE x.location_id = l.id
       ORDER BY x.distance_miles, m.command_name
       LIMIT 1
    ) b ON true
`;

/** "Tell me about <City, ST>" -- one place, plain facts. */
export async function getCityFacts(cityInput: string): Promise<CityFactsResult> {
  const sep = cityInput.lastIndexOf(",");
  const cityRaw = (sep === -1 ? cityInput : cityInput.slice(0, sep)).trim();
  const stateRaw = sep === -1 ? "" : cityInput.slice(sep + 1).trim();
  const stateAbbr = stateRaw ? resolveStateAbbr(stateRaw) : null;
  if (!cityRaw) return { matched: false, status: "unknown", query: cityInput, note: 'Give a city as "City, ST".' };

  const sql = getSql();
  const rows = (await sql.query(
    `${FACTS_SELECT}
     WHERE LOWER(l.name) = LOWER($1) ${stateAbbr ? "AND l.state = $2" : ""}
     ORDER BY l.is_candidate DESC, l.state`,
    stateAbbr ? [cityRaw, stateAbbr] : [cityRaw]
  )) as CityFactsRow[];

  if (rows.length === 0) {
    const label = stateAbbr ? `${cityRaw}, ${stateAbbr}` : cityRaw;
    return { matched: false, status: "unknown", query: cityInput, note: `No place named "${label}" is in this database.` };
  }
  if (rows.length > 1) {
    const candidates = rows.map((r) => `${r.name}, ${resolveStateAbbr(r.state) ?? r.state}`);
    return {
      matched: false,
      status: "ambiguous",
      query: cityInput,
      candidates,
      note: `Several places are named ${cityRaw}; ask which state they mean.`,
    };
  }
  return shapeCityFacts(rows[0]);
}
