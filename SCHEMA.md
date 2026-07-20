# VetRetire Database Schema Documentation

This document explains the data structure for retirement locations in the VetRetire application.

## StateInfo Model Fields

State-level information that applies to all locations within a state (no need to duplicate for each city).

### Gun Laws & Regulations
- **State**: Two-letter state abbreviation (Primary Key)
- **MagazineLimit**: Statewide magazine capacity threshold or "No statewide magazine capacity limit"
- **GiffordScore**: Giffords Law Center grade (A through F, with +/- modifiers)
- **GhostGunBan**: Whether ghost guns are regulated or banned (Y/N)
- **AssaultWeaponBan**: Whether the state has a general statewide assault weapons ban (Boolean)
- **HighCapMagBan**: Whether the state has a high-capacity magazine ban (Boolean)

**Note**: This table contains state-specific regulatory information. Empty fields indicate no restriction or grade available. `AssaultWeaponBan` reflects the current general-ban state list used by the app's "No Assault Weapons Ban" filter, not narrower assault-weapon regulations. `MagazineLimit`, `GhostGunBan`, and `HighCapMagBan` can be refreshed with `python manage.py update_state_law_data`.

---

## Location Model Fields

### Basic Location Information
- **State**: Two-letter state abbreviation (e.g., "FL", "CA")
- **City**: City name
- **County**: County name

### Political Information
- **StateParty**: Political party controlling the state (R/D)
- **Governor**: Political party of the state governor (R/D)
- **CityPolitics**: Political leaning of the city (e.g., "Progressive", "Moderately Conservative")
- **2016Election**: Presidential election winner in 2016 (Trump/Clinton)
- **2016PresidentPercent**: Percentage of vote for winner in 2016
- **2024 Election**: Presidential election winner in 2024 (Trump/Harris)
- **2024PresidentPercent**: Percentage of vote for winner in 2024
- **ElectionChange**: How voting patterns shifted between 2016-2024 (e.g., "5% more Democratic")

### Demographics & Economics
- **Population**: Population of the metro area/county
- **Density**: Population density (people per square mile)
- **Sales Tax**: Sales tax percentage
- **Income**: State income tax percentage (0.00 = no income tax)
- **COL**: Cost of Living index (100 = national average)

> **Schema note (Phase 4 cleanup):** `has_va`, `tech_hub`, and `defense_hub` are stored as
> Booleans (the importer parses "Yes"/"No"/"Y"/"N"); `density` is stored as an integer; and
> `population` holds the full number (e.g. `915,927`). The legacy/duplicate columns `match_score`,
> `avg_price`, `va_distance`, `climate_detailed`, `pps`, and the old formatted `population` string
> have been removed. Ranking is computed at request time (see `calculate_baseline_score`), not stored.

### Veterans Affairs
- **VA**: Whether location has a VA facility ("Yes"/"No" in CSV → Boolean `has_va`)
- **NearestVA**: Name of nearest VA facility (if VA = "No")
- **DistanceToVA**: Distance to nearest VA facility (e.g., "24 miles", "NA" if local)
- **Veterans Benefits**: Additional veteran-specific benefits/tax breaks available

### Safety & Social
- **TCI**: Total Crime Index (lower is safer, national average = 100)
- **Marijuana**: Legal status (Recreational/Medical/Decriminalized/Illegal)
- **LGBTQ**: LGBTQ-friendly rating or community presence

