---
name: vetretire-data-retrieval
description: Use this skill when you need to refresh, expand, or inspect the VetRetire data set, including location, state, and defense employer data. It contains detailed instructions on source priority, field maps, and verification checklists.
---
# VetRetire Full Data Retrieval Instructions

Use this guide when an LLM or operator needs to refresh or expand the VetRetire data set. This is broader than `STATE_LAW_DATA_INSTRUCTIONS.md`: it covers both `Location` and `StateInfo` data.

## Scope

The project stores these main Neon PostgreSQL tables:

- `locations_location`: city/metro retirement-location facts used by the public explore UI.
- `locations_stateinfo`: state-level gun-law and scorecard facts used by filters and admin views.
- `defense_employers`: defense/aerospace parent companies and brands (e.g. Raytheon, Collins Aerospace, both parent `RTX`).
- `defense_employer_locations`: individual employer job-sites with `city`/`state`, tied to a `defense_employers` row and optionally linked to a `locations_location` row via `location_id`. See **Defense Employer Location Linking** below.

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

## Web Scraping & Agent Tooling

When fetching data as an agent, use the appropriate tools based on the source:

- **`read_url_content`**: Default to this tool for fast, invisible extraction from static HTML pages, JSON APIs, and simple document sources.
- **`run_command`**: Use `curl`, `wget`, or custom scripts to download large CSV datasets (e.g. Census, Zillow) directly to the workspace.
- **`/browser` slash command**: If a website is difficult to scrape because it requires JavaScript to render, has complex navigation, requires accepting cookie banners, or needs authentication, ask the user to invoke the `/browser` slash command. This gives you access to a full built-in automated browser.

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

### Pace / Settlement Type

Retirement pace is **not** a CSV tag. It is produced by the source-backed
classifier and stored in `location_pace_classifications` / exposed via
`location_pace_current`. Product query values (Explore, API, both quizzes):

- `urban`
- `suburban`
- `small_town`
- `rural`

Do **not** add `pace:*` tags, and do **not** fall back to density cutoffs.

#### Classifier workflow

1. Migrate schema (once):
   `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-pace-classifications.ts`
2. Prepare fixed RUCA 2020 + EPA SLD 2021 extracts (downloads into
   `data/sources/pace/raw/`, writes `data/sources/pace/derived/pace_derived.json`):
   `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/prepare-pace-sources.ts`
3. Classify (supports `--dry-run`, `--all`, `--id N`, `--name "City, ST"`):
   `node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/classify-pace.ts --all`
4. CSV import (`scripts/import-csv.ts`) invokes classification for each upserted
   row. If a source-backed result cannot be produced, the city import is kept
   and a `needs_review` history row is created.

Metro locations are scored on their CBSA experience; non-metro locations use
the Census place’s geocoded tract metrics. Auto-approve only complete runs at
least 10 points from a category boundary whose RUCA band is within one category
of the score band. Ambiguous or incomplete runs stay in `needs_review`.
Approved manual overrides on history rows are preserved across later reruns.

#### Verification

Every curated location should have either a current category or an explicit
`needs_review` history row:

```powershell
$script = @'
const { neon } = require(`@neondatabase/serverless`);
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const missing = await sql`
    SELECT l.id, l.name, l.state
    FROM locations_location l
    LEFT JOIN location_pace_current c ON c.location_id = l.id
    WHERE c.location_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM location_pace_classifications h
        WHERE h.location_id = l.id AND h.review_state = 'needs_review'
      )
    ORDER BY l.state, l.name`;
  const review = await sql`
    SELECT l.name, l.state, h.score, h.candidate_category, h.input_values
    FROM location_pace_classifications h
    JOIN locations_location l ON l.id = h.location_id
    WHERE h.review_state = 'needs_review'
      AND h.id = (
        SELECT MAX(h2.id) FROM location_pace_classifications h2
        WHERE h2.location_id = h.location_id
      )
    ORDER BY l.state, l.name`;
  const current = await sql`
    SELECT category, count(*)::int AS n
    FROM location_pace_current
    GROUP BY category
    ORDER BY category`;
  console.log({ missing, reviewCount: review.length, current, review });
})().catch((error) => { console.error(error); process.exit(1); });
'@
$script | node "--env-file=$envFile" -
```

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
- `avg_home_value_display`: formatted string explicitly including the dollar sign and commas, e.g. `"$392,929"` or `$385k`. The CSV column must include these so the importer preserves them.
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
- `col_index`: integer where 100 means U.S. average. In the CSV, the `CostOfLiving` column must contain this integer index (e.g., `105`), not the derived string (`High`, `Moderate`).
- `cost_of_living`: derive from `col_index`: `Low` under 95, `Moderate` 95-115, `High` over 115 unless product rules say otherwise. The importer derives this automatically from the integer provided in the CSV.
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
- `climate_category`: run the TypeScript categorizer after a batch weather update. It currently rewrites all rows, so do not use it for a one-city update unless a global recategorization is intended. For a single-city ingest, manually update the row with a one-row SQL query (e.g., `UPDATE locations_location SET climate_category = 'hot_dry' WHERE ...`) to prevent it from remaining `null`.

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
- When exact city-level 2024 data is not feasible, store the best sourced county-level fields and mark `city_politics` with a clear qualifier such as `County-level: Mixed / Swing` or leave it blank for later research.
- Preserve exact source URLs, retrieval dates, election vintage, geography used, and denominator used in a companion notes file stored in the `data/` directory (e.g., `data/fresno_ca_sources.md`). Do not store source notes at the project root.

Trend calculation requirements:

- **Must use strict two-party math** for historical trends. Divide the major-party vote by the sum of the two major parties, excluding third-party and write-in noise. Use the exact same denominator logic for both years being compared.
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
- `lgbtq_rating`: in the CSV, the `LGBTQ` and `LGBTQ_MEI` columns expect the numeric MEI score text (e.g., `95`). If the city has no HRC MEI scorecard, leave BOTH columns blank/null. Do not place a state policy score in the municipal slot.
- `lgbtq_state_policy_score`: in the CSV, the `LGBTQStatePolicyScore` column expects the numeric MAP policy score (e.g., `45`, rounded to nearest whole number if required). However, the exact decimal score (e.g., `44.5/49`) must be documented in the source notes.

### Economic Hubs and Lifestyle Tags

Fields:

- `tech_hub`
- `defense_hub` (derived — see below)
- `defense_hub_manual`
- `tags`
- `description`

Recommended sources:

- Bureau of Labor Statistics occupational/employment data for tech employment.
- Department of Defense installation lists and military base directories.
- Local economic development pages for major industry clusters.
- Official tourism/city pages for activity tags.
- National Park Service, state parks, golf course datasets, coastline/water access, trail databases, and arts/culture listings for tags.

Retrieval notes:

- Use `Y` / `N` for `tech_hub`.
- Do **not** hand-set `defense_hub`. It is derived by `scripts/recompute-defense-hub.ts` from employer presence plus `defense_hub_manual`. Put any human "this is a defense city" judgment in `defense_hub_manual` (the CSV `DefenseHub` column maps there), then run the recompute. See **Defense Employer Location Linking**.
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

### Interactive Map Coordinates

`/map` uses a compact, checked-in coordinate crosswalk at
`data/location-map-coordinates.json`. It contains Census 2024 Gazetteer place
internal points for every curated city; the app still reads the city details
live from Neon. This keeps map loading small and makes the geographic source
auditable without placing latitude/longitude fields onto the legacy location
table.

**This is a required part of every city add, rename, or removal.** After the
location import has changed `locations_location`, do whatever is necessary to
make `/map` reflect that change: regenerate the crosswalk before shipping,
resolve any exact Census-name mismatch, and verify the resulting JSON contains
the city and its expected state.

```powershell
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/prepare-map-coordinates.ts
```

The script fails if any live location cannot be matched to the Census place
snapshot. Treat that as an ingest blocker for a mapped city: review and add a
narrowly documented alias in the script only for an official Census naming
difference (for example, `Boise` vs. `Boise City`); never use an approximate
neighboring place as a silent fallback. Confirm the city is present in
`data/location-map-coordinates.json`, then spot-check `/map` so the new city is
actually visible. Commit the updated JSON with the city CSV and source notes.

## Defense Employer Location Linking

