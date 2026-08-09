# Huntsville, AL gas_price refresh — 2026-08-09

Single-field patch on `locations_location` id 8 (Huntsville, AL). No other
fields touched; applied via a narrowly scoped parameterized UPDATE, not a
CSV import, per `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` -> Import Paths.

## Change

| Field | Before | After |
| --- | --- | --- |
| `gas_price` | `$2.74` | `$3.63` |

## Source

- AAA Gas Prices — State Gas Price Averages: https://gasprices.aaa.com/state-gas-price-averages/
  Alabama regular unleaded average $3.6321/gal, page marked "Price as of 8/9/26". Retrieved 2026-08-09.
- Cross-check: EIA Gasoline and Diesel Fuel Update, https://www.eia.gov/petroleum/gasdiesel/,
  release dated 2026-08-04, Gulf Coast (PADD 3) regular gasoline $3.604/gal as of 2026-08-03.
  Regional, not Alabama-specific, but consistent in magnitude with the AAA figure.

`gas_price` is sourced/normalized at the state level per
`ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` (Taxes and Cost of Living), so the
Alabama statewide average applies. Value formatted to the repo's two-decimal
convention (`$3.63`).
