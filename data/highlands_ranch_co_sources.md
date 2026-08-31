# Highlands Ranch, CO — Data Source Notes

- **City / State / County**: Highlands Ranch, CO (Douglas County)
- **Geography Type**: Census-Designated Place (CDP) / Candidate Location (`geo_type = 'city'`, `is_candidate = true`)
- **Centroid Coordinates**: 39.5539° N, 104.9653° W
- **Research Date**: August 2026

---

## 1. Population & Geography
- **Population**: `105631` (U.S. Census Bureau 2020 Decennial Census count: 105,631)
- **Density**: `4352` people / sq. mi. (Land area: 24.27 sq. mi. Source: U.S. Census Bureau 2020 Gazetteer Files)
- **Source**: U.S. Census Bureau decennial census & ACS 5-year estimates.
- **URL**: https://www.census.gov/quickfacts/fact/table/highlandsranchcdpcolorado/PST045223

## 2. Politics & Election Trends
- **County**: Douglas County, CO
- **2016 Presidential Election (Douglas County)**:
  - Donald Trump (R): 102,573 votes (54.7% total, 59.9% two-party)
  - Hillary Clinton (D): 68,657 votes (36.6% total, 40.1% two-party)
  - Two-Party Total: 171,230 votes
- **2024 Presidential Election (Douglas County)**:
  - Donald Trump (R): 127,451 votes (51.9% total, 53.6% two-party)
  - Kamala Harris (D): 110,408 votes (45.0% total, 46.4% two-party)
  - Two-Party Total: 237,859 votes
- **Trend Calculation**:
  - `rep_vote_share_change_pp`: 53.58% - 59.90% = `-6.3` pp
  - `dem_vote_share_change_pp`: 46.42% - 40.10% = `6.3` pp
  - `ElectionChange`: `6.3 pp more Democratic`
- **CityPolitics**: `Moderately Conservative`
- **Source**: Douglas County Clerk and Recorder Official Election Results & MEDSL.
- **URL**: https://www.douglas.co.us/elections/election-results/

## 3. Housing & Financial
- **AvgHomeValue**: `737138` (Zillow Home Value Index / ZHVI, August 2026 typical home value: $737,138)
- **SalesTax**: `5.0`% (State of Colorado 2.9% + Douglas County 1.0% + RTD 1.0% + SCFD 0.1% = 5.0% combined)
- **CostOfLiving**: `115` (Placeholder header; derived post-import via BEA Regional Price Parities `sync-col-index-from-rpp.ts`)
- **Gas**: `$2.99` (AAA / EIA Denver Metro average regular gas price)
- **Sources**: Zillow Research (ZHVI), Colorado Department of Revenue Sales Tax Locator, AAA Gas Prices.
- **URLs**:
  - https://www.zillow.com/home-values/45744/highlands-ranch-co/
  - https://tax.colorado.gov/how-to-look-up-sales-use-tax-rates

## 4. Safety & Social Policy
- **TCI (Total Crime Index)**: `48` (Violent crime ~52% below national average per FBI UCR / Douglas County Sheriff data; index 100 = US average)
- **CrimeRating**: `Low`
- **LGBTQ / LGBTQ_MEI**: `Not Rated`
- **LGBTQSource**: Unincorporated CDP in Douglas County not evaluated by the Human Rights Campaign Municipal Equality Index (MEI).
- **Sources**: FBI Crime Data Explorer / Douglas County Sheriff's Office Annual Briefings.
- **URL**: https://dcsheriff.net/crime-mapping/

## 5. Economy & Infrastructure
- **TechHub**: `Yes` (Located in the South Denver technology corridor adjacent to DTC, Meridian, and Inverness tech campuses)
- **DefenseHub**: `No` (`defense_hub_manual = false`; while Lockheed Martin Space is nearby in Waterton Canyon/Littleton, Highlands Ranch is primarily a suburban residential community)
- **HasWalmart**: `Yes` (Walmart Supercenter, 6675 Business Center Dr, Highlands Ranch, CO 80130)
- **HasCostco**: `Yes` (Costco Wholesale, 8686 Park Meadows Dr, Lone Tree / Highlands Ranch)
- **VA Access**:
  - `VA`: `Yes`
  - `NearestVA`: `PFC James Miller VA Clinic` (Littleton, CO)
  - `DistanceToVA`: `6 miles`
  - *Note*: Hospital access is provided by Rocky Mountain Regional VA Medical Center in Aurora, CO (~22 miles). Recomputed via `sync-va-facilities.ts`.

## 6. Climate & Weather
- **Snow**: `60` inches / year (NOAA Climate Normals 1991-2020, Centennial Airport / KAPA station)
- **Rain**: `18` inches / year (NOAA Climate Normals)
- **SunnyDays**: `245` days / year (NOAA Denver South / Centennial normals)
- **AverageLowWinter**: `18` °F (January normal low)
- **AverageHighSummer**: `87` °F (July normal high)
- **HumiditySummer**: `38` % (July average relative humidity)
- **Climate**: `Semi-arid`
- **Source**: NOAA NCEI U.S. Climate Normals (Centennial Airport station KAPA).
- **URL**: https://www.ncei.noaa.gov/access/us-climate-normals/

## 7. Description & Tags
- **Description**: Highlands Ranch is a premier master-planned community in Douglas County south of Denver offering extensive trail systems mountain views excellent recreation centers low crime and convenient access to South Denver healthcare and commerce.
- **Tags**: `["Suburban", "Trails", "Golf", "Low Crime", "Family Friendly", "Mountains"]`

---

## Post-Merge Apply Phase Required Commands
When this PR merges to `master`, the single serialized operator should execute the following out-of-band Apply phase commands:

1. `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-csv.ts data/highlands_ranch_co.csv`
2. `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts`
3. `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-bea-rpp.ts`
4. `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-col-index-from-rpp.ts`
5. `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-va-facilities.ts`
6. `node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/derive-structural-features.ts`
7. `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/prepare-map-coordinates.ts`
