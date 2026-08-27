/**
 * Completion policy for a curated retirement-city row.
 *
 * A blank is appropriate while research is in progress, but it is not an
 * acceptable completion state for a city import. Keep this policy separate
 * from the importer so it is testable and reusable by verification commands.
 */

import type { GeoType } from "./types";

export type LocationCsvRow = Record<string, string | undefined>;

const MISSING_VALUES = new Set(["", "?", "na", "n/a", "unknown"]);

export type CompletionRequirement = {
  field: string;
  label: string;
  nextAction: string;
};

export const CITY_COMPLETION_REQUIREMENTS = [
  { field: "county", label: "county", nextAction: "source the Census-compatible county name for the city row" },
  { field: "city_politics", label: "city political lean", nextAction: "record the sourced local or county political characterization" },
  { field: "election_2016", label: "2016 presidential winner", nextAction: "source the 2016 county or city election result used for the row" },
  { field: "election_2016_percent", label: "2016 presidential winner share", nextAction: "source the 2016 two-party or documented winner percentage" },
  { field: "election_2024", label: "2024 presidential winner", nextAction: "source the 2024 county or city election result used for the row" },
  { field: "election_2024_percent", label: "2024 presidential winner share", nextAction: "source the 2024 two-party or documented winner percentage" },
  { field: "election_change", label: "election trend summary", nextAction: "derive and document the 2016-to-2024 trend text" },
  { field: "rep_vote_share_change_pp", label: "Republican vote-share change", nextAction: "derive the Republican percentage-point delta from the sourced election returns" },
  { field: "dem_vote_share_change_pp", label: "Democratic vote-share change", nextAction: "derive the Democratic percentage-point delta from the sourced election returns" },
  { field: "population", label: "population", nextAction: "source the city/place population and vintage" },
  { field: "density", label: "population density", nextAction: "source or calculate density from sourced population and land area" },
  { field: "sales_tax", label: "sales tax", nextAction: "source the city or documented combined sales-tax rate" },
  { field: "col_index", label: "cost-of-living index", nextAction: "run import-bea-rpp.ts, then sync-col-index-from-rpp.ts; do not hand-source this field" },
  { field: "avg_home_value", label: "typical home value", nextAction: "source the current ZHVI or documented housing-value source" },
  { field: "has_va", label: "nearby outpatient VA access flag", nextAction: "run sync-va-facilities.ts from the city centroid" },
  { field: "nearest_va", label: "nearest outpatient-capable VA facility", nextAction: "run sync-va-facilities.ts and verify the outpatient facility label" },
  { field: "distance_to_va", label: "nearest outpatient-capable VA distance", nextAction: "run sync-va-facilities.ts; do not guess this distance in the CSV" },
  { field: "nearest_va_hospital", label: "nearest VA medical center", nextAction: "run sync-va-facilities.ts and verify the hospital facility label" },
  { field: "distance_to_va_hospital", label: "nearest VA medical center distance", nextAction: "run sync-va-facilities.ts and verify the hospital distance" },
  { field: "tci", label: "Total Crime Index", nextAction: "source a compatible TCI value or keep the city blocked until the safety methodology is resolved" },
  { field: "crime", label: "crime rating", nextAction: "derive the crime label from the documented safety methodology" },
  { field: "lgbtq_rating", label: "LGBTQ friendliness rating", nextAction: "source the local LGBTQ/community rating or document the not-rated state" },
  { field: "lgbtq_mei_score", label: "HRC MEI score", nextAction: "source the HRC MEI score or record an accepted Not Rated explanation" },
  { field: "lgbtq_score_source", label: "LGBTQ score source", nextAction: "record the score/rating source URL or not-rated source note" },
  { field: "tech_hub", label: "tech hub decision", nextAction: "record an explicit Yes/No tech-hub review decision" },
  { field: "defense_hub_manual", label: "manual defense-hub decision", nextAction: "research and set defense_hub_manual true or false, then run recompute-defense-hub.ts" },
  { field: "defense_hub", label: "derived defense-hub value", nextAction: "run recompute-defense-hub.ts after employer linking and manual curation" },
  { field: "snow_annual", label: "annual snow", nextAction: "source annual snow from NOAA normals or a documented climate source" },
  { field: "rain_annual", label: "annual rainfall", nextAction: "source annual precipitation from NOAA normals or a documented climate source" },
  { field: "sun_days", label: "annual sunny days", nextAction: "source annual sunny-days data or record the weather-card backfill gap" },
  { field: "alw", label: "average winter low", nextAction: "source winter low from NOAA normals" },
  { field: "avg_high_summer", label: "average summer high", nextAction: "source summer high from NOAA normals" },
  { field: "humidity_summer", label: "summer humidity", nextAction: "derive summer humidity from hourly normals or a documented source" },
  { field: "climate", label: "climate summary", nextAction: "record the sourced climate display summary" },
  { field: "climate_category", label: "climate category", nextAction: "run categorize-climate.ts or apply the documented one-city category rule" },
  { field: "gas_price", label: "regular gas price", nextAction: "source a dated geography-compatible AAA or EIA regular-gas price" },
  { field: "description", label: "city description", nextAction: "write sourced city summary copy with explicit caveats" },
  { field: "tags", label: "tags", nextAction: "record a non-empty JSON tag array from the sourced profile" },
  { field: "latitude", label: "latitude", nextAction: "source or derive the city centroid coordinates" },
  { field: "longitude", label: "longitude", nextAction: "source or derive the city centroid coordinates" },
] as const satisfies readonly CompletionRequirement[];

