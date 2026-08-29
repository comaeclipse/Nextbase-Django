# CLAUDE.md

Guidance for agents working in this repository.

**Collaboration rules (branching, data changes, the stale-branch trap) live in [AGENTS.md](AGENTS.md).** Read it before opening a PR.

## Project Overview

**VetRetire** is a **Next.js 16** (App Router) + **React 19** + **TypeScript** web app that helps military veterans find retirement locations, with filters for climate, cost of living, lifestyle, healthcare/VA access, safety, and LGBTQ friendliness.

It was migrated from Django in 2026 (the Django implementation is in git history). The app reads the **existing Neon PostgreSQL** schema directly, keeping the original table/column names (`locations_location`, `locations_stateinfo`).

## Stack

- Next.js 16 App Router, React 19, TypeScript
- `@neondatabase/serverless` for direct Neon Postgres access (read-only in the app)
- Tailwind v4 + shadcn/ui (`app/styles/shadcn.css`) — **opt-in per route**: a route imports it from its own `layout.tsx`, never from the root layout, because Tailwind's Preflight reset breaks the two pixel-parity pages. Most routes now use it (explore, city climate, and every data page)
- `@base-ui/react` for the shadcn primitives (not Radix), `recharts` for charts
- d3 + topojson-client + us-atlas for the explore map

## Setup & Commands

```bash
npm install
# .env (gitignored) must contain DATABASE_URL (Neon connection string)
npm run dev        # http://localhost:3000
npm run build      # production build
npx tsc --noEmit   # typecheck
npm test           # vitest unit tests
```

