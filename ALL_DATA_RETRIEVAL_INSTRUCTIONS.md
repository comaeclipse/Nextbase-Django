# VetRetire Full Data Retrieval Instructions

Use this guide when an LLM or operator needs to refresh or expand the VetRetire data set. This is broader than `STATE_LAW_DATA_INSTRUCTIONS.md`: it covers both `Location` and `StateInfo` data.

## Scope

The project stores two main Neon PostgreSQL tables:

- `locations_location`: city/metro retirement-location facts used by the public explore UI.
- `locations_stateinfo`: state-level gun-law and scorecard facts used by filters and admin views.

The application was migrated from Django to Next.js + TypeScript in 2026. Django management commands shown in older notes are historical only; use the TypeScript scripts and Neon workflow documented below.

Treat the current Neon database as the working state, but do not assume it is complete or current. Always inspect it before importing.

## Current Known Gaps

Coverage changes with every import. Do not rely on historical row counts or static gap lists; run the inspection query below before each refresh. Prioritize missing `tags`, `tci`, `description`, VA access, veterans benefits, LGBTQ fields, election-trend deltas, hub flags, and climate category when they are blank in the live database.

Do not fill gaps with guesses. If a source is weak, leave the field blank and record the gap.

## Inspect Current Data

Choose the local environment file without printing secrets. Prefer `.env`; use `.env.vercel` only when it is the available local Neon configuration:

```powershell
$envFile = if (Test-Path .env) { '.env' } elseif (Test-Path .env.vercel) { '.env.vercel' } else { throw 'DATABASE_URL env file not found' }
```

Summarize row and selected missing-field coverage directly from Neon:

```powershell
$script = @'
const { neon } = require(`@neondatabase/serverless`);
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const [coverage] = await sql`
    SELECT count(*)::int AS locations,
      count(*) FILTER (WHERE tags IS NULL OR tags = '[]'::jsonb)::int AS missing_tags,
      count(*) FILTER (WHERE tci IS NULL)::int AS missing_tci,
      count(*) FILTER (WHERE description IS NULL OR description = '')::int AS missing_description,
      count(*) FILTER (WHERE nearest_va IS NULL OR distance_to_va IS NULL)::int AS missing_va_access,
      count(*) FILTER (WHERE rep_vote_share_change_pp IS NULL OR dem_vote_share_change_pp IS NULL)::int AS missing_election_trends
    FROM locations_location`;
  const [stateInfo] = await sql`SELECT count(*)::int AS state_info FROM locations_stateinfo`;
  console.log({ ...coverage, ...stateInfo });
})().catch((error) => { console.error(error); process.exit(1); });
'@
node "--env-file=$envFile" -e $script
```

Dump the current location keys before matching imports:

```powershell
$script = @'
const { neon } = require(`@neondatabase/serverless`);
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const rows = await sql`SELECT state, name, county FROM locations_location ORDER BY state, name`;
  for (const row of rows) console.log(`${row.state}|${row.name}|${row.county ?? ''}`);
})().catch((error) => { console.error(error); process.exit(1); });
'@
node "--env-file=$envFile" -e $script
```

## Source Priority

Prefer official, downloadable, documented, or API-backed sources. Avoid copying from arbitrary summary pages when primary data exists.

Use this priority order:

1. Official federal/state/local datasets or APIs.
2. Established institutional data products with downloadable files and documented definitions.
3. Reputable policy databases when official consolidated data is impractical.
4. Manual research only for narrative fields, with source URLs recorded.

Do not use generated text as a factual source. Use an LLM to plan extraction, normalize values, and summarize source text, but verify facts against source pages or downloaded data.

## Field Source Map

### Identity and Geography

Fields:

- `name`
- `state`
- `county`
- `population_raw`
- `population`
- `density`

Recommended sources:

- U.S. Census ACS 5-year API: https://www.census.gov/data/developers/data-sets/acs-5year.html
- Census metro/micro population tables: https://www.census.gov/data/tables/time-series/demo/popest/2020s-total-metro-and-micro-statistical-areas.html

Retrieval notes:

- Decide whether each row represents a city/place, county, or metro area before fetching data.
- If the app row is a city but current data is a metro population, document that choice.
- For city/place populations, use Census place geographies.
- For metro populations, use CBSA/MSA geographies.
- For county-level political/election joins, store county consistently with Census county names.