export const LEGACY_CORE_GAP_REQUIREMENTS = CITY_COMPLETION_REQUIREMENTS.filter((requirement) =>
  ["tci", "crime", "gas_price", "defense_hub_manual"].includes(requirement.field)
);

export function completionRequirementFor(field: string): CompletionRequirement {
  return CITY_COMPLETION_REQUIREMENTS.find((requirement) => requirement.field === field) ?? {
    field,
    label: field,
    nextAction: "inspect the relevant importer or verifier and complete the missing post-import step",
  };
}

export function formatCompletionProblem(field: string): string {
  const requirement = completionRequirementFor(field);
  return `${requirement.field} (${requirement.label}) is missing; next: ${requirement.nextAction}`;
}

export function hasCompletionValue(field: string, candidate: unknown): boolean {
  if (candidate === null || candidate === undefined || candidate === "") return false;
  if (field === "tags") return Array.isArray(candidate) && candidate.length > 0;
  return true;
}

export function missingLegacyCoreFields(row: Record<string, unknown>): CompletionRequirement[] {
  return LEGACY_CORE_GAP_REQUIREMENTS.filter((requirement) =>
    !hasCompletionValue(requirement.field, row[requirement.field])
  );
}

function value(row: LocationCsvRow, column: string): string | null {
  const raw = row[column];
  if (raw == null) return null;
  const trimmed = raw.trim();
  return MISSING_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
}

/** CSV columns that must be sourced before a city can be called complete. */
export const REQUIRED_LOCATION_CSV_COLUMNS = [
  "City", "State", "County", "CityPolitics",
  "2016Election", "2016PresidentPercent", "2024 Election", "2024PresidentPercent",
  "ElectionChange", "Population", "Density", "SalesTax", "CostOfLiving",
  "AvgHomeValue", "VA", "NearestVA", "DistanceToVA", "TCI",
  "CrimeRating", "LGBTQ", "LGBTQ_MEI",
  "LGBTQSource", "TechHub", "DefenseHub", "HasWalmart", "HasCostco",
  "Snow", "Rain", "SunnyDays",
  "AverageLowWinter", "AverageHighSummer", "HumiditySummer", "Climate", "Gas",
  "Description", "Tags", "rep_vote_share_change_pp", "dem_vote_share_change_pp",
] as const;

/*
 * A geography below city level is complete on a different set of fields,
 * because most of the city set does not exist at that scale and is resolved at
 * read time instead (lib/geo-inheritance.ts). Requiring the city columns here
 * would reject every neighborhood; requiring nothing would let one in with no
 * identity at all.
 *
 * What is required is what the place must own: where it is, how many people
 * live there, where that number came from, and which boundary drew it.
 */