The `defense_employer_locations` table lists individual defense/aerospace job-sites. Each site can be tied to a curated retirement city so the explore UI can show "this city hosts an RTX-affiliated employer." The tie is the nullable foreign key:

```text
defense_employer_locations.location_id  ->  locations_location.id
```

Relationship shape and rules:

- **Many-to-one, not 1:1.** One curated city can host several employer sites. Example: Fort Wayne, IN links to both a `Raytheon` row and a `Collins Aerospace` row (both parent `RTX`). Do not assume a single employer per city.
- **Match key** is city + state, case-insensitive and trimmed: `lower(city) = lower(name)` and `upper(state) = upper(state)`. Both tables use two-letter postal state codes, so this is a clean equijoin, not fuzzy matching.
- **Brand vs. parent.** A city may be RTX-affiliated through a brand other than Raytheon (e.g. Pueblo, CO is `Collins Aerospace`, parent `RTX` — there is no Raytheon-branded row there). Match on the site's own `city`/`state`; use `defense_employers.parent_company` (e.g. `RTX`) when you need the affiliation family rather than the specific brand.
- **Unlinked is expected.** Employer sites in cities that are not (yet) in `locations_location` keep `location_id = NULL` by design. As you add curated cities one by one, their employer sites link automatically (see trigger below).

### Database objects

Two Neon objects maintain the link. Both already exist in the live database; the DDL is recorded here so they can be recreated on a fresh branch or environment.

`link_employer_locations_to_cities()` — idempotent backfill. Links every unlinked-or-mismatched employer site to its matching city and returns the number of rows changed. Safe to re-run anytime.

```sql
CREATE OR REPLACE FUNCTION link_employer_locations_to_cities()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE updated integer;
BEGIN
  UPDATE defense_employer_locations del
     SET location_id = loc.id, updated_at = now()
    FROM locations_location loc
   WHERE del.location_id IS DISTINCT FROM loc.id
     AND del.country = 'US'
     AND lower(btrim(del.city))  = lower(btrim(loc.name))
     AND upper(btrim(del.state)) = upper(btrim(loc.state));
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$;
```

`link_city_to_employer_locations` — AFTER INSERT trigger on `locations_location`. When a brand-new city is inserted, its matching employer sites are linked immediately, so the one-by-one add workflow needs no manual step.

```sql
CREATE OR REPLACE FUNCTION trg_link_city_to_employer_locations()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE defense_employer_locations del
     SET location_id = NEW.id, updated_at = now()
   WHERE del.location_id IS NULL
     AND lower(btrim(del.city))  = lower(btrim(NEW.name))
     AND upper(btrim(del.state)) = upper(btrim(NEW.state));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_city_to_employer_locations ON locations_location;
CREATE TRIGGER link_city_to_employer_locations
AFTER INSERT ON locations_location
FOR EACH ROW EXECUTE FUNCTION trg_link_city_to_employer_locations();
```

### When to run the backfill

The trigger fires only on a true `INSERT`. `scripts/import-csv.ts` upserts by `(name, state)`, so an import that only **updates** an already-present city does not re-fire it. Run the backfill as a catch-all after any location import, and after adding or correcting `defense_employer_locations` rows:

```powershell
$script = @'
const { neon } = require(`@neondatabase/serverless`);
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const [{ rows_linked }] = await sql`SELECT link_employer_locations_to_cities() AS rows_linked`;
  console.log({ rows_linked });
})().catch((error) => { console.error(error); process.exit(1); });
'@
node "--env-file=$envFile" -e $script
```

### Verify

Confirm nothing that should be linked is still `NULL`:

```powershell
$script = @'
const { neon } = require(`@neondatabase/serverless`);
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const [gap] = await sql`
    SELECT count(*)::int AS unlinked_but_matchable
    FROM defense_employer_locations del
    JOIN locations_location loc
      ON lower(btrim(del.city))  = lower(btrim(loc.name))
     AND upper(btrim(del.state)) = upper(btrim(loc.state))
    WHERE del.location_id IS NULL AND del.country = 'US'`;
  console.log(gap); // expect { unlinked_but_matchable: 0 }
})().catch((error) => { console.error(error); process.exit(1); });
'@
node "--env-file=$envFile" -e $script
```