### Economic Hubs
- **TechHub**: Whether location is a technology hub (Y/N)
- **DefenseHub**: Whether location has significant defense/military presence (Y/N). **Derived** — see [Defense hub (derived)](#defense-hub-derived); edit `defense_hub_manual`, never this column
- **DefenseHubManual**: The hand-curated input to `DefenseHub`. Three-valued: `null` means "never researched", which is not `false`

### Weather & Climate
- **Snow**: Average annual snowfall (inches)
- **Rain**: Average annual rainfall (inches)
- **Sun**: Average days of sunshine per year
- **ALW**: Average Low in Winter (temperature in °F)
- **AHS**: Average High in Summer (temperature in °F)
- **HumiditySummer**: Average humidity percentage in July (representative of summer)
- **Climate**: Climate zone description (e.g., "Humid subtropical", "Hot desert")

### Geography proximity
- **NearLake**, **NearOcean**, **NearMountains**: Curated boolean facets for the Explore geography filter. A city qualifies when its center is roughly within 30 miles of a usable lake or saltwater coastline, or within 35 miles of a named mountain range/sustained mountain terrain. These are lifestyle discovery signals, not parcel-level distance guarantees. The reviewed source list and methodology live in `data/geography-proximity.json`; apply it with `scripts/import-geography-proximity.ts` after `scripts/migrate-geography-proximity.ts`.
- **Vibes**: Curated text-array lifestyle tags used by the Explore vibe filter: beach life, desert life, mountain living, southern living, lake living, great outdoors, nightlife, and quiet retreat. Settlement pace (urban/suburban/small town/rural) lives in the Lifestyle filter; weather patterns live in Climate (`cold_snowy` is labeled “Four seasons” in the UI). The full-city review lives in `data/city-vibes.json`; apply it with `scripts/import-city-vibes.ts` after `scripts/migrate-city-vibes.ts`.

### Other
- **Gas**: Average gas price per gallon (formatted as currency)
- **Description**: Marketing/descriptive text about the location

## Data Types & Formats

### Numeric Fields
- Population: Formatted with commas (e.g., "413,066")
- Density, Sales Tax, Income: Decimal numbers
- COL, TCI: Integer index values
- Snow, Rain, Sun, ALW, AHS, HumiditySummer: Integer values

### Text Fields
- Election percentages: Integer (e.g., 61)
- ElectionChange: Percentage with direction (e.g., "5% less Democratic")
- Gas prices: Currency formatted (e.g., "$2.46")
- DistanceToVA: Distance string (e.g., "24 miles") or "NA"
- LGBTQ: Number or text indicator
- Yes/No fields: "Y"/"N" or "Yes"/"No"

### Nullable/Optional Fields
- Many fields may be empty or contain "?" for unknown values
- NearestVA and DistanceToVA only populated when VA = "No"
- Veterans Benefits may be empty if none specific

## Notes
- Data sourced from various public datasets and APIs
- Cost of Living (COL) uses 100 as the national average baseline
- Crime Index (TCI) uses similar baseline where 100 = national average
- Political data represents county-level results in most cases

---

## DefenseEmployers

The employer dimension backing the `/explore` employer filter. Keyed by a stable `slug` so the UI and importers do not depend on free-text names.

Table: `defense_employers`

- **Slug**: Stable identifier, e.g. `raytheon`, `collins-aerospace`, `lockheed-martin`
- **DisplayName**: Label shown in the UI, e.g. `Pratt & Whitney`
- **ParentCompany**: Grouping label, e.g. `RTX` for its three brands
- **Sector**: `defense`, `defense_aerospace`, or `corporate`
- **CountsAsDefense**: Whether presence contributes to the `defense_hub` signal. False for `rtx-corporate` (finance/legal/HR roles are not a defense-industry signal)
- **AtsKind** / **AtsConfig**: How to refresh this employer automatically (`phenom` + the careers-site facet values). Null for employers with no importer yet
- **Active**: Soft-delete flag; inactive employers vanish from the filter

Seeds live in `lib/defense.ts` (`DEFENSE_EMPLOYER_SEEDS`) and are applied by `scripts/migrate-defense-employers.ts`. Lockheed Martin, General Dynamics, Northrop Grumman, and Boeing are seeded with zero locations; they appear in the filter only once an importer populates them. **System High** and **L3Harris** have no scraper in this repo, so their footprints are hand-sourced in `data/system_high_job_locations.csv` and `data/l3harris_job_locations.csv`; each uses an attested onsite presence signal rather than inventing a work-arrangement breakdown. See the adjacent `*_sources.md` files for source and counting details.

---

## DefenseEmployerLocations

Company/job-location research data is stored outside `locations_location` so employer research does not create fake retirement-location rows.

Table: `defense_employer_locations`

- **EmployerId**: FK to `defense_employers`. The single source of truth for who this row belongs to
- **LocationId**: FK to `locations_location`, resolved at import by `(lower(city), state)`. **Null for most rows** — RTX hires in ~170 US cities, only ~23 of which are curated retirement locations
- **Country** / **State** / **City** / **RegionLabel**: Where. `State` is a two-letter abbreviation (including `PR`, `DC`)
- **LocationName**: Human-readable site name
- **LocationType**: Source-defined *site kind* such as `careers_location`. Not the same as a posting's onsite/hybrid/remote work arrangement, which is stored as the three count columns
- **Latitude** / **Longitude**: City centroid from the careers map endpoint
- **OnsitePostingCount** / **HybridPostingCount** / **RemotePostingCount**: Live posting counts by work arrangement
- **TotalPostingCount**: Authoritative per-city total. **May exceed onsite+hybrid+remote**, because some postings have an `Unspecified` arrangement
- **SnapshotDate**: When the counts were captured
- **SourceKind** / **SourceUrl** / **SourceRetrievedOn**: Provenance. `careers_api` for synced rows, `official_location_page` for hand-researched ones
- **IsFeatured**: Whether the employer presents this location as a highlighted careers/site-tour location
- **Notes**: Short provenance note

Rows are unique on `(employer_id, country, state, city, region_label)`.

Two writers favor **near-disjoint** column sets and both use `COALESCE`, so neither erases the other's work:

| Writer | Owns |
| --- | --- |
| `scripts/import-defense-employer-locations.ts` | Provenance: `source_*`, `is_featured`, `notes`, `location_name`. Also seeds `*_posting_count` from optional `Onsite`/`Hybrid`/`Remote`/`TotalPostings` CSV columns for employers with no ATS sync (System High); absent columns leave existing counts untouched. |
| `scripts/sync-rtx-employer-locations.ts` | Counts: `*_posting_count`, `snapshot_date`, `latitude`/`longitude` (authoritative for scraped employers; overwrites) |

> **Counting caveat:** per-city posting counts sum to *more* than the employer's job total, because one posting can list several cities. Never add them up to get a job count.

---

## Defense hub (derived)

`locations_location.defense_hub` is **computed**, not curated. Three inputs, in priority order:

1. `defense_hub_manual = false` — a hard human veto, always wins. For cities that host an RTX facility but are not defense hubs for a retiree: a lone Collins depot in a small town (Jamestown ND, Burnsville MN).
2. Employer presence — a `counts_as_defense`, active employer with at least `DEFENSE_HUB_MIN_POSTINGS` (1) **onsite+hybrid** opening in the city, i.e. a physical facility. Remote postings are excluded (tagged to cities where the employer has no facility). Since only RTX is ingested, one site samples a wider, untracked cluster, so presence promotes to a hub.
3. `defense_hub_manual` otherwise — the hand-curated value. Carries hubs employer data can't see: military-installation towns (Norfolk, Fayetteville, Bremerton) with no contractor plant, or a hub whose RTX openings are momentarily zero (Boston).

```
defense_hub = defense_hub_manual === false ? false
            : employer_presence            ? true
            : defense_hub_manual
```

A `NULL` (never researched, no presence) stays `NULL` — "unknown" is not the same claim as "not a defense hub", matching the three-valued convention used by the veteran-benefits booleans.

Recompute with `scripts/recompute-defense-hub.ts` after any employer import. It is idempotent, prints every proposed flip with its evidence under `--dry-run`, and aborts on an *unexplained* demotion (a `true` with no `defense_hub_manual = false` veto behind it). A `true → false` transition is allowed only when you set the veto deliberately. The presence threshold is a named constant in `lib/defense.ts`.

---

## Military installations

Military installations are stored separately from defense employers because a command is a public facility, not a contractor or job-posting footprint. This is the authoritative data layer for a future **near a base** radius filter.

Table: `military_installations`

- **ServiceBranch** / **CommandName**: The owning service and the official command name.
- **InstallationType** / **OperationalStatus**: Controlled descriptive fields (the current Navy import uses `installation_command` and `active`).
- **Country** / **City** / **State**: The source-defined principal municipality, retained even when it does not match a curated retirement location.
- **Latitude** / **Longitude**: Reserved for authoritative installation-site coordinates. They remain null when the source only provides a municipality; city centroids must not be used to claim a precise radius match.
- **SourceKind** / **SourceUrl** / **SourceRetrievedOn** / **Notes**: Ingest provenance and source scope.

Rows are unique on `(service_branch, command_name, country, city, state)`. Service-specific seeds (currently `data/navy_installations.json` and `data/marine_corps_installations.json`) carry their own `service_branch` and load through `scripts/import-military-installations.ts` after `scripts/migrate-military-installations.ts`. Future services should follow the same format and add coordinate-enrichment from an authoritative site-level source before the UI exposes distance matching.

---

## Pace classification (derived)

Retirement pace (`urban` / `suburban` / `small_town` / `rural`) is **not** stored on `locations_location`. It lives in an append-only history table plus a current view.

### `location_pace_classifications`

Immutable run history for the classifier (`scripts/classify-pace.ts`, also invoked from CSV import):

- **LocationId**: FK to `locations_location`
- **Scope**: `cbsa` (metro experience) or `place` (non-metro Census place fallback)
- **CbsaGeoid** / **PlaceGeoid** / **TractGeoids**: Census geography IDs used for the run
- **CensusVintage**: Geocoder vintage string recorded with the run
- **InputValues**: Raw aggregates, normalized factors, review reasons (jsonb)
- **SourceVersions** / **SourceChecksums**: RUCA / EPA snapshot provenance from `data/sources/pace/manifest.json`
- **Score**: 0–100 urbanicity score (nullable when incomplete)
- **CandidateCategory**: Algorithm category before any override
- **Confidence**: Distance in score points to the nearest category boundary
- **ReviewState**: `auto_approved` | `needs_review` | `approved` | `rejected`
- **OverrideCategory** / **OverrideReason** / **ReviewedAt**: Optional human override (preserved across later reruns)
- **AlgorithmVersion**: e.g. `pace-v1`
- **CreatedAt**: Insert time

### `location_pace_current` (view)

Latest usable category per location:

1. Prefer the newest row with an approved `override_category`
2. Else the newest `auto_approved` / `approved` candidate

Application reads join this view as `pace_category`. The Explore / API / quiz `lifestyle` filter matches that column (including `small_town`). There is **no** density fallback.

Migrate with `scripts/migrate-pace-classifications.ts`. Prepare fixed RUCA 2020 + EPA SLD 2021 extracts with `scripts/prepare-pace-sources.ts`, then classify with `scripts/classify-pace.ts`.

---

## Monthly weather normals

Month-by-month climate normals live outside `locations_location` so a city stays one row while carrying 12 months of weather. **Additive**: the annual columns in [Weather & Climate](#weather--climate) (`snow_annual`, `alw`, `avg_high_summer`, `humidity_summer`, `sun_days`) remain authoritative for scoring/filters and are **not** derived from this table.

Table: `location_weather_monthly`

- **LocationId**: FK to `locations_location`, `ON DELETE CASCADE`
- **Month**: `1`–`12` (calendar month). Unique with `LocationId` — one row per city-month
- **AvgHighF** / **AvgLowF** / **AvgTempF**: Mean daily max / min / mean temperature (°F)
- **PrecipIn**: Total precipitation, rain-equivalent inches
- **SnowIn**: Snowfall, inches
- **PrecipDays**: Days with measurable precipitation
- **HumidityPct**: Mean relative humidity
- **SunPct**: Percent of possible sunshine
- **DataVintage**: Normals period, e.g. `1991-2020`
- **SourceKind** / **SourceUrl** / **SourceRetrievedOn**: Provenance. `noaa_normals` for NOAA/NCEI Climate Normals

Every metric is **nullable** — a city may have temperature normals but no humidity. The `/weather` page renders each metric's panel as "data unavailable" when null, so partial coverage degrades gracefully.

Rows are unique on `(location_id, month)`; importers upsert on that key. Climate *normals* are stable (NOAA revises once a decade), so a single-vintage upsert table with a `data_vintage` tag suffices — no append-only history / current-view layer like pace uses.

Migrate with `scripts/migrate-weather-monthly.ts` (idempotent, `--dry-run`). Application reads via `getMonthlyWeather(locationId)` in `lib/locations.ts`, which returns `[]` if the table is not yet migrated.

---

## Hourly weather normals (moisture)

Dew point and heat index live here, not on `location_weather_monthly`, because they come from a **different station**. GHCN *monthly* normals carry no humidity at all (which is why `location_weather_monthly.humidity_pct` / `sun_pct` are permanently NULL); dew point exists only in the NOAA *hourly* normals product, published for ASOS/airport (`USW`) stations. ~half the cities' nearest temperature station is a COOP (`USC`) site with no hourly data, so writing moisture into a monthly row would attribute one station's dew point to another station's temperature.

Table: `location_hourly_normals`

- **LocationId**: FK to `locations_location`, `ON DELETE CASCADE`
- **Month** / **Hour**: `1`–`12` and `0`–`23` local standard time. Unique together with `LocationId` — 288 rows per city
- **TempF** / **DewPointF** / **HeatIndexF**: Mean temperature, dew point and NOAA's own heat-index normal (°F). `HeatIndexF` is taken from `HLY-HIDX-NORMAL`, never recomputed; it equals `TempF` when air is too dry to amplify
- **DewPointP10F** / **DewPointP90F**: 10th/90th percentile dew point — the dry and muggy extremes behind the mean
- **StationId** / **StationName** / **StationDistanceMi**: Which station this city's moisture came from, and how far. Recorded because `location_weather_monthly` records neither, which is why its unrepresentative matches (Honolulu, Marietta) stayed invisible until audited
- **DataVintage** / **SourceKind** / **SourceUrl** / **SourceRetrievedOn**: Provenance. `noaa_hourly_normals` for NOAA/NCEI Hourly Normals

Grain is month × hour, not month: dew point has a strong diurnal cycle (Phoenix July: 57°F at 05h vs 52°F at 16h), so a daily mean conflates humid dawns with dry afternoons. Keeping the hour lets callers read moisture *at the hottest hour*. NCEI's 8760 day-hours are averaged down to 288 per city.

> **Which table for which metric:** use this table for **moisture only**, and `location_weather_monthly` for **temperature**. Dew point is an air-mass property that varies smoothly, so a metro's airport is representative at 20–50 mi; temperature is not. Sierra Vista, AZ (4,600 ft) matches Tucson's airport at 54.3 mi — its dew point is fine, its `temp_f` is ~6°F too hot.

Migrate with `scripts/migrate-hourly-normals.ts`, then import with `scripts/import-hourly-normals.ts --all` (idempotent, `--dry-run`, `--refresh`). Covers 86/86 cities from 78 stations, mean distance 11.3 mi; the importer prints any match beyond 50 mi for review. Station CSVs (~6MB each) cache to `data/sources/weather/hourly/` and are **gitignored**; the importer validates cached files are complete (8761 lines) and re-fetches truncated ones, so an interrupted run cannot poison the cache.

---

## State weather indices

State-level weather and exposure datasets that are not city-specific live outside `locations_location` and `location_weather_monthly`.

Table: `state_weather_indices`

- **IndexSlug**: Stable dataset identifier, e.g. `uv`. Unique with `State`.
- **State** / **StateName**: USPS abbreviation and full state label.
- **IndexLabel** / **MetricLabel** / **Unit** / **Blurb**: Display metadata for the page.
- **Value**: Primary 0-100 index value used for map color and ranking.
- **Rank**: National rank, `1` = highest exposure.
- **Band**: `Very Low` / `Low` / `Moderate` / `High` / `Very High`.
- **AnnualMeanSolarNoonUvi** / **PeakMonthlyMeanUvi** / **PeakMonth**: UV-specific supporting metrics. These are nullable so the table can later hold other state-weather indices.
- **DataVintage** / **Sources** / **Methodology** / **SourceFile**: Provenance for the dataset.
- **UpdatedAt**: Last upsert timestamp.

The first dataset is the state UV exposure index, sourced from NASA Earth Observations UV climatology with EPA and NOAA comparison sources. Migrate and import with `scripts/migrate-state-weather-indices.ts` (idempotent, supports `--dry-run`). Application reads via `getStateWeatherIndex("uv")` in `lib/state-weather.ts`; if the table is absent in a local environment, the route falls back to the committed static dataset from `lib/state-weather-data.ts`.

Table: `state_gas_prices`

State-level average regular gas prices for the `/gas` page. Kept separate from `state_weather_indices` because the primary metric is a dollar price rather than a UV index.

- **State** (PK) / **StateName**: USPS abbreviation and full state label.
- **Price**: Average regular unleaded price in USD per gallon — the number the UI leads with.
- **Value**: A 0-100 expensiveness index used for map color, `100` = most expensive state.
- **Rank**: National rank, `1` = most expensive.
- **Band**: `Very Low` / `Low` / `Moderate` / `High` / `Very High`.
- **MetricLabel** / **Unit** / **PriceUnit** / **Blurb**: Display metadata for the page.
- **DataVintage** / **Sources** / **Methodology** / **SourceFile**: Provenance for the dataset.
- **UpdatedAt**: Last upsert timestamp.

Migrate and import with `scripts/migrate-gas-prices.ts` (idempotent, supports `--dry-run`). Application reads via `getGasPrices()` in `lib/gas-prices.ts`; if the table is unreachable (missing table, or no `DATABASE_URL` locally), the route falls back to the committed static dataset from `lib/gas-prices-data.ts`.

---

## Annual air quality

City air-quality summaries live outside `locations_location` because EPA AQI data is published by monitor-derived reporting geography, not exact city boundary.

Table: `location_air_quality_annual`

- **LocationId**: FK to `locations_location`, `ON DELETE CASCADE`
- **Year**: EPA AirData annual summary year.
- **SourceGeoType**: `county`, `cbsa`, or `nearest_county`. The importer prefers county rows, falls back to CBSA rows when a county row is unavailable, and only then uses the nearest same-state county with EPA annual AQI data.
- **SourceStateName** / **SourceGeoName**: The EPA geography matched to the city, e.g. `Florida` / `Orange`.
- **SourceDistanceMiles**: Null for direct county/CBSA matches; distance from the city Census place centroid to the fallback county centroid for `nearest_county` rows.
- **DaysWithAQI** / **GoodDays** / **ModerateDays** / **UnhealthySensitiveDays** / **UnhealthyDays** / **VeryUnhealthyDays** / **HazardousDays**: Annual AQI day counts.
- **MaxAQI** / **P90AQI** / **MedianAQI**: Annual AQI summary statistics.
- **DaysCO** / **DaysNO2** / **DaysOzone** / **DaysPM25** / **DaysPM10**: Days where each pollutant drove the AQI.
- **DataVintage** / **SourceKind** / **SourceUrl** / **SourceFile** / **SourceRetrievedOn**: Provenance for the EPA AirData annual file.

Rows are unique on `(location_id, year, source_geo_type)`. Migrate with `scripts/migrate-air-quality.ts`, then import with `scripts/import-air-quality.ts --year YYYY`. The importer downloads EPA AirData annual county and CBSA files when cached CSVs are missing, uses the Census county gazetteer plus the pace bundle's `county_cbsa` mapping for CBSA fallback, writes a city match report to `data/sources/air-quality/location_air_quality_matches_YYYY.csv`, and upserts matched locations. `nearest_county` rows are explicit approximations for cities with no direct county/CBSA annual AQI row; do not treat them as municipal-boundary measurements.