export const REQUIRED_NEIGHBORHOOD_CSV_COLUMNS = [
  "City", "State", "County", "GeoType", "ParentSlug",
  "Latitude", "Longitude",
  "Population", "PopulationSource", "PopulationVintage", "BoundarySource",
  "Description", "Tags",
] as const;

/** A county or metro exists to be inherited FROM; it needs identity only. */
export const REQUIRED_CONTAINER_CSV_COLUMNS = [
  "City", "State", "GeoType", "Description", "Tags",
] as const;

export const REQUIRED_COLUMNS_BY_GEO_TYPE: Record<GeoType, readonly string[]> = {
  city: REQUIRED_LOCATION_CSV_COLUMNS,
  neighborhood: REQUIRED_NEIGHBORHOOD_CSV_COLUMNS,
  cdp: REQUIRED_NEIGHBORHOOD_CSV_COLUMNS,
  county: REQUIRED_CONTAINER_CSV_COLUMNS,
  metro: REQUIRED_CONTAINER_CSV_COLUMNS,
};

/*
 * A city that exists only as a structural parent -- Los Angeles, so Canoga Park
 * has a municipality to inherit sales tax and RPP from -- is not a curated
 * retirement destination and has no business being held to the curated column
 * set. Demanding a TCI and a crime grade for it would be demanding research
 * nobody will ever read.
 *
 * What it does need is identity, and the values its children will inherit. Those
 * are listed rather than required, because a parent may legitimately lack one
 * and the resolver reports `absent` rather than inventing a number.
 *
 * Description and Tags are NOT required either. They are editorial copy written
 * for a place someone is choosing between, and a non-candidate appears in no
 * listing -- requiring them for the ~400 places that exist only to anchor
 * employer postings would mean writing 400 descriptions nobody reads, and the
 * pressure to generate rather than source them is exactly how invented data
 * gets in. Supplying them is still allowed; Los Angeles has both.
 */
export const REQUIRED_PARENT_CITY_CSV_COLUMNS = [
  "City", "State", "County", "GeoType",
] as const;

/** Columns a parent city supplies to the geographies it contains. */
export const INHERITABLE_PARENT_COLUMNS = [
  "SalesTax", "Climate", "CrimeRating", "TCI", "LGBTQ", "LGBTQ_MEI",
  "2024 Election", "CityPolitics", "Gas",
] as const;

/*
 * Columns the inheritance registry marks "recompute": they are written by
 * scripts/sync-va-facilities.ts from the row's own coordinates. Supplying one
 * by hand for a non-city geography stores a placeholder that is
 * indistinguishable from a researched value, which is the failure the
 * provenance work exists to prevent.
 */
const RECOMPUTED_COLUMNS = ["VA", "NearestVA", "DistanceToVA"] as const;

/*
 * Columns whose value must come with its source. A neighborhood population has
 * no Census Place count behind it -- an ACS tract aggregation and a boundary
 * project are different claims -- so the number alone is not enough.
 */
const PROVENANCE_REQUIRED: Record<string, readonly string[]> = {
  Population: ["PopulationSource", "PopulationVintage"],
};

const BOOLEAN_COLUMNS = ["VA", "TechHub", "DefenseHub", "HasWalmart", "HasCostco"] as const;
const BOOLEAN_VALUES = new Set(["y", "yes", "true", "t", "1", "n", "no", "false", "f", "0"]);
const NOT_RATED_VALUES = new Set(["not rated", "not-rated", "not hrc rated"]);

/** Safety rules cannot be waived by --allow-incomplete. CSV is not a promotion workflow. */
export function locationCsvSafetyProblems(row: LocationCsvRow): string[] {
  const problems: string[] = [];
  const declared = row.GeoType?.trim().toLowerCase() || "city";
  if (!Object.hasOwn(REQUIRED_COLUMNS_BY_GEO_TYPE, declared)) {
    problems.push(`Unrecognized GeoType: ${declared}`);
  }
  const candidate = row.IsCandidate?.trim() || null;
  if (candidate !== null && !BOOLEAN_VALUES.has(candidate.toLowerCase())) {
    problems.push("IsCandidate must be an explicit Yes/No value");
  }
  if (declared !== "city" && isCandidateOf(row, geoTypeOf(row))) {
    problems.push("Non-city candidates require reviewed promotion; CSV import cannot set IsCandidate=Yes");
  }
  return problems;
}