Normalization:

- `state`: two-letter postal abbreviation.
- `county`: county name without "County" unless existing rows use otherwise.
- `population_raw`: comma-formatted source population.
- `population`: short display string only if needed by UI. Use values like `545k` or `1.2M`.
- `density`: source density if available, otherwise calculate population divided by land area and document the method.

### Housing

Fields:

- `avg_home_value`
- `avg_home_value_display`
- `avg_price`

Recommended sources:

- Zillow Research data downloads: https://www.zillow.com/research/data/
- Zillow ZHVI user guide: https://www.zillow.com/research/zhvi-user-guide/
- Zillow public data/API overview: https://www.zillowgroup.com/developers/api/public-data/real-estate-metrics/

Retrieval notes:

- Prefer Zillow Home Value Index (ZHVI), "all homes", mid-tier, smoothed/seasonally adjusted where available.
- Match geography by city, county, or metro based on the row's intended geography.
- Do not call ZHVI an average or median in documentation; it is a typical home value. The current model field name is `avg_home_value`, but source note should say ZHVI.

Normalization:

- `avg_home_value`: numeric decimal dollars, no commas or dollar sign.
- `avg_home_value_display`: compact display, e.g. `$385k`.
- `avg_price`: keep in sync with `avg_home_value_display` unless the product intentionally distinguishes them.

### Taxes and Cost of Living

Fields:

- `sales_tax`
- `income_tax`
- `col_index`
- `cost_of_living`
- `gas_price`

Recommended sources:

- Tax Foundation state tax data: https://taxfoundation.org/data/state-tax/
- Tax Foundation sales tax updates: https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/
- Tax Foundation state tax competitiveness/index data: https://taxfoundation.org/research/all/state/2026-state-tax-competitiveness-index/
- AAA gas prices or EIA retail gasoline data for current gas prices.

Retrieval notes:

- `sales_tax` can be state-only, combined state/local average, or city-specific. Choose one convention and apply it consistently.
- `income_tax` should represent top marginal state individual income tax unless the product chooses another definition.
- `col_index` needs a consistent source. If no licensed cost-of-living source is available, use a documented proxy and do not overstate it.

Normalization:

- `sales_tax` and `income_tax`: decimal percent values such as `6.25`, not `0.0625`.
- `col_index`: integer where 100 means U.S. average.
- `cost_of_living`: derive from `col_index`: `Low` under 95, `Moderate` 95-115, `High` over 115 unless product rules say otherwise.
- `gas_price`: formatted text like `$3.19`.

### Veterans Affairs

Fields:

- `has_va`
- `nearest_va`
- `distance_to_va`
- `va_distance`
- `veterans_benefits`

Recommended sources:

- VA Facilities API: https://developer.va.gov/explore/api/va-facilities
- VA Facilities data.gov catalog: https://catalog.data.gov/dataset/va-facilities-api
- VA location search: https://www.va.gov/directory/guide/Findlocations.cfm
- State veterans affairs agency pages for benefits.

Retrieval notes:

- For every location, geocode the city/metro centroid or representative city hall coordinate.
- Query VA facilities by latitude/longitude and filter for medical facilities first.
- Compute straight-line or driving distance consistently; label which method was used.
- `has_va` should be `Yes` if a relevant VA health facility is in the same city/metro or within the chosen threshold.
- If no local VA exists, store the nearest facility name and distance.

Normalization:

- `has_va`: `Yes` or `No`.
- `nearest_va`: facility name/city, not a prose sentence.
- `distance_to_va`: text like `24 miles`.
- `va_distance`: keep in sync with `distance_to_va` for UI compatibility.
- `veterans_benefits`: short state-specific benefit summary; include tax breaks, retirement pay exemptions, property tax benefits, education, and state veteran homes when applicable.

### Weather and Climate

Fields:

- `snow_annual`
- `rain_annual`
- `sun_days`
- `alw` (CSV: `AverageLowWinter`)
- `avg_high_summer`
- `humidity_summer`
- `climate`
- `climate_detailed`
- `climate_category`

Recommended sources:

- NOAA/NCEI U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- NOAA Climate Normals Quick Access: https://www.ncei.noaa.gov/access/us-climate-normals/
- NOAA Climate Data Online: https://www.ncei.noaa.gov/cdo-web/
- NOAA Climate Normals open data: https://registry.opendata.aws/noaa-climate-normals/

