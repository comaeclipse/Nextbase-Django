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
 */
export const REQUIRED_PARENT_CITY_CSV_COLUMNS = [
  "City", "State", "County", "GeoType", "Description", "Tags",
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
  const required =
    geoType === "city" && !isCandidate
      ? REQUIRED_PARENT_CITY_CSV_COLUMNS
      : REQUIRED_COLUMNS_BY_GEO_TYPE[geoType];
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
      if (required.includes(source) && value(row, source) === null) {
        problems.push(`${column} is set but ${source} is blank`);
      }
    }
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
