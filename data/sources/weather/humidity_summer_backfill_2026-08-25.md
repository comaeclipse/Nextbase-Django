# humidity_summer backfill — 2026-08-25 (issue #55)

Fills the 15 `locations_location.humidity_summer` NULLs from already-imported
NOAA 1991–2020 hourly normals (`location_hourly_normals`), matching the Peoria
derivation documented in `data/peoria_il_sources.md`.

## Method

For each city with `humidity_summer IS NULL` and a full July hourly series:

1. Take all 24 July hour rows with non-null `temp_f` and `dew_point_f`.
2. Compute relative humidity with the Magnus–Tetens formula in
   `lib/climate.ts` `relativeHumidity()` (same NWS approximation).
3. Store the **July 24-hour mean RH**, rounded to an integer percent.

Calibration against 40 already-filled cities: July daily-mean RH had the lowest
error vs stored values (median abs error 3 pp). Afternoon-only (hour 15) was a
poor match (~19 pp MAE) because curated values generally track all-day / morning+afternoon
summaries, not the afternoon minimum.

Hourly moisture can come from a nearby airport station (SCHEMA.md). That is the
same trade-off already accepted for the climate dashboard dew-point series.

## Values

See `humidity_summer_backfill_2026-08-25.json`.

| City | State | humidity_summer | Station | climate_category |
| --- | --- | ---: | --- | --- |
| Ashville | OH | 68 | USW00014821 | unchanged (`cold_snowy`) |
| Bellevue | WA | 61 | USW00024234 | unchanged (`mild_coastal`) |
| Boulder | CO | 43 | USW00003017 | unchanged (`cold_snowy`) |
| Broomfield | CO | 43 | USW00003017 | unchanged (`cold_snowy`) |
| Cody | WY | 43 | USW00024033 | unchanged (`cold_snowy`) |
| Goleta | CA | 79 | USW00023190 | unchanged (`mild_coastal`) |
| Lake Forest | CA | 73 | USW00003154 | unchanged (`mild_coastal`) |
| Lexington | MA | 66 | USW00014739 | unchanged (`mild_coastal`) |
| McHenry | MS | 78 | USW00013894 | **`mild_coastal` → `hot_humid`** |
| Morrisville | NC | 72 | USW00013722 | **`mild_coastal` → `hot_humid`** |
| North Kingstown | RI | 70 | USW00014765 | unchanged (`cold_snowy`) |
| Oklahoma City | OK | 62 | USW00013967 | **`mild_coastal` → `hot_humid`** |
| Quincy | MA | 66 | USW00014739 | unchanged (`cold_snowy`) |
| Waltham | MA | 66 | USW00014739 | unchanged (`cold_snowy`) |
| Warren | PA | 76 | USW00004751 | unchanged (`cold_snowy`) |

The three climate flips are expected: with humidity missing, `categorize-climate.ts`
fell through to Rule 4 (`mild_coastal`). Filling humidity lets Rule 3 (`hot_humid`)
fire for those cities. Updates are scoped to these three IDs — not a global recategorize.

## Apply

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-humidity-summer-backfill.ts --dry-run
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-humidity-summer-backfill.ts
```

Production write only after this PR merges (AGENTS.md).

## Out of scope

- `sun_days` (still ~37 NULL on issue #55) — not present in hourly normals; needs a
  separate sunshine / percent-possible-sunshine source.