Retrieval notes:

- Use 1991-2020 normals unless NOAA publishes a newer official normals period.
- Choose the nearest representative station to the city/metro.
- Prefer annual normals for precipitation/snow and monthly normals for winter low / summer high / July humidity.
- `sun_days` may require a different source or proxy. If unavailable from NOAA normals, document the secondary source.

Normalization:

- `snow_annual`, `rain_annual`, `sun_days`, `alw` (CSV: `AverageLowWinter`), `avg_high_summer`, `humidity_summer`: integers.
- `climate_detailed`: source climate description.
- `climate`: short display label.
- `climate_category`: run the TypeScript categorizer after a batch weather update. It currently rewrites all rows, so do not use it for a one-city update unless a global recategorization is intended.

### Politics and Elections

This category is mission-critical. Retirement location choice is strongly affected by political culture, community norms, church/community affiliation, personal preference, social acceptance, and local governance. Do not treat these fields as optional decoration. If they cannot be sourced confidently, mark them as gaps rather than filling vague or guessed labels.

Fields:

- `state_party`
- `governor`
- `city_politics`
- `election_2016`
- `election_2016_percent`
- `election_2024`
- `election_2024_percent`
- `election_change`
- `rep_vote_share_change_pp`
- `dem_vote_share_change_pp`

Recommended sources:

- MIT Election Data and Science Lab: https://electionlab.mit.edu/data
- MEDSL GitHub repositories: https://github.com/MEDSL
- State election offices for official county-level results.
- County election offices for official county and precinct-level returns.
- City election offices for municipal results where available.
- Ballotpedia can be used for a secondary cross-check, not as the sole source when official/MEDSL data exists.
- For city-level political culture, use precinct-level presidential results, municipal election results, voter registration by party where available, and local officeholder composition. Avoid unsourced media stereotypes.

Retrieval notes:

- The existing schema expects county-level presidential election results for most rows.
- Join each location to its county, then pull 2016 and 2024 presidential county returns.
- If the city is much more politically distinct than its county, retrieve precinct-level or city-level results. Examples include central cities inside otherwise suburban/rural counties, college towns, military towns, and small enclaves near large metros.
- Calculate candidate winner and winner percentage from total two-party or total votes; choose one denominator and document it. Prefer two-party vote share for trend math because it compares partisan movement more cleanly across cycles.
- `state_party` and `governor` should be current and must be rechecked because offices change.
- Do not infer `city_politics` from state-level results. City culture must be city, precinct, municipal, or at worst county evidence.
- When exact city-level 2024 data is not feasible, store the best sourced county-level fields and mark `city_politics` with a qualifier such as `County-level: Conservative` or leave it blank for later research.
- Preserve source URLs, election vintage, geography used, and denominator used in a companion notes file or import log.

Trend calculation requirements:

- Required baseline: 2016 presidential result for the location's county or city.
- Required endpoint: 2024 presidential result for the same geography.
- Preferred denominator: two-party vote share, calculated as candidate_votes / (dem_votes + rep_votes).
- `rep_vote_share_change_pp` = Republican 2024 two-party share minus Republican 2016 two-party share.
- `dem_vote_share_change_pp` = Democratic 2024 two-party share minus Democratic 2016 two-party share.
- These two values should usually be near opposites. If they are not, check whether third-party-inclusive percentages were mixed with two-party percentages.
- `election_change` should summarize direction and magnitude, e.g. `6.4 pp more Republican since 2016`, `3.1 pp more Democratic since 2016`, or `Essentially unchanged since 2016`.

`city_politics` classification:

- Use a consistent label vocabulary so the UI can filter and compare locations.
- Recommended labels:
  - `Strongly Conservative`
  - `Conservative`
  - `Moderately Conservative`
  - `Mixed / Swing`
  - `Moderately Liberal`
  - `Liberal`
  - `Strongly Liberal`
- Add a qualifier in the value only when the source geography is not the city itself, e.g. `County-level: Conservative`.
- Suggested two-party vote-share thresholds:
  - 65%+ Republican: `Strongly Conservative`
  - 55-64.9% Republican: `Conservative`
  - 51-54.9% Republican: `Moderately Conservative`
  - 49-51% either party or frequent flips: `Mixed / Swing`
  - 51-54.9% Democratic: `Moderately Liberal`
  - 55-64.9% Democratic: `Liberal`
  - 65%+ Democratic: `Strongly Liberal`
