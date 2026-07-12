# Pace Classification Pipeline Plan

## Summary

Build a reproducible U.S. classifier for the retirement pace around every
location. It will use the surrounding metro experience to produce one of four
labels: `urban`, `suburban`, `small_town`, or `rural`.

The system will backfill all existing locations, classify future imports, keep
the source evidence and model history in Neon, surface the current approved
label in Explore and both quizzes, and route only ambiguous results to review.

## Data and Persistence

- Create a separate, immutable `location_pace_classifications` history table.
  Each run records the location ID; scope (`cbsa` or non-metro place fallback);
  Census geography IDs; input values; source versions and checksums; score;
  candidate; confidence; review state; optional reviewer override/reason;
  algorithm version; and timestamps.
- Create `location_pace_current`, a view that returns the latest approved
  override or auto-approved result per location. Application reads join this
  view; `locations_location` remains unchanged.
- Use fixed RUCA 2020 and EPA 2021 source snapshots, cached locally with a
  committed source manifest. Census geography lookups are live, but the request,
  returned geography IDs, and Census vintage are stored with the run.
- Resolve a named location to its Census-based CBSA and classify the metro
  experience. If no CBSA applies, classify the named Census place boundary.

## Classification Algorithm

Aggregate each source measure population-weightedly over the chosen CBSA or
place geography. Normalize density, urban-area population, employment density,
and built-form metrics as national percentiles from the fixed snapshots; apply
`log1p` to density/population measures and winsorize at the first and 99th
percentiles.

Score the result on a 0-100 urbanicity scale:

- RUCA primary class: 35%
- Population-weighted density: 25%
- Largest connected urban-area population: 15%
- Employment density: 10%
- Built form: 15% (Walkability Index 10%, pedestrian intersection density 5%)

Map RUCA primary classes to their input scores as follows:

| RUCA class | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Score | 100 | 85 | 75 | 60 | 50 | 45 | 35 | 30 | 15 | 5 |

Assign categories by total score:

- `rural`: under 25
- `small_town`: 25 to under 50
- `suburban`: 50 to under 75
- `urban`: 75 or above

Auto-approve only complete runs that are at least 10 points from a category
boundary and whose RUCA band is no more than one category away. Queue missing
data, close-boundary, or materially conflicting results for review. Preserve an
approved manual override during later reruns.

## Product and Workflow

- Replace the density-only `lifestyle` predicate with the approved current pace
  category. Keep existing `urban`, `suburban`, and `rural` query values; add
  `small_town`.
- Add Small Town to Explore and both quiz lifestyle controls.
- Add scripts to migrate the schema, prepare source data, and classify one,
  several, or all locations. The classifier supports `--dry-run`.
- Have CSV import invoke classification for affected rows. If a source-backed
  result cannot be produced, keep the city import and create a review item;
  never silently fall back to the legacy density rule.
- Replace the temporary `pace:*`-tag requirement in
  `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` with the classifier workflow and its
  verification queries.

## Verification and Rollout

- Unit-test normalization, RUCA mapping, scoring thresholds, review criteria,
  override precedence, and legacy filter-query compatibility.
- Add integration fixtures for Paterson (Urban), King of Prussia (Suburban),
  Jamestown (Small Town), Malabar (Rural), a non-CBSA fallback, and a
  low-confidence review case.
- Run a full dry-run against the current locations; review every queued result;
  publish approved classifications; then verify every location has either a
  current category or an explicit review item.
- Confirm Explore, API, and both quizzes apply the same classification results;
  confirm no user-facing filter still relies on the legacy density cutoffs.
- Run `npx tsc --noEmit` and `npm run build` before release.

## Source References

- USDA Economic Research Service, Rural-Urban Commuting Area Codes:
  <https://www.ers.usda.gov/data-products/rural-urban-commuting-area-codes>
- U.S. EPA, Smart Location Mapping:
  <https://www.epa.gov/smartgrowth/smart-location-mapping>
- U.S. EPA, National Walkability Index service:
  <https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer>