Employer sites whose city is not in `locations_location` will remain `NULL` and are not counted above — that is correct.

### Deriving `defense_hub` from the link

Linking only populates `location_id`. It does **not** set `defense_hub`. That column is *derived* and owned by `scripts/recompute-defense-hub.ts` (logic in `lib/defense.ts`), from three inputs in priority order:

```text
defense_hub = defense_hub_manual === false ? false   // hard human veto
            : employer_presence            ? true    // a physical RTX facility
            : defense_hub_manual                      // curated value / NULL
```

- **`defense_hub_manual = false`** is a hard veto and always wins. Use it for cities that host an RTX facility but are not defense hubs for a retiree — a lone Collins depot in a small town (Jamestown ND, Burnsville MN).
- **`employer_presence`** = a `counts_as_defense`, `active` employer with at least `DEFENSE_HUB_MIN_POSTINGS` (**1**) onsite+hybrid opening in the city — i.e. a physical facility. Remote-only postings never count. Because only RTX is ingested, one RTX site is a *sample* of a wider, untracked defense cluster, so presence **promotes** the city to a hub.
- **`defense_hub_manual` otherwise** carries hubs employer data can't see: military-installation towns with no contractor plant, or a hub whose RTX openings are momentarily zero (Boston). A `NULL` with no presence stays `NULL` — "unknown" is not "not a hub".

The dry run refuses to demote a `true` hub that has *no* veto (a `true` with `defense_hub_manual` unset or a stray value), so such rows surface for you to fix — set `defense_hub_manual = true` for a genuine hub, or `false` to veto it. A `true → false` transition is allowed only when you have explicitly set `defense_hub_manual = false`.

Because the link feeds `employer_presence`, always **link first, then recompute**:

```powershell
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts --dry-run
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts
```

The dry run lists every proposed flip; review it before writing.

> Human "this is a defense city" judgment belongs in `defense_hub_manual`, never directly in `defense_hub`. `scripts/import-csv.ts` maps the CSV `DefenseHub` column to `defense_hub_manual` for this reason; `defense_hub` is always left to the recompute.

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

The importer writes the CSV `DefenseHub` column to `defense_hub_manual`, not `defense_hub`. A brand-new city's employer sites are auto-linked on insert by the `link_city_to_employer_locations` trigger, but `defense_hub` stays unresolved until you recompute. **After every import, run the two follow-ups** (order matters — link, then derive):

```powershell
# 1. Catch-all link (the trigger only fires on brand-new inserts, not upsert-updates)
node "--env-file=$envFile" -e $script   # link_employer_locations_to_cities(), see Defense Employer Location Linking
# 2. Derive defense_hub from the fresh links + manual curation
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts --dry-run
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts
```

If the importer creates a `needs_review` pace result, do not leave the new city
uncategorized. Review the candidate against the actual place experience, then
record the decision in the history table rather than modifying the live view:

```powershell
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/approve-pace.ts `
  --name "City, ST" --category small_town --reason "Place-level review rationale"
```

Use `--dry-run` first. Choose an override only when the reviewed place differs
from the modeled candidate; the original candidate and rationale remain
preserved in `location_pace_classifications`.

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

4. If cities or `defense_employer_locations` rows changed, run the **Defense Employer Location Linking** backfill (confirm the verify query reports `unlinked_but_matchable: 0`), then run `scripts/recompute-defense-hub.ts --dry-run` and, if clean, without `--dry-run` to derive `defense_hub`.

5. Verify all 50 states still have `StateInfo`.

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

6. Spot-check the explore UI and filters if user-facing fields changed.

7. Record source URLs, vintage dates, and retrieval date in the commit message or a companion note.

## Quality Rules

- Do not overwrite curated values with lower-quality scraped values.
- Do not invent values for unknown fields.
- Keep source vintage dates. Current-year data is not automatically better if the source definition changed.
- Keep display fields and numeric fields in sync.
- Avoid mixing geographies in one field without a source note.
- If a field cannot be sourced reliably, leave it blank and add it to the known gaps list.
- If external data licensing is unclear, do not import bulk data until the license is reviewed.
