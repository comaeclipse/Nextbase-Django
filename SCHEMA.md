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

### Veteran Benefits Tax Detail
- **retired_pay_tax**: `no_income_tax` | `exempt` | `partial` | `conditional` | `taxed` | `unknown` - how the state taxes military retired pay. Read by `lib/income.ts`; `partial`/`conditional` are currently modeled as fully taxed (a documented conservative approximation), flagged to the reader.
- **retired_pay_exclusion_amount**: flat/capped dollar amount excluded per year, when the state's rule reduces to a single figure. Null when it doesn't (e.g. an age-tiered cap) - the real structure lives in `retired_pay_condition` instead.
- **retired_pay_exclusion_pct**: percentage of retired pay excluded, when the exclusion is stated as a percentage rather than a dollar cap.
- **retired_pay_condition**: free text - the age/income/service gate or multi-tier structure a scalar can't carry.
- **vet_benefits_source_url**: where the `retired_pay_tax` classification was verified.
- **vet_benefits_verified_on**: date a human last checked `retired_pay_tax` against `vet_benefits_source_url`. Null means unverified.

All five columns are maintained by `scripts/migrate-vet-benefits-tax-columns.ts` + `scripts/import-retired-pay-tax.ts` from `data/state_retired_pay_tax.csv`, verified per-state against primary sources 2026-08-11 (issue #42). `scripts/import-state-benefits.ts` (the broader, still-unverified `data/state_vet_benefits.csv` draft) never touches `retired_pay_tax`, `vet_benefits_source_url`, or `vet_benefits_verified_on` so it can't silently regress this verification.

### Social Security tax treatment

- **ss_tax_treatment**: `not_taxed` | `partial` | `taxed` | `unknown` — how the state taxes Social Security **benefits specifically**. `taxed` adds the federally taxable portion (`taxableSS`), not 100% of gross benefits.
- **ss_tax_threshold_single** / **ss_tax_threshold_married**: AGI at or below which a `partial` state exempts benefits entirely. Null means no threshold is on file, which `lib/income.ts` treats as fully taxed and flags as an approximation.
- **ss_tax_min_age**: age at year-end at or above which the exemption gate opens. Null means no age condition.
- **ss_tax_age_exempts_fully**: if true, reaching `ss_tax_min_age` exempts Social Security regardless of AGI (Colorado 65+). If false, min age is required *in addition* to the AGI threshold (Rhode Island full retirement age).
- **ss_tax_source_url** / **ss_tax_verified_on**: provenance

The UI only has a 65-or-older flag, so a gate older than 65 is treated as met for 65+ filers and recorded as an approximation. Maintain with `scripts/migrate-ss-tax-columns.ts`, `scripts/migrate-ss-tax-age-columns.ts`, and `scripts/import-ss-tax.ts` from `data/state_ss_tax.csv`.

### General senior subtraction from state taxable income

A **general** subtraction from the state's taxable-income base, not an SS-specific exemption. Distinct from `ss_tax_*`: some states (Montana, since TY2024) start from federal taxable income, include Social Security only to the extent the IRS does, and then subtract a fixed amount for each taxpayer who has attained a given age.

- **senior_deduction_amount**: dollars subtracted **per qualifying individual**. A married couple both past the age line claims it twice, the same way the federal age-65 standard-deduction add-on works. Null means the state has no such deduction.
- **senior_deduction_min_age**: age at which a filer qualifies. The income model only knows "is this filer 65+", so a value other than 65 is applied as an approximation and flagged.
- **senior_deduction_per_qualifying_person**: if true (Montana), count each 65+ filer/spouse. If false, the amount is a household figure and is not doubled.
- **senior_deduction_tax_year**: tax year the stored amount is for.
- **senior_deduction_source_status**: `official` (published by the revenue department) or `calculated` (derived, e.g. from a statutory inflation formula). Do not store a calculated figure as if it were the agency's published amount.
- **senior_deduction_source_url** / **senior_deduction_verified_on**: where the amount and age were verified, and when. These amounts are typically inflation-adjusted annually.

Montana is the motivating case (issue #58): `ss_tax_treatment = taxed` with all SS threshold/age fields null, plus this senior subtraction. Encoding the subtraction as an SS exemption would misrepresent state law. `ss_tax_*` and `senior_deduction_*` are independent; a state can carry either, both, or neither.

Maintain `senior_deduction_*` with `scripts/migrate-senior-deduction-columns.ts` and `scripts/import-senior-deduction.ts` from `data/state_senior_deduction.csv`.

### Normalized state-owned facts

These fields are the normalized destination for facts that legacy city CSVs duplicated onto every `locations_location` row. Do not backfill them by picking an arbitrary city value; adjudicate conflicts from sources, store the source URL and verification date, and keep application reads compatible through the `lib/locations.ts` join.

- **StateParty** / **StatePartySourceUrl** / **StatePartyVerifiedOn**: Legacy compact governor-party shorthand (`R`/`D`) kept for `LocationRow` compatibility. Full state-government configuration and political-lean scoring live in `lib/state-politics-data.ts`.
- **Governor** / **GovernorSourceUrl** / **GovernorVerifiedOn**: Current governor party (`R`/`D`) and provenance.
- **IncomeTax** / **IncomeTaxSemantics** / **IncomeTaxSourceUrl** / **IncomeTaxVerifiedOn**: State individual income-tax value with explicit semantics, e.g. `top_marginal_individual_income_tax`.
- **MarijuanaStatus** / **MarijuanaStatusSourceUrl** / **MarijuanaStatusVerifiedOn**: State cannabis legal status and provenance.
- **LGBTQStatePolicyScore** / **LGBTQStatePolicySourceUrl** / **LGBTQStatePolicyVerifiedOn**: State policy score, separate from municipal HRC MEI/local friendliness.

Migrate with `scripts/migrate-state-owned-fields.ts`, then import sourced adjudications with `scripts/import-state-owned-fields.ts`. Audit remaining duplicated-location drift with `scripts/verify-state-field-divergence.ts`.

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
- **COL**: Cost of Living index (100 = national average). Legacy mixed-provider composite still used by the categorical Fit score; the affordability engine should not decompose it (see issue #52).
- **median_rent**: Monthly median gross rent in dollars (ACS 5-year table B25064). Gross rent includes utilities, matching the affordability model's renter housing term. Place-level matches are preferred; county fallbacks are listed in `data/sources/rent/match-report.md`. Refresh with `scripts/import-median-rent.ts`.
- **property_tax_rate**: Effective annual property tax as a fraction of home value (e.g. `0.01250` = 1.25%), not a percent. Refresh with `scripts/import-property-tax.ts`.
- **avg_home_value** / **avg_home_value_display**: Typical home value (ZHVI) used by ownership tenures in the affordability model.

### Regional price parities (`location_cost_rpp`)

BEA Regional Price Parities for the affordability engine. Joined 1:1 onto `locations_location` at query time. Not stored on the city table because the geography is metro/nonmetro with a vintage, and `col_index` must remain untouched for the categorical Fit score.

- **LocationId**: PK / FK to `locations_location`
- **VintageYear**: BEA RPP year (currently 2024)
- **BeaGeoType**: `msa` or `nonmetro_state`. Statewide SARPP is never used as a silent fallback.
- **BeaGeoCode** / **BeaGeoName**: BEA GeoFIPS and name (MSA code, or `ss999` for a state's nonmetropolitan portion)
- **GoodsRpp** / **HousingRpp** / **UtilitiesRpp** / **OtherServicesRpp**: components, `100 = US average`. Housing RPP is stored for audit; housing is priced from `median_rent` / `avg_home_value`.
- **SourceUrl** / **RetrievedOn**: provenance

Migrate with `scripts/migrate-location-cost-rpp.ts`, then import with `scripts/import-bea-rpp.ts`. Match report: `data/sources/rpp/match-report.md`.

### Spending profiles (`modest` / `typical`)

The affordability engine scales a named national basket, not a single leftover `col_index`. `modest` (default) is BLS Table 3254 2021–2022, reference person 65+ with income $15,000–$29,999, after removing housing, healthcare, cash contributions, and pensions. `typical` is the BLS 2024 65+ mean remainder. Housing is still priced from `median_rent` / `avg_home_value`; BEA goods and other-services RPPs scale only those slices. The profile is recorded on every estimate and must be explicit in any UI — never inferred from income.

> **Schema note (Phase 4 cleanup):** `has_va`, `tech_hub`, and `defense_hub` are stored as
> Booleans (the importer parses "Yes"/"No"/"Y"/"N"); `density` is stored as an integer; and
> `population` holds the full number (e.g. `915,927`). The legacy/duplicate columns `match_score`,
> `avg_price`, `va_distance`, `climate_detailed`, `pps`, and the old formatted `population` string
> have been removed. Ranking is computed at request time (see `calculate_baseline_score`), not stored.

### Veterans Affairs
- **VA**: Whether location has a nearby VA facility ("Yes"/"No" in CSV → Boolean `has_va`). `has_va` is the Explore "nearby" gate for both VA options.
- **NearestVA** / **DistanceToVA**: Nearest *outpatient-capable* VA health site (clinic/CBOC or medical center). Used by structural `va_outpatient_access`. Refresh with `scripts/sync-va-facilities.ts`.
- **NearestVAKind**: `hospital` or `outpatient` — the kind of `nearest_va`. Written by the VA sync. Explore `va_hospital` requires `has_va` and this to be `hospital` (name equality with `nearest_va_hospital` is the pre-sync fallback). `va_clinic` is outpatient-capable nearby (`has_va`), so a VAMC satisfies it.
- **NearestVAHospital** / **DistanceToVAHospital**: Nearest VA *medical center* (VAST parent / 3-character station). Used by structural `va_hospital_access`. Never treat clinic distance as hospital access. Almost every geocoded city has a named nearest hospital, so this field alone is not a "nearby" filter.
- **Veterans Benefits**: Additional veteran-specific benefits/tax breaks available

### Safety & Social
- **TCI**: Total Crime Index (lower is safer, national average = 100)
- **Marijuana**: Legal status (Recreational/Medical/Decriminalized/Illegal)
- **LGBTQ**: LGBTQ-friendly rating or community presence

### Economic Hubs
- **TechHub**: Whether location is a technology hub (Y/N)
- **DefenseHub**: Whether location has significant defense/military presence (Y/N). **Derived** — see [Defense hub (derived)](#defense-hub-derived); edit `defense_hub_manual`, never this column
- **DefenseHubManual**: The hand-curated input to `DefenseHub`. Three-valued: `null` means "never researched", which is not `false`

### Retail Access
- **HasWalmart** / **HasCostco**: Whether the city has an in-city Walmart or Costco location, sourced from official store/warehouse pages or another durable source. Stored as nullable booleans: `null` means unresearched or not yet backfilled, not a confirmed `false`.

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

## Location profile signals

`location_profile_signals` is an additive, explainable layer for city-profile observations that do not belong in a universal score or a narrow Explore filter. It is deliberately separate from `locations_location` so one city can have several sourced strengths, cautions, and neutral context notes without creating a wide, sparsely populated city table.

- **LocationId** / **SignalKey**: unique city-to-signal key. Keys are stable lowercase snake case, for example `us23_commute_friction`.
- **Dimension**: broad domain such as `community`, `commute`, `mobility`, `amenities`, `growth`, or `healthcare`.
- **Polarity** / **Strength**: `positive`, `caution`, or `neutral`, with an editorial magnitude from 1 through 5. These are profile-explanation inputs, not Fit-score weights or hard filters.
- **Label** / **Detail** / **Audience** / **GeographyScope**: concise user-facing wording, an optional affected audience, and whether evidence applies to the city or a wider corridor/region.
- **EvidenceKind** / **Confidence** / **SourceUrls** / **SourceRetrievedOn**: provenance. Community or Reddit sentiment must be marked as such and normally uses `limited` confidence; it cannot be presented as an objective city statistic.

The source file is `city-profile-stack/data/location-profile-signals.json`. Migrate with `city-profile-stack/scripts/migrations/migrate-location-profile-signals.ts`, then import with `city-profile-stack/scripts/import/import-location-profile-signals.ts`; imports upsert only the provided signals and do not delete unrelated city data.

## City profile stack (dossiers → signals → features)

Qualitative city research lives in four layers. Each is a different kind of claim, and the separation is the point — the raw reading, the human-readable observation, the quantified estimate, and the derived persona are not interchangeable.

**L0 `location_research_dossiers`** — the archive of record. The full narrative verbatim plus the structured JSON as delivered, with `analyst`, `source_urls`, `coverage` (strengths, limitations, gaps) and a sha256 `content_hash`. Nothing at request time reads this table; its job is to be what you re-derive from when the feature ontology changes, so a methodology revision never means re-doing the research. Append-only: an edited narrative lands as a new `revision` rather than overwriting. Source files are `city-profile-stack/data/dossiers/research-dossiers/<city>.{md,json}`.

**L1 `location_profile_signals`** — see above. Concise, sourced, user-facing observations.

**L2 `location_features`** — the quantified layer. One row per `(location_id, feature_key, provenance)`, `value` and `confidence` both 0..1.

- **Features describe the place, never the person.** `specialist_healthcare_access = 0.15` is a claim about Elko; `bad_for_people_with_complex_healthcare_needs` would be a claim about people and does not go in the database. The `best_for` / `less_suitable_for` lists from source research are archived in L0 as source material only.
- **`kind`** (in `city-profile-stack/lib/ontology.ts`, not the DB) determines what the number means: `capacity` (more is better — healthcare, job depth), `intensity` (a magnitude someone may seek or avoid — winter severity, isolation, wind), `position` (a spectrum with a neutral middle — political lean). Preference matching must branch on this; collapsing the three into one signed score is incoherent, because nobody "prefers more complex healthcare needs."
- **`provenance`** is `editorial` (extracted from a dossier), `derived_structural` (computed from columns we already store, available for every city), or `propagated` (inherited from similar cities — not yet implemented). Confidence ceilings are enforced on write: 0.9 / 0.85 / 0.4. A `propagated` value must never drive a hard filter.
- **Editorial and derived rows coexist deliberately.** The primary key includes `provenance` so both survive, which is what lets `city-profile-stack/scripts/tools/derive-structural-features.ts` print a calibration table of formula vs. researched ground truth. That table is how the extrapolation improves as dossiers accumulate.
- **`location_features_resolved`** (view) picks the winner per city and feature: editorial > derived_structural > propagated, then by confidence.

**L3 vectors** — built at query time from the resolved view, not stored. At ~110 cities a materialized vector table buys nothing. `city-profile-stack/scripts/tools/find-similar-locations.ts` compares only structurally derivable features, so a researched city is not judged unlike every unresearched one merely for having more data.

**Similarity is a profile, not a scalar, and ranking is conjunctive.** The first version averaged absolute differences across all features and ranked Sierra Vista AZ as the 3rd most similar city to Billings MT (0.854) — two places differing by ~56 inches of annual snow. One categorical mismatch was averaged against twenty near-matches and disappeared. Raising the norm did not help (Sierra Vista rose to 2nd at p=3): the aggregator's shape was never the problem. Compatibility between places is **conjunctive** — a city is "like" another only if nothing about it would blindside you — whereas a mean models the opposite, that abundance on one axis compensates for absence on another. Ranking therefore uses the **weakest category**, with overall as a tiebreak, and any feature diverging by ≥0.30 is reported outright. Sierra Vista now ranks 11th with `climate 0.71` and `snow_burden 0.61` named explicitly. Use `--explain "Other City, ST"` for a full pairwise profile.

Order of operations:

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-research-dossiers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-profile-signals.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-features.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-texture-markers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-research-dossiers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-location-profile-signals.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-location-features.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-texture-markers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/derive-structural-features.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/find-similar-locations.ts "Elko, NV"
```

Known limits of the structural layer, in descending size (all visible in the calibration table):

- **No wind, tourism, local-wage, growth, or hail column exists anywhere in the schema.** These five are the distinguishing features of the researched cities and none of them can be derived for the other 106. Each new dossier has added editorial-only dimensions faster than structural ones — 19 structural against 23 editorial as of the third city. Extrapolation covers the measurable half of a place, not the half that decides whether someone stays.
- **No river data**, so `water_recreation_access` under-reads any river city (Casper −0.35, Rapid City −0.36).
- **Climate features come from `location_weather_monthly`, not the coarse columns.** `avg_low_winter` is null for a third of the dataset and precipitation seasonality does not exist as a column at all. `winter_cold_severity` and `snow_burden` are deliberately separate — blending them into one `winter_severity` destroyed the distinction between a northern winter and a high-desert one, which is what let Billings and Sierra Vista look alike. `precipitation_seasonality` is a `position`: 1.0 is a summer monsoon, 0.0 is a cool-season peak, and two cities can match on annual total while feeling nothing alike.
- **`housing_value_for_size` is a residual against this curated dataset**, whose baseline is already expensive, so sitting on the trend line still means expensive nationally. All three dossiers call their city expensive for its size while the regression reads them as average.
- **The `crime` column disagrees with lived accounts** and mixes two grading vocabularies. Rapid City is graded `High` while its dossier reports residents who would drive anywhere at night. `perceived_everyday_safety` is capped at 0.5 confidence for this reason and any dossier overrides it.

Dossiers also catch curated-data errors: Rapid City was stored `near_mountains = false` despite being the Black Hills gateway, which suppressed its derived outdoor score by 0.30 until `data/geography-proximity.json` was corrected.

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

Military installations are stored separately from defense employers because a command is a public facility, not a contractor or job-posting footprint. This is the data layer for the **near a base** radius filter. It does **not** feed `defense_hub`.

Table: `military_installations`

- **ServiceBranch** / **CommandName**: The owning service and the official command name.
- **InstallationType** / **OperationalStatus**: Controlled descriptive fields (imports use `installation_command` and `active`).
- **Country** / **City** / **State**: The source-defined principal municipality, retained even when it does not match a curated retirement location.
- **Latitude** / **Longitude**: Authoritative *installation-site* coordinates (never a city centroid). Coordinate provenance is stored separately from identity provenance (`coordinate_source_kind`, `coordinate_source_url`, `coordinate_retrieved_on`, `coordinate_confidence`, `coordinate_notes`).
- **SourceKind** / **SourceUrl** / **SourceRetrievedOn** / **Notes**: Identity-ingest provenance from the branch-directory import.

Rows are unique on `(service_branch, command_name, country, city, state)`. Seeds are `data/{air_force,navy,army,marine_corps}_installations.json`, loaded by `scripts/import-military-installations.ts` after `scripts/migrate-military-installations.ts`. Coordinates merge from `data/{branch}_installations_coordinates.json` via `scripts/merge-military-installation-coordinates.ts`. One active installation (NSF Thurmont / Camp David) is intentionally ungeocoded; see `data/military_installation_coordinate_gaps.md`.

### `location_military_proximity`

Derived city↔installation distances. Not denormalized onto `locations_location`.

- **LocationId**: FK to `locations_location`, `ON DELETE CASCADE`
- **MilitaryInstallationId**: FK to `military_installations`, `ON DELETE CASCADE`
- **DistanceMiles**: Great-circle miles from the city centroid to the installation site (`numeric(8,2)`)
- **ComputedOn**: Sync timestamp. A rerun upserts the current cartesian product and deletes pairs whose `computed_on` is not this run.
- **PRIMARY KEY** `(location_id, military_installation_id)`

Only geocoded cities and geocoded *active* installations are paired. Recompute with `scripts/sync-military-proximity.ts` after a coordinate merge or a city add. Cities without centroids (currently McHenry, MS) and installations without a site-level point (currently NSF Thurmont / Camp David) are omitted, not guessed. The Explore / API `near_base` facet reads a compact nearest-overall + nearest-per-branch index (`lib/military.ts`); `defense_hub` is unchanged.

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
