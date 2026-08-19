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
  # 20 routes total. Besides the above, each of these is a standalone data
  # page (all shadcn-opt-in via their own layout.tsx):
  #   /air-quality /chat /critters /electricity /gas /gun-freedom /insurance
  #   /politics /uv /veteran-benefits /weather /map /quiz /quiz2
  #   /benefits/california /heatmap-demo
  styles/*.css          # copied-verbatim page CSS (home/city/map/quiz), UNLAYERED
  styles/shadcn.css     # Tailwind + shadcn; imported per-route from a layout.tsx
components/
  explore/              # ExploreFilterBar (the demo-style filter bar)
  city-climate/         # CityClimateDashboard
  ui/                   # shadcn primitives on @base-ui/react
lib/                    # 32 modules; the load-bearing ones:
  db.ts                 # lazy Neon client (getSql)
  types.ts              # LocationRow/StateInfoRow (snake_case, mirrors DB)
  locations.ts          # read-only queries (ORDER BY featured DESC, name ASC)
  scoring.ts            # editorial "Fit" score (5 factors x 20%), pyRound
  filters.ts            # filter + sort (mirrors old views.filter_locations)
  military.ts           # near-base proximity index + matching
  climate.ts            # climate-normals shaping: diurnal anchoring, dew point
  affordability.ts      # monthly cost model + rankByBudget / rankByHeadroom
  affordability-scenario.ts # user scenario: tenure, spending profile, coverage
  cost-constants.ts     # COST_CONSTANTS, spending profiles, health coverage
  income.ts             # net income: federal brackets, SS taxability, senior add-on
  tax-constants.ts      # TAX_CONSTANTS, TAX_YEAR (2026), per-state tax profiles
  location-completeness.ts # per-row data-completeness gate
  pace/                 # retirement-pace classifier (RUCA + EPA)
  states.ts             # state-name -> USPS abbr
  # the rest back one data page each: electricity, gas-prices, insurance,
  # critters, housing-market, quiz, quiz2, state-*.ts, utils.ts
scripts/                # data + verification scripts
baselines/              # parity references (django_scores.json used by tests)
```

## Key domain logic

- **Fit score** (`lib/scoring.ts`): five equally weighted factors — LGBTQ friendliness, VA access, cost of living, home affordability, safety. Uses Python-compatible round-half-to-even (`pyRound`). `defense_hub` is **not** a scoring factor.
- **Defense hub** (`lib/defense.ts`): `defense_hub` is derived, not curated — `manual === false ? false : presence ? true : manual`, where presence = ≥1 onsite+hybrid RTX opening (a physical facility). Any facility promotes; an explicit `defense_hub_manual = false` vetoes. Edit `defense_hub_manual`, never `defense_hub`. See SCHEMA.md.
- **Near a base** (`lib/military.ts`): independent of `defense_hub`. Distances live in `location_military_proximity` (every geocoded city × every geocoded active installation). Explore / API `near_base` + optional `base_branch` (`army|navy|air_force|marine_corps`) + `base_max_distance` (`25|50|100`, default 50) filter that index. City pages show the named nearest installation. Recompute with `scripts/sync-military-proximity.ts` after a coordinate merge. One installation (NSF Thurmont) is ungeocoded by design; see `data/military_installation_coordinate_gaps.md`.
- **Defense ecosystem** (`lib/defense.ts` `hasDefenseEmployerSignal()`): Explore / API `defense_ecosystem=true` matches physical defense-employer presence (onsite+hybrid, `counts_as_defense`). It does **not** use `defense_hub`, which also includes manually designated base towns. Specific `employers` filtering stays independent (any posting count, including remote).
- **VA healthcare facet** (`lib/filters.ts`): `healthcare=va_hospital` is nearby medical-center access (`has_va` and `nearest_va_kind=hospital`). `healthcare=va_clinic` is nearby outpatient-capable access (`has_va`); a VAMC satisfies it. `has_va` is the 25-mile crow-fly gate written by `scripts/sync-va-facilities.ts` (`OUTPATIENT_ACCESS_RADIUS_MI`), not an in-city flag. Selecting both is OR within the facet. Persist `nearest_va_kind` with `scripts/migrate-va-hospital-fields.ts` then `scripts/sync-va-facilities.ts`.
- **Affordability** (`lib/affordability.ts`, `affordability-scenario.ts`, `income.ts`, `cost-constants.ts`, `tax-constants.ts`): separate from the Fit score and not a factor in it. A scenario is `tenure` (`rent` | `own_outright` | `buying`) x `spendingProfile` (`modest` | `typical`) x `healthCoverage` (`medicare_supplement` | `va_primary`). `estimateMonthlyCost` builds the household monthly cost from those; `estimateNetMonthlyIncome` nets income through `FEDERAL_BRACKETS`, state tax profile, SS taxability (`taxableSocialSecurity`, `ssAgeGate`) and the age-65+ `seniorBonusDeduction`. Two rankings: `rankByBudget` (fits a fixed budget) and `rankByHeadroom` (income minus cost, the `headroom_desc` sort). Constants are TY`TAX_YEAR` (2026) and carry provenance — `missingConstants` / `missingTaxConstants` surface gaps rather than guessing, and `AFFORDABILITY_DISCLAIMER` must accompany user-facing output.
- **Pace / lifestyle** (`lib/pace/`): `urban` | `suburban` | `small_town` | `rural` from `location_pace_current` (RUCA + EPA SLD). The `lifestyle` filter matches `pace_category`; there is no density fallback. See SCHEMA.md and `PACE_CLASSIFICATION_PLAN.md`.
- **City profile stack** (`city-profile-stack/`): **read `city-profile-stack/PRODUCT.md` first** — it states the goal in plain words (answer "what's like Elko?" and "best city for this kind of person?" from the DB, with cited evidence and honest "I don't know"s). Both already run via `scripts/tools/find-similar-locations.ts` and `match-profile.ts`. Do not re-explain the goal in new jargon; point here. The rest of this bullet is the internal model. Qualitative research in four layers — raw dossier (`location_research_dossiers`, archive of record) → signals (`location_profile_signals`, user-facing observations) → features (`location_features`, 0..1 quantified, `editorial` / `derived_structural` / `propagated`) → vectors built at query time. Features describe **places, not people**; personas are derived at read time, never stored. Each feature has a `kind` — `capacity` / `intensity` / `position` — and preference matching must branch on it. `city-profile-stack/scripts/tools/derive-structural-features.ts` extrapolates to all 141 cities and prints a formula-vs-ground-truth calibration table. See SCHEMA.md.
- **Climate** (`lib/climate.ts`, `/city/[id]/climate`): temperature comes from `location_weather_monthly`, moisture from `location_hourly_normals` — never mix them (SCHEMA.md:345; the hourly station can be 50+ mi away, so its dew point travels but its `temp_f` doesn't). `buildDiurnal` rescales each month's hourly curve onto that month's `avg_low_f`/`avg_high_f` and recomputes heat index from the anchored temp; it's the only derived number on the page and the footnote says so. Monthly `humidity_pct`/`sun_pct` are **100% NULL** by design — GHCN monthly normals carry no humidity element.
- **`/api/locations`** query params: `snow, no_awb, no_hcm, state_filter, lgbtq_friendly, climate, cost_of_living, price_min, price_max, lifestyle, healthcare, activities, geography, income_tax, no_income_tax, retired_pay_tax, disabled_vet_property_tax, employment_preference, education_benefit, parks_benefit, hunt_fish_benefit, vibes, employers, defense_ecosystem, has_costco, has_walmart, near_base, base_branch, base_max_distance, sort`. Response: `{ totalResults, locations }`. `lifestyle` accepts `urban,suburban,small_town,rural`. `base_branch` accepts `army,navy,air_force,marine_corps`. `base_max_distance` accepts `25,50,100`. `defense_ecosystem`, `has_costco`, and `has_walmart` accept `true`. `healthcare` accepts `va_hospital,va_clinic` (OR within the facet). **Nothing in the UI calls this** — `/explore` filters client-side via the same `filterAndSort`.
- **Veteran-benefit filters** (`lib/filters.ts`, from `locations_stateinfo`): the boolean facets `no_income_tax, disabled_vet_property_tax, employment_preference, education_benefit, parks_benefit, hunt_fish_benefit` accept only `true` and match a state whose verified column **IS TRUE** — never `= false`, because these columns are three-valued (NULL = "source summary was silent", not "benefit absent"). `retired_pay_tax` takes comma-separated enum values to include (`no_income_tax,exempt,partial,conditional,taxed`). Every facet matches only rows with `vet_benefits_verified_on` set. Explore surfaces two of them today — "No state income tax" (`no_income_tax=true`) and "Military retirement not taxed" (`retired_pay_tax=no_income_tax,exempt`, excluding `partial`/`conditional` so a gated retiree isn't misinformed). The legacy per-city `locations_location.veterans_benefits` column is no longer read (city page + `lib/locations.ts` derive the summary from the verified `vet_benefits_summary`) and is slated for removal by a follow-up migration.
- **Pixel parity is a hard requirement** for `/` and `/city/[id]`. Their CSS is copied verbatim into `app/styles/{home,city}.css` and left **unlayered** so it always beats any Tailwind base. Do not introduce global Tailwind/Preflight.
- **Never give those sheets a document-wide selector.** Next keeps a visited route's stylesheet in the document across client-side navigations, so an unlayered `* { margin: 0; padding: 0 }` outlives its own page and flattens every Tailwind utility on whatever you browse to next (this silently broke all nine data routes when reached from `/` or a city page). Their globals are scoped `:where(.home-page)` / `:where(.city-page)` — `:where()` keeps specificity at zero, so the cascade on those pages is unchanged. `/map` uses the same `.map-page` pattern. Keep new global rules out, or scope them the same way.

## Deployment

Vercel, `framework: nextjs` (see `vercel.json`). Requires `DATABASE_URL` in the Vercel project env (provided by the Neon integration). Pages that read the DB use `export const dynamic = "force-dynamic"`.

## Notes

- Three data-maintenance commands were not ported from Django and live only in git history: `import_state_info`, `update_state_law_data`, `update_lgbtq_data`. Port to TS (like `scripts/import-csv.ts`) when next needed.
- `SCHEMA.md` documents the (unchanged) database schema.