- Override threshold labels only with documented local evidence, such as officially nonpartisan but consistently one-party municipal government, college-town enclave behavior, or precinct-level city results that diverge from county results.
- Avoid loaded language. These labels are descriptive geography metadata, not value judgments.

Normalization:

- `state_party`: `R` or `D` based on current state-level partisan control definition chosen by product. If using governor party, do not duplicate it as state control without explanation.
- `governor`: `R`, `D`, or other current party.
- `election_2016` / `election_2024`: winner surname or party label, consistently.
- `election_2016_percent` / `election_2024_percent`: integer percent for the winning candidate using the documented denominator.
- `rep_vote_share_change_pp`: 2024 Republican vote share minus 2016 Republican vote share.
- `dem_vote_share_change_pp`: 2024 Democratic vote share minus 2016 Democratic vote share.
- `election_change`: concise text like `5 pp more Republican`.

### Safety and Social Policy

Fields:

- `tci`
- `crime`
- `marijuana_status`
- `lgbtq_rating`

Recommended sources:

- FBI Crime Data API/data downloads for crime counts.
- Census population denominators for rates.
- Local police department annual reports, crime dashboards, or official press releases for recent trend context and city-specific validation.
- NeighborhoodScout crime pages can be used as a secondary cross-check for FBI-based rates and local comparisons, but treat their indices and modeled analytics as proprietary unless licensing allows reuse.
- Niche crime/safety pages can be used as a secondary quick-check for public-facing crime-rate comparisons and resident sentiment, but do not use Niche grades or survey results as canonical crime values.
- State marijuana policy sources, state statutes, or established policy trackers.
- Movement Advancement Project: https://www.lgbtmap.org/
- Human Rights Campaign Municipal Equality Index for city-level LGBTQ scores where available.

Retrieval notes:

- `tci` needs a defined methodology. Do not mix proprietary "crime index" values from consumer websites unless licensing allows reuse.
- A feasible open method is: calculate violent crime rate per 100,000 and index it to U.S. average = 100.
- `crime` can be a derived label from `tci`.
- For cities with official recent crime briefings, record the source year and use them to annotate trend context, such as violent crime down year over year, property crime down year over year, or lowest level in a defined period.
- If official local data and FBI/third-party annual data disagree, prefer the official local source for the latest trend narrative and the FBI/open-data source for normalized cross-city comparisons. Document both vintages.
- For Virginia Beach specifically, useful crime/safety cross-check sources include the VBPD 2025 crime briefing, NeighborhoodScout Virginia Beach crime page, and Niche Virginia Beach crime/safety page.
- `lgbtq_rating` should be numeric if using MEI scores; otherwise store concise text and document source.

Normalization:

- `tci`: integer, lower is safer if using current app convention.
- `crime`: short category such as `Low`, `Moderate`, `High`.
- `marijuana_status`: `Recreational`, `Medical`, `Decriminalized`, or `Illegal`.
- `lgbtq_rating`: numeric text or source label.

### Economic Hubs and Lifestyle Tags

Fields:

- `tech_hub`
- `defense_hub`
- `tags`
- `description`

Recommended sources:

- Bureau of Labor Statistics occupational/employment data for tech employment.
- Department of Defense installation lists and military base directories.
- Local economic development pages for major industry clusters.
- Official tourism/city pages for activity tags.
- National Park Service, state parks, golf course datasets, coastline/water access, trail databases, and arts/culture listings for tags.

Retrieval notes:

- Use `Y` / `N` for `tech_hub` and `defense_hub`.
- `tags` should be a JSON list of 3-8 short terms used by filters and cards.
- Avoid marketing fluff in `description`; write a short factual retirement-oriented summary from sourced facts.

Normalization:

- `tags`: JSON array, e.g. `["Golf", "Fishing", "Low Taxes"]`.
- `description`: 1-3 sentences.
- Keep tag vocabulary consistent so filters work: `Golf`, `Fishing`, `Hiking`, `Arts`, `Culture`, `Beaches`, `Mountains`, `Military`, `Low Taxes`, `Healthcare`.

### State Law Data

Fields:

- `magazine_limit`
- `gifford_score`
- `ghost_gun_ban`
- `assault_weapons_ban`
- `high_cap_mag_ban`

