/*
 * Derives the categorical `cost_of_living` label ("Low" / "Moderate" / "High")
 * from the numeric `col_index` (100 = US average).
 *
 * Extracted from scripts/import-csv.ts so both the CSV importer's legacy path
 * and scripts/sync-col-index-from-rpp.ts share one implementation. Thresholds
 * are unchanged — lib/scoring.ts's scoreCostOfLiving() falls back to this
 * category when col_index is null, so any change here changes the Fit score.
 */
export function deriveCostOfLivingCategory(colIndex: number | null): string {
  if (colIndex === null) return "Moderate";
  if (colIndex < 95) return "Low";
  if (colIndex <= 115) return "Moderate";
  return "High";
}
