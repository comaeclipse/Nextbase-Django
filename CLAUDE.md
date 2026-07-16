# CLAUDE.md

Guidance for agents working in this repository.

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

## Structure

```
app/
  globals.css           # the only always-loaded sheet (root layout): html/body reset
  page.tsx              # home (pixel-parity, .home-page wrapper)
  explore/              # layout.tsx imports shadcn.css; page.tsx -> <ExploreClient>
  city/[id]/page.tsx    # Zillow-style city detail (pixel-parity, .city-page wrapper)
  city/[id]/climate/    # per-city climate dashboard (Tailwind + recharts)
  api/locations/route.ts# filter/sort API (query params below) — unused by the UI
  styles/*.css          # copied-verbatim page CSS (home/city/map/quiz), UNLAYERED
  styles/shadcn.css     # Tailwind + shadcn; imported per-route from a layout.tsx
components/
  explore/              # ExploreFilterBar (the demo-style filter bar)
  city-climate/         # CityClimateDashboard
  ui/                   # shadcn primitives on @base-ui/react
lib/
  db.ts                 # lazy Neon client (getSql)
  types.ts              # LocationRow/StateInfoRow (snake_case, mirrors DB)
  locations.ts          # read-only queries (ORDER BY featured DESC, name ASC)
  scoring.ts            # editorial "Fit" score (5 factors x 20%), pyRound
  filters.ts            # filter + sort (mirrors old views.filter_locations)
  climate.ts            # climate-normals shaping: diurnal anchoring, dew point
  pace/                 # retirement-pace classifier (RUCA + EPA)
  states.ts             # state-name -> USPS abbr
scripts/                # data + verification scripts
baselines/              # parity references (django_scores.json used by tests)
```

## Key domain logic

- **Fit score** (`lib/scoring.ts`): five equally weighted factors — LGBTQ friendliness, VA access, cost of living, home affordability, safety. Uses Python-compatible round-half-to-even (`pyRound`). `defense_hub` is **not** a scoring factor.
- **Defense hub** (`lib/defense.ts`): `defense_hub` is derived, not curated — `manual === false ? false : presence ? true : manual`, where presence = ≥1 onsite+hybrid RTX opening (a physical facility). Any facility promotes; an explicit `defense_hub_manual = false` vetoes. Edit `defense_hub_manual`, never `defense_hub`. See SCHEMA.md.
- **Pace / lifestyle** (`lib/pace/`): `urban` | `suburban` | `small_town` | `rural` from `location_pace_current` (RUCA + EPA SLD). The `lifestyle` filter matches `pace_category`; there is no density fallback. See SCHEMA.md and `PACE_CLASSIFICATION_PLAN.md`.
- **Climate** (`lib/climate.ts`, `/city/[id]/climate`): temperature comes from `location_weather_monthly`, moisture from `location_hourly_normals` — never mix them (SCHEMA.md:274; the hourly station can be 50+ mi away, so its dew point travels but its `temp_f` doesn't). `buildDiurnal` rescales each month's hourly curve onto that month's `avg_low_f`/`avg_high_f` and recomputes heat index from the anchored temp; it's the only derived number on the page and the footnote says so. Monthly `humidity_pct`/`sun_pct` are **100% NULL** by design — GHCN monthly normals carry no humidity element.
- **`/api/locations`** query params: `snow, no_awb, no_hcm, state_filter, lgbtq_friendly, climate, cost_of_living, price_min, price_max, lifestyle, healthcare, activities, geography, income_tax, vibes, employers, sort`. Response: `{ totalResults, locations }`. `lifestyle` accepts `urban,suburban,small_town,rural`. **Nothing in the UI calls this** — `/explore` filters client-side via the same `filterAndSort`.
- **Pixel parity is a hard requirement** for `/` and `/city/[id]`. Their CSS is copied verbatim into `app/styles/{home,city}.css` and left **unlayered** so it always beats any Tailwind base. Do not introduce global Tailwind/Preflight.
- **Never give those sheets a document-wide selector.** Next keeps a visited route's stylesheet in the document across client-side navigations, so an unlayered `* { margin: 0; padding: 0 }` outlives its own page and flattens every Tailwind utility on whatever you browse to next (this silently broke all nine data routes when reached from `/` or a city page). Their globals are scoped `:where(.home-page)` / `:where(.city-page)` — `:where()` keeps specificity at zero, so the cascade on those pages is unchanged. `/map` uses the same `.map-page` pattern. Keep new global rules out, or scope them the same way.

## Deployment

Vercel, `framework: nextjs` (see `vercel.json`). Requires `DATABASE_URL` in the Vercel project env (provided by the Neon integration). Pages that read the DB use `export const dynamic = "force-dynamic"`.

## Notes

- Three data-maintenance commands were not ported from Django and live only in git history: `import_state_info`, `update_state_law_data`, `update_lgbtq_data`. Port to TS (like `scripts/import-csv.ts`) when next needed.
- `SCHEMA.md` documents the (unchanged) database schema.