Use the detailed procedure in `STATE_LAW_DATA_INSTRUCTIONS.md`.

Recommended sources:

- Giffords scorecard and law-center pages.
- Everytown policy ranking pages.
- Current legal/news sources for pending effective dates or injunctions.

There is no current TypeScript replacement for the Django `update_state_law_data` command. Do not invoke the removed Django command. For a state-law refresh, first port a reviewed, source-backed TS script patterned after `scripts/import-csv.ts`; until then, record sources and proposed values without writing them.

## Matching and Geocoding Rules

Before importing, build a canonical key for each location:

```text
state + name + county
```

If source data uses CBSA, ZIP, or place IDs, create a crosswalk file with:

```text
state,name,county,census_place_geoid,county_fips,cbsa_code,latitude,longitude,source_notes
```

Use this crosswalk for all joins. Do not rely on fuzzy matching at import time without reviewing matches.

## Import Paths

### Existing CSV Import

`scripts/import-csv.ts` upserts curated location rows into `locations_location` by `(name, state)`.

Expected CSV columns include:

```text
City,State,County,StateParty,Governor,CityPolitics,2016Election,2016PresidentPercent,2024 Election,2024PresidentPercent,ElectionChange,Population,Density,SalesTax,Income,CostOfLiving,AvgHomeValue,VA,NearestVA,DistanceToVA,Veterans Benefits,TCI,CrimeRating,Marijuana,LGBTQ,LGBTQ_MEI,LGBTQStatePolicyScore,LGBTQSource,TechHub,DefenseHub,Snow,Rain,SunnyDays,AverageLowWinter,AverageHighSummer,HumiditySummer,Climate,Gas,Description,Tags,rep_vote_share_change_pp,dem_vote_share_change_pp
```

Run:

```powershell
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/import-csv.ts path\to\locations.csv --dry-run
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/import-csv.ts path\to\locations.csv
```

Use `--clear` only when intentionally replacing all locations:

```powershell
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/import-csv.ts path\to\locations.csv --clear
```

### State Info CSV Import

The Django `import_state_info` command was not ported to TypeScript.

Expected columns include:

```text
State,MagazineLimit,GiffordScore,GhostGunBan,AssaultWeaponBan,HighCapMagBan
```

Do not run a Django command or hand-edit live state data. Keep the curated CSV and source notes ready, then port and review a dedicated TypeScript importer before applying a `locations_stateinfo` update.

### TypeScript Maintenance Scripts

Use the available TypeScript script for repeatable data maintenance:

```powershell
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/categorize-climate.ts --dry-run
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/categorize-climate.ts
```

`categorize-climate.ts` currently updates every location. Run its write mode only after a batch review. For a single-city import, calculate and verify the category from the documented rule, then use a narrowly scoped parameterized Neon update that asserts exactly one matched row.

## Verification Checklist

After any import or refresh:

1. Run the TypeScript check.

```powershell
npx tsc --noEmit
```

2. Recompute climate categories if weather fields changed.

```powershell
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/categorize-climate.ts --dry-run
```

3. Re-run the **Summarize row and selected missing-field coverage** command from **Inspect Current Data** and compare the result with the pre-import baseline.

4. Verify all 50 states still have `StateInfo`.

```powershell
$script = @'
const { neon } = require(`@neondatabase/serverless`);
const sql = neon(process.env.DATABASE_URL);
const states = `AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY`.split(` `);
(async () => {
  const rows = await sql`SELECT state FROM locations_stateinfo`;
  const found = new Set(rows.map(({ state }) => state));
  console.log({ missing: states.filter((state) => !found.has(state)), extra: [...found].filter((state) => !states.includes(state)) });
})().catch((error) => { console.error(error); process.exit(1); });
'@
node "--env-file=$envFile" -e $script
```

5. Spot-check the explore UI and filters if user-facing fields changed.

6. Record source URLs, vintage dates, and retrieval date in the commit message or a companion note.

## Quality Rules

- Do not overwrite curated values with lower-quality scraped values.
- Do not invent values for unknown fields.
- Keep source vintage dates. Current-year data is not automatically better if the source definition changed.
- Keep display fields and numeric fields in sync.
- Avoid mixing geographies in one field without a source note.
- If a field cannot be sourced reliably, leave it blank and add it to the known gaps list.
- If external data licensing is unclear, do not import bulk data until the license is reviewed.
