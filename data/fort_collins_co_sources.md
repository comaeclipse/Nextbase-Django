# Fort Collins, CO Source Notes

This file does not yet document the full row — only the fields researched/corrected so far. See
`data/fort_collins_co_defense_hub_sources.md` for the separate `defense_hub_manual` research
(issue #20).

## col_index correction (issue #49, retrieved 2026-08-11)

The stored `col_index` before this fix was `158`, with no documented source anywhere in `data/` (a
legacy/unsourced row predating the CSV-per-city convention). Issue #49 originally
filed Fort Collins under "model tail limitation" (assuming a 4.1x-median-housing market breaking
the linear decomposition), but `avg_home_value=$569,102` is an exact match to current Zillow ZHVI
(https://www.zillow.com/home-values/4764/fort-collins-co/) and unremarkable for this market
(housing index 152.6) — the input actually driving the plausibility-band failure was the
undocumented `col_index=158` itself, not the housing input.

Cross-check: BEA Regional Price Parities, Fort Collins MSA, all items, 2024: **101.128** (housing
RPP 120.6) — https://fred.stlouisfed.org/series/RPPALL22660. No other independent source for this
city's `col_index` was found on file.

Corrected `col_index` to **101** (BEA RPP, rounded to the nearest integer). `cost_of_living`
recomputed to `Moderate` per `deriveCostOfLiving()` in `scripts/import-csv.ts` (was `High`).

Re-deriving `nonHousingIndex` with `col_index=101` and `avg_home_value=569,102` gives ≈77.9 — inside
the 70-160 plausibility band (it was 160.4, marginally over, before this fix). This is a genuine
data-error case, not a model-tail case: no code or methodology change was needed, only a sourced
replacement for an undocumented number.

Sources:
- BEA Regional Price Parities (FRED), Fort Collins MSA — https://fred.stlouisfed.org/series/RPPALL22660
- Zillow ZHVI, Fort Collins, CO — https://www.zillow.com/home-values/4764/fort-collins-co/
