# Historical wildfire-smoke state summaries

`state_historical_smoke_2006_2020.csv` is a small derivative used by the Air Quality page. It is not a live smoke map and it does not measure present-day AQI.

## Sources

- Marissa Childs et al., Stanford ECHO Lab, *Daily local-level estimates of ambient wildfire smoke PM2.5 for the contiguous US* (2006-2020), county-level daily predictions. Download: https://www.stanfordecholab.com/wildfire_smoke
- U.S. Census Bureau, County Population Totals: 2020-2024, `co-est2024-alldata.csv`, using `POPESTIMATE2020` for state population weights. Download: https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/counties/totals/co-est2024-alldata.csv

## Derivation

The Stanford file contains county-day predictions only for smoke days; absent county-days are zero by construction. For each day, county predictions are clipped at zero and population-weighted using 2020 Census county estimates. State-year metrics are the population-weighted daily exposure of residents in that state:

- **Significant smoke days**: days with wildfire-attributable PM2.5 at or above 5 µg/m3.
- **Recurrence**: share of 2006-2020 years with at least five population-weighted significant-smoke days.
- **Annual smoke burden**: mean annual population-weighted sum of daily wildfire-attributable PM2.5, in µg-day/m3.
- **Typical worst day**: median of each year's highest population-weighted daily wildfire PM2.5.
- **Typical smoke season**: the highest-burden month and the following month across the full period.

The source covers the contiguous United States only. Alaska and Hawaii are deliberately shown as unavailable, rather than estimated.

## Rebuild

Download the two inputs above, then run:

```powershell
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/build-historical-smoke.ts `
  --smoke tmp/smoke-county/smokePM2pt5_predictions_daily_county_20060101-20201231.csv `
  --population tmp/co-est2024-alldata.csv
```