/**
 * Whether the row is a ranked retirement candidate.
 *
 * Defaults to "a city is, anything else is not", which keeps every existing CSV
 * behaving exactly as before. A structural parent must opt out explicitly with
 * `IsCandidate=No` -- silence should not promote a place into /explore.
 */
export function isCandidateOf(row: LocationCsvRow, geoType: GeoType): boolean {
  const raw = value(row, "IsCandidate");
  if (raw === null) return geoType === "city";
  return ["y", "yes", "true", "t", "1"].includes(raw.toLowerCase());
}

/** The declared geo_type, defaulting to city so an existing CSV is unchanged. */
export function geoTypeOf(row: LocationCsvRow): GeoType {
  const raw = (value(row, "GeoType") ?? "city").toLowerCase();
  return raw === "neighborhood" || raw === "cdp" || raw === "county" || raw === "metro"
    ? raw
    : "city";
}

/**
 * Returns user-facing field errors; an empty list means the CSV row is complete.
 *
 * `geoType` defaults to "city", so every existing caller and every existing
 * city CSV behaves exactly as before.
 */
export function locationCsvCompletionProblems(
  row: LocationCsvRow,
  geoType: GeoType = "city",
  isCandidate: boolean = geoType === "city"
): string[] {
  const populationUnavailable = geoType === "neighborhood" && !isCandidate &&
    value(row, "Population") === null && value(row, "PopulationUnavailableReason") !== null;
  const baseRequired =
    geoType === "city" && !isCandidate
      ? REQUIRED_PARENT_CITY_CSV_COLUMNS
      : REQUIRED_COLUMNS_BY_GEO_TYPE[geoType];
  const required: readonly string[] = populationUnavailable
    ? [...baseRequired.filter((column) => !["Population", "PopulationSource", "PopulationVintage"].includes(column)), "ParentSource"]
    : baseRequired;
  const problems = required
    .filter((column) => value(row, column) === null)
    .map((column) => `${column} is blank`);

  if (geoType !== "city") {
    const declared = value(row, "GeoType")?.toLowerCase();
    if (declared && declared !== geoType) {
      problems.push(`GeoType "${declared}" is not a recognized geography type`);
    }
    for (const column of RECOMPUTED_COLUMNS) {
      if (value(row, column) !== null) {
        problems.push(
          `${column} must not be set for a ${geoType}; it is recomputed from coordinates by sync-va-facilities.ts`
        );
      }
    }
  }

  for (const [column, sources] of Object.entries(PROVENANCE_REQUIRED)) {
    if (value(row, column) === null) continue;
    for (const source of sources) {
      if ((baseRequired.includes(source) || geoType !== "city") && value(row, source) === null) {
        problems.push(`${column} is set but ${source} is blank`);
      }
    }
  }

  if (value(row, "Population") !== null && value(row, "PopulationUnavailableReason") !== null) {
    problems.push("Population and PopulationUnavailableReason must not both be set");
  }

  for (const column of BOOLEAN_COLUMNS) {
    const raw = value(row, column);
    if (raw !== null && !BOOLEAN_VALUES.has(raw.toLowerCase())) {
      problems.push(`${column} must be an explicit Yes/No value`);
    }
  }

  const mei = value(row, "LGBTQ_MEI");
  if (mei !== null && !/^\d+$/.test(mei) && !NOT_RATED_VALUES.has(mei.toLowerCase())) {
    problems.push("LGBTQ_MEI must be numeric or Not Rated");
  }

  const tags = value(row, "Tags");
  if (tags !== null) {
    try {
      const parsed = JSON.parse(tags);
      if (!Array.isArray(parsed) || parsed.length === 0) problems.push("Tags must be a non-empty JSON array");
    } catch {
      problems.push("Tags must be a non-empty JSON array");
    }
  }

  return problems;
}
