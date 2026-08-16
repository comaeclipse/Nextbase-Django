/**
 * Completion policy for a curated retirement-city row.
 *
 * A blank is appropriate while research is in progress, but it is not an
 * acceptable completion state for a city import. Keep this policy separate
 * from the importer so it is testable and reusable by verification commands.
 */

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

const BOOLEAN_COLUMNS = ["VA", "TechHub", "DefenseHub", "HasWalmart", "HasCostco"] as const;
const BOOLEAN_VALUES = new Set(["y", "yes", "true", "t", "1", "n", "no", "false", "f", "0"]);
const NOT_RATED_VALUES = new Set(["not rated", "not-rated", "not hrc rated"]);

/** Returns user-facing field errors; an empty list means the CSV row is complete. */
export function locationCsvCompletionProblems(row: LocationCsvRow): string[] {
  const problems = REQUIRED_LOCATION_CSV_COLUMNS
    .filter((column) => value(row, column) === null)
    .map((column) => `${column} is blank`);

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