Data scripts (run with tsx + the env file):

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-csv.ts <csv> [--clear] [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/categorize-climate.ts [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify_scores.ts   # scoring regression vs baselines/django_scores.json
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-state-weather-indices.ts [--dry-run]  # /uv -> state_weather_indices
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-geo-hierarchy.ts [--dry-run]           # geo_type/is_candidate/slug + geo_relationships + geo_aliases
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-geo-hierarchy.ts                        # cycles, column-vs-table drift, orphan aliases
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-gas-prices.ts [--dry-run]             # /gas -> state_gas_prices
```

Pace classification (lifestyle / settlement type):

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-pace-classifications.ts [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/prepare-pace-sources.ts [--skip-download]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/classify-pace.ts --all [--dry-run]
# also: --id N | --name "City, ST"
```

Defense employers (run in this order; each takes `--dry-run`):

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-defense-employers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-rtx-employer-locations.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts
```

Military proximity (near a base; independent of `defense_hub`):

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/merge-military-installation-coordinates.ts [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-military-proximity.ts [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/sync-military-proximity.ts [--dry-run]
```

Mosques (`/mosques`, sourced from OpenStreetMap; run in this order):

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-mosques-overpass.ts [--dry-run]  # writes data/mosques_overpass_v<n>_<date>.json, no DB access
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-mosques.ts [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-mosques.ts data/mosques_overpass_v<n>_<date>.json [--dry-run] [--prune]
```

Defense job listings (`/defense-jobs`, scraped ATS CSV; run in this order):

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-defense-employers.ts       # seeds the CSV companies (Shield AI, Palantir, Saronic, Vannevar Labs, Kratos)
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-defense-job-listings.ts [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-defense-job-listings.ts <csv> [--clear] [--dry-run]  # upserts on URL; re-runnable
```

## Structure

```
app/
  globals.css           # the only always-loaded sheet (root layout): html/body reset
  page.tsx              # home (pixel-parity, .home-page wrapper)
  explore/              # layout.tsx imports shadcn.css; page.tsx -> <ExploreClient>
  city/[id]/page.tsx    # Zillow-style city detail (pixel-parity, .city-page wrapper)
  city/[id]/climate/    # per-city climate dashboard (Tailwind + recharts)
  api/locations/route.ts# filter/sort API (query params below) — unused by the UI
  api/chat/route.ts     # city-profile chat endpoint
  profile/              # saved dealbreakers -> ProfileClient (shadcn opt-in)
  # 22 routes total. Besides the above, each of these is a standalone data
  # page (all shadcn-opt-in via their own layout.tsx):
  #   /air-quality /chat /critters /electricity /gas /gun-freedom /insurance
  #   /mosques /politics /uv /veteran-benefits /weather /map /quiz /quiz2
  #   /benefits/california /heatmap-demo
  styles/*.css          # copied-verbatim page CSS (home/city/map/quiz), UNLAYERED
  styles/shadcn.css     # Tailwind + shadcn; imported per-route from a layout.tsx
components/
  explore/              # ExploreFilterBar (the demo-style filter bar)
  city-climate/         # CityClimateDashboard
  mosques/              # MosquesMap + MosqueDotLayer (unclustered MapLibre circle layers)
  ui/                   # shadcn primitives on @base-ui/react
lib/                    # the load-bearing modules:
  db.ts                 # lazy Neon client (getSql)
  types.ts              # LocationRow/StateInfoRow (snake_case, mirrors DB)
  locations.ts          # read-only queries (ORDER BY featured DESC, name ASC)
  scoring.ts            # editorial "Fit" score (5 factors x 20%), pyRound
  filters.ts            # filter + sort (mirrors old views.filter_locations)
  military.ts           # near-base proximity index + matching
  climate.ts            # climate-normals shaping: diurnal anchoring, dew point
  affordability.ts      # monthly cost model + rankByBudget / rankByHeadroom
  housing-burden.ts     # 30%-of-gross burden family: PITI, required income, bands
  affordability-scenario.ts # user scenario: tenure, spending profile, coverage
  cost-constants.ts     # COST_CONSTANTS, spending profiles, health coverage
  income.ts             # net income: federal brackets, SS taxability, senior add-on
  tax-constants.ts      # TAX_CONSTANTS, TAX_YEAR (2026), per-state tax profiles
  location-completeness.ts # per-row data-completeness gate
  pace/                 # retirement-pace classifier (RUCA + EPA)
  states.ts             # state-name -> USPS abbr
  # the rest back one data page each: electricity, gas-prices, insurance,
  # critters, housing-market, mosques, quiz, quiz2, state-*.ts, utils.ts
scripts/                # data + verification scripts
baselines/              # parity references (django_scores.json used by tests)
```

## Key domain logic

- **Fit score** (`lib/scoring.ts`): five equally weighted factors — LGBTQ friendliness, VA access, cost of living, home affordability, safety. Uses Python-compatible round-half-to-even (`pyRound`). `defense_hub` is **not** a scoring factor.
- **Defense hub** (`lib/defense.ts`): `defense_hub` is derived, not curated — `manual === false ? false : presence ? true : manual`, where presence = ≥1 onsite+hybrid RTX opening (a physical facility). Any facility promotes; an explicit `defense_hub_manual = false` vetoes. Edit `defense_hub_manual`, never `defense_hub`. See SCHEMA.md.
- **Near a base** (`lib/military.ts`): independent of `defense_hub`. Distances live in `location_military_proximity` (every geocoded city × every geocoded active installation). Explore / API `near_base` + optional `base_branch` (`army|navy|air_force|marine_corps`) + `base_max_distance` (`25|50|100`, default 50) filter that index. City pages show the named nearest installation. Recompute with `scripts/sync-military-proximity.ts` after a coordinate merge. One installation (NSF Thurmont) is ungeocoded by design; see `data/military_installation_coordinate_gaps.md`.
- **Defense ecosystem** (`lib/defense.ts` `hasDefenseEmployerSignal()`): Explore / API `defense_ecosystem=true` matches physical defense-employer presence (onsite+hybrid, `counts_as_defense`). It does **not** use `defense_hub`, which also includes manually designated base towns. Specific `employers` filtering stays independent (any posting count, including remote).
- **VA healthcare facet** (`lib/filters.ts`): `healthcare=va_hospital` is nearby medical-center access (`has_va` and `nearest_va_kind=hospital`). `healthcare=va_clinic` is nearby outpatient-capable access (`has_va`); a VAMC satisfies it. `has_va` is the 25-mile crow-fly gate written by `scripts/sync-va-facilities.ts` (`OUTPATIENT_ACCESS_RADIUS_MI`), not an in-city flag. Selecting both is OR within the facet. Persist `nearest_va_kind` with `scripts/migrate-va-hospital-fields.ts` then `scripts/sync-va-facilities.ts`.
- **Affordability** (`lib/affordability.ts`, `affordability-scenario.ts`, `income.ts`, `cost-constants.ts`, `tax-constants.ts`): separate from the Fit score and not a factor in it. A scenario is `tenure` (`rent` | `own_outright` | `buying`) x `spendingProfile` (`modest` | `typical`) x `healthCoverage` (`medicare_supplement` | `va_primary` | `tricare_prime` | `tricare_select` | `tricare_for_life`) x `cushion`, plus optional housing overrides. **`scenarioEstimateOptions` is the single scenario→options mapping** — the city card and `/explore` both use it, so the two surfaces can never price the same scenario differently (married filing → couple basket lives there). TRICARE prices the Group A retiree enrollment fee, and a couple pays the **family rate, never 2× individual** (DHA family-rate rule); TFL has no fee — its cost is Medicare Part B per beneficiary. Every banding function takes an optional `comfortShare` (from `cushionShare`; default `COMFORT_COST_SHARE`) — whatever share bands must also feed `incomeTargets`. `estimateMonthlyCost` builds the household monthly cost from those; `estimateNetMonthlyIncome` nets income through `FEDERAL_BRACKETS`, state tax profile, SS taxability (`taxableSocialSecurity`, `ssAgeGate`) and the age-65+ `seniorBonusDeduction`. Two rankings: `rankByBudget` (fits a fixed budget) and `rankByHeadroom` (income minus cost, the `headroom_desc` sort). `incomeTargets` inverts the model — the monthly *take-home* a city takes to break even / band comfortable (`COMFORT_COST_SHARE`, the same 0.8 the bands use) — and drives the no-input at-a-glance table on the city card; targets are after-tax on purpose, since grossing up depends on the income mix. `quickCheck` (issue #108) turns one net take-home number into a five-band verdict (`way_out_of_range` → `comfortable`) that provably **refines** the three `Band`s — shared boundaries reuse the band's own comparisons, and the top boundary is `incomeTargets().comfortable`, never a hand-written 1.25. `household: "single" | "couple"` scales the consumption slices via `coupleSliceMultipliers` — an interpolation to each profile's published household size (1.3 modest / 1.8 typical), **not** the raw BLS two-person/one-person ratio, which would double-count the >1-person base — and doubles the per-enrollee Medicare premiums; housing stays per dwelling. Constants are TY`TAX_YEAR` (2026) and carry provenance — `missingConstants` / `missingTaxConstants` surface gaps rather than guessing, and `AFFORDABILITY_DISCLAIMER` must accompany user-facing output. `col_index`/`cost_of_living` (used by the Fit score, separate from this affordability engine) are also derived from `location_cost_rpp.all_items_rpp` via `scripts/sync-col-index-from-rpp.ts`, rather than hand-researched. `lib/housing-burden.ts` (issue #170) is a **second, gross-income metric family** beside the residual model, for job-salary contexts: `estimatePitiMonthly` (P&I + tax + insurance + HOA — maintenance and utilities deliberately excluded and disclosed via `notPriced`), `requiredIncomeGross` (the HUD 30% rule, ceiled so a printed figure always satisfies its own band), five presentation-only `BurdenBand`s over continuous values, and `cityHousingBurden` comparing `entry_home_value` (ACS 25th-percentile stock value) vs the typical home. It never replaces headroom/quickCheck — different question, different income basis.
- **Pace / lifestyle** (`lib/pace/`): `urban` | `suburban` | `small_town` | `rural` from `location_pace_current` (RUCA + EPA SLD). The `lifestyle` filter matches `pace_category`; there is no density fallback. See SCHEMA.md and `PACE_CLASSIFICATION_PLAN.md`.
- **City profile stack** (`city-profile-stack/`): **read `city-profile-stack/PRODUCT.md` first** — it states the goal in plain words (answer "what's like Elko?" and "best city for this kind of person?" from the DB, with cited evidence and honest "I don't know"s). Both already run via `scripts/tools/find-similar-locations.ts` and `match-profile.ts`. Do not re-explain the goal in new jargon; point here. The rest of this bullet is the internal model. Qualitative research in four layers — raw dossier (`location_research_dossiers`, archive of record) → signals (`location_profile_signals`, user-facing observations) → features (`location_features`, 0..1 quantified, `editorial` / `derived_structural` / `propagated`) → vectors built at query time. Features describe **places, not people**; personas are derived at read time, never stored. Each feature has a `kind` — `capacity` / `intensity` / `position` — and preference matching must branch on it. `city-profile-stack/scripts/tools/derive-structural-features.ts` extrapolates to all 141 cities and prints a formula-vs-ground-truth calibration table. See SCHEMA.md.
- **Climate** (`lib/climate.ts`, `/city/[id]/climate`): temperature comes from `location_weather_monthly`, moisture from `location_hourly_normals` — never mix them (SCHEMA.md:345; the hourly station can be 50+ mi away, so its dew point travels but its `temp_f` doesn't). `buildDiurnal` rescales each month's hourly curve onto that month's `avg_low_f`/`avg_high_f` and recomputes heat index from the anchored temp; it's the only derived number on the page and the footnote says so. Monthly `humidity_pct`/`sun_pct` are **100% NULL** by design — GHCN monthly normals carry no humidity element.
- **Saved preferences** (`lib/profile.ts`, `/profile`): the visitor's state-level **dealbreakers**, persisted in the versioned `vr_profile_v1` cookie (same pattern as `lib/quiz.ts`, decoded server-side so the first paint is already personalized; a version bump discards rather than migrates). They are **hard filters, not a Fit-score factor** — `calculateBaselineScore` is untouched, and what changes is only *which* cities get ranked. The soft-weight path (`calculatePersonalizedScore` / `PersonalizedWeights`) still belongs to `/quiz2` alone. `preferencesToFilterParams` maps them onto the existing shared `FilterParams` so `/profile`'s live count, `/explore`, and `/api/locations` all run the same `filterAndSort`; an untouched profile maps to all-null (a no-op). `/explore` composes them with `applyPreferenceFloor`, which is an **intersection, not a default** — the filter bar can narrow further but can never widen past a saved dealbreaker. `blockedByPreferences` explains an incompatible city on `/city/[id]` instead of hiding it. Adding a facet = one `PREFERENCE_FACETS` entry + one line in the mapper.
- **Gun Freedom Index** (`lib/state-gun-freedom.ts`): a curated 0–100 policy rubric hardcoded in TS for all 50 states — **not a DB column**, unlike `assault_weapons_ban`/`high_cap_mag_ban` on `locations_stateinfo`. `gunFreedomIndex(abbr)` backs the `gun_freedom_min` filter; a state missing from the dataset is **kept**, matching how the three-valued DB booleans treat an unrecorded law (never claim a ban that is only a NULL). VA and NJ carry `legalStatus: "Unsettled"` (bans enjoined / in litigation) and are surfaced as a caveat rather than silently bucketed.
- **`/api/locations`** query params: `snow, no_awb, no_hcm, gun_freedom_min, state_filter, lgbtq_friendly, climate, cost_of_living, price_min, price_max, lifestyle, healthcare, activities, geography, income_tax, no_income_tax, retired_pay_tax, disabled_vet_property_tax, employment_preference, education_benefit, parks_benefit, hunt_fish_benefit, vibes, employers, defense_ecosystem, has_costco, has_walmart, near_base, base_branch, base_max_distance, sort`. Response: `{ totalResults, locations }`. `lifestyle` accepts `urban,suburban,small_town,rural`. `base_branch` accepts `army,navy,air_force,marine_corps`. `base_max_distance` accepts `25,50,100`. `defense_ecosystem`, `has_costco`, and `has_walmart` accept `true`. `healthcare` accepts `va_hospital,va_clinic` (OR within the facet). **Nothing in the UI calls this** — `/explore` filters client-side via the same `filterAndSort`.
- **Veteran-benefit filters** (`lib/filters.ts`, from `locations_stateinfo`): the boolean facets `no_income_tax, disabled_vet_property_tax, employment_preference, education_benefit, parks_benefit, hunt_fish_benefit` accept only `true` and match a state whose verified column **IS TRUE** — never `= false`, because these columns are three-valued (NULL = "source summary was silent", not "benefit absent"). `retired_pay_tax` takes comma-separated enum values to include (`no_income_tax,exempt,partial,conditional,taxed`). Every facet matches only rows with `vet_benefits_verified_on` set. Explore surfaces two of them today — "No state income tax" (`no_income_tax=true`) and "Military retirement not taxed" (`retired_pay_tax=no_income_tax,exempt`, excluding `partial`/`conditional` so a gated retiree isn't misinformed). The legacy per-city `locations_location.veterans_benefits` column was dropped (issue #6, `scripts/migrate-drop-veterans-benefits-column.ts`); the city page + `lib/locations.ts` derive the summary from the verified `vet_benefits_summary`.
- **Mosques** (`lib/mosques.ts`, `lib/mosque-matching.ts`, `/mosques`): a standalone national point map, independent of `locations_location` — not tied to a curated retirement city, not a Fit-score factor. Sourced from OpenStreetMap via `scripts/fetch-mosques-overpass.ts` → `scripts/migrate-mosques.ts` → `scripts/import-mosques.ts`. **Which OSM elements count as a mosque lives in `lib/mosque-matching.ts`, not in the query** — the Overpass call casts wide (`amenity=place_of_worship`+`religion=muslim`, `building=mosque`, any `religion=muslim`, mosque-named `place_of_worship`) and `classify()` then admits each element under one of four `MATCH_RULES` ordered by confidence, dropping Islamic schools, Muslim cemeteries and non-Muslim sites. `dedupe()` collapses elements within `DEDUPE_METERS` **only when their names are compatible** — proximity alone merges distinct mosques that share a block. The v1 rule (`amenity_religion`) always wins a merge, so a refresh can only add `(osm_type, osm_id)` pairs, never swap one; `--prune` on the importer is what removes the losers, since upsert cannot delete. Snapshots are versioned (`QUERY_VERSION`) because the rules, not just the data, change. `MosquesMap` (`components/mosques/`) does **not** cluster and does **not** use one `MapMarker` DOM node per mosque — neither scales to ~1,200+ points, and clustering hid the national density pattern the page exists to show. `MosqueDotLayer` renders every mosque through four MapLibre circle layers over one unclustered GeoJSON source, cross-fading by zoom: `heat` (a plasma density surface, gone by z14), `glow` (a blurred halo past z8), `dots` (the tiny national dots, faded out by z10) and `points` (the stroked marker, faded in from z9.6). The paint expressions are copied from maps.deflock.org. A Dots/Heatmap toggle picks between the first and the rest; `points` stays on in both so the map is never blank where the heatmap has faded out. Clicks bind to `dots` as well as `points`, because the page opens at z3.3 where `points` is still invisible — see SCHEMA.md.
- **Defense job listings** (`lib/defense-jobs.ts`, `lib/defense-jobs-sectors.ts`, `/defense-jobs`): a standalone table of *individual* scraped job listings (`defense_job_listings`, one row per opening: title, pay, apply URL), imported from `master_defense_jobs.csv` by `scripts/import-defense-job-listings.ts` (upsert on `url`, re-runnable). Distinct in granularity from `defense_employer_locations`, which holds *aggregate per-city posting counts* — the page keeps the two apart on purpose: listings render as solid, count-sized city dots; tracked-employer aggregate counts (Raytheon et al., only those with coordinates) render as **dashed "count-only" markers** the user toggles on, labeled as such. The **broad sector** filter is *derived*, not from the CSV's company-specific `Field` (which is a business unit — "X-BAT Division", "Hivemind") — `classifySector()` in `lib/defense-jobs-sectors.ts` maps title→one of nine cross-employer sectors (unit-tested); the raw `Field` is kept as a per-listing sub-team tag (both, per the user's choice). US cities are geocoded via a small hardcoded table in the importer (~25 cities); international rows stay in the list, off the US map. The four CSV companies (Shield AI, Palantir, Saronic, Vannevar Labs) plus Kratos are seeded into `DEFENSE_EMPLOYER_SEEDS` so listings link an `employer_slug` and the employer filter is unified. Not a Fit-score factor; independent of `locations_location`. **The page never ships all ~12k listings to the client** (that made a 34MB document): the server component renders only page 1 + the filter-chip facets + a city-level map aggregation + the tracked-employer counts, and `DefenseJobsExplorer` fetches everything else from two routes — `/api/defense-jobs` (filtered, paginated listings, 50/page, "Load more") and `/api/defense-jobs/map` (city `GROUP BY` rollup with a per-employer `jsonb_agg` breakdown, refetched only when filters change, not on pagination). Filtering is **server-side** via a shared parameterized WHERE builder (`buildWhere`/`parseDefenseJobFilter` in `lib/defense-jobs.ts`), so the chips/search/city-select are SQL, not client-side array filtering; LIKE wildcards in search are escaped to stay a literal substring match. The empty-filter initial reads are `unstable_cache`d (`getDefenseJobInitialListings`/`getDefenseJobInitialMap`, 300s, `defense-jobs` tag); the page stays `force-dynamic`. Selecting a city still collapses the map to that one dot (parity with the old client behavior). `getDefenseJobListings` (whole-table read) is retained but unused by the page.
- **Geography & inheritance** (`lib/geo-inheritance.ts`, `scripts/migrate-geo-hierarchy.ts`): a `locations_location` row is a **place**, not necessarily a city and not necessarily a retirement candidate. `geo_type` (`city|neighborhood|cdp|county|metro`) says what it *is*; **`is_candidate` is the ranking gate** and every ranked surface filters on that, never on `geo_type`. Los Angeles is `geo_type='city', is_candidate=false` — it exists so Canoga Park has a municipality to inherit sales tax and RPP from, and must never be ranked. Containment lives in `geo_relationships` (typed, multi-parent, time-bounded) with `parent_geo_id` as the canonical fast path; the duplication is checked by `scripts/verify-geo-hierarchy.ts`, not trusted. Inheritance is **per-field, not copy-from-parent**: `sales_tax` comes from the municipality, `property_tax_rate` from the county, `col_index` from the metro, climate from the nearest station, VA access is **recomputed** from the row's own coordinates, and `population`/`density`/`median_rent`/`avg_home_value` are never inherited at all. Every resolved value carries provenance (`direct|inherited|derived|absent`), and `crime`/`tci`/elections are `context_only` — they describe a wider jurisdiction and must not render without a source label. `FIELD_RESOLUTION` is `satisfies Record<InheritableField, FieldRule>`, so **adding a column to `LocationRow` without declaring a policy is a compile error**. The Fit Score is suppressed where `is_candidate` is false. Defense employer presence **rolls up** the graph (a Canoga Park facility promotes Canoga Park *and* Los Angeles) and never down. Note `locations_location` carries an `AFTER INSERT` trigger, `trg_link_city_to_employer_locations`, that back-links employer rows by exact `(city, state)` — inserting a place resolves its postings with no importer run. See SCHEMA.md.
- **Pixel parity is a hard requirement** for `/` and `/city/[id]`. Their CSS is copied verbatim into `app/styles/{home,city}.css` and left **unlayered** so it always beats any Tailwind base. Do not introduce global Tailwind/Preflight.
- **Never give those sheets a document-wide selector.** Next keeps a visited route's stylesheet in the document across client-side navigations, so an unlayered `* { margin: 0; padding: 0 }` outlives its own page and flattens every Tailwind utility on whatever you browse to next (this silently broke all nine data routes when reached from `/` or a city page). Their globals are scoped `:where(.home-page)` / `:where(.city-page)` — `:where()` keeps specificity at zero, so the cascade on those pages is unchanged. `/map` uses the same `.map-page` pattern. Keep new global rules out, or scope them the same way.

## Deployment

Vercel, `framework: nextjs` (see `vercel.json`). Requires `DATABASE_URL` in the Vercel project env (provided by the Neon integration). Pages that read the DB use `export const dynamic = "force-dynamic"`.

## Notes

- Three data-maintenance commands were not ported from Django and live only in git history: `import_state_info`, `update_state_law_data`, `update_lgbtq_data`. Port to TS (like `scripts/import-csv.ts`) when next needed.
- `SCHEMA.md` documents the (unchanged) database schema.
