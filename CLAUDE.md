# CLAUDE.md

Guidance for agents working in this repository.

## Project Overview

**VetRetire** is a **Next.js 16** (App Router) + **React 19** + **TypeScript** web app that helps military veterans find retirement locations, with filters for climate, cost of living, lifestyle, healthcare/VA access, safety, and LGBTQ friendliness.

It was migrated from Django in 2026 (the Django implementation is in git history). The app reads the **existing Neon PostgreSQL** schema directly, keeping the original table/column names (`locations_location`, `locations_stateinfo`).

## Stack

- Next.js 16 App Router, React 19, TypeScript
- `@neondatabase/serverless` for direct Neon Postgres access (read-only in the app)
- Tailwind v4 + shadcn/ui — **scoped to a future admin section only** (`app/styles/shadcn.css`), never imported globally, because Tailwind's Preflight reset breaks the pixel-parity public pages
- d3 + topojson-client + us-atlas for the explore map

## Setup & Commands

```bash
npm install
# .env (gitignored) must contain DATABASE_URL (Neon connection string)
npm run dev        # http://localhost:3000
npm run build      # production build
npx tsc --noEmit   # typecheck
```

Data scripts (run with tsx + the env file):

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-csv.ts <csv> [--clear] [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/categorize-climate.ts [--dry-run]
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify_scores.ts   # scoring regression vs baselines/django_scores.json
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
  page.tsx              # home
  explore/page.tsx      # explore (server shell) -> <ExploreClient>
  city/[id]/page.tsx    # Zillow-style city detail
  api/locations/route.ts# filter/sort API (query params below)
  styles/*.css          # copied-verbatim page CSS (home/explore/city), UNLAYERED
  styles/shadcn.css     # Tailwind + shadcn (admin-only, not imported globally)
components/             # ExploreClient, LocationCard, StateMap
lib/
  db.ts                 # lazy Neon client (getSql)
  types.ts              # LocationRow/StateInfoRow (snake_case, mirrors DB)
  locations.ts          # read-only queries (ORDER BY featured DESC, name ASC)
  scoring.ts            # editorial "Fit" score (5 factors x 20%), pyRound
  filters.ts            # filter + sort (mirrors old views.filter_locations)
  states.ts             # state-name -> USPS abbr
scripts/                # data + verification scripts
baselines/              # parity references (django_scores.json used by tests)
```

## Key domain logic

- **Fit score** (`lib/scoring.ts`): five equally weighted factors — LGBTQ friendliness, VA access, cost of living, home affordability, safety. Uses Python-compatible round-half-to-even (`pyRound`). `defense_hub` is **not** a scoring factor.
- **Defense hub** (`lib/defense.ts`): `defense_hub` is derived, not curated — `manual === false ? false : presence ? true : manual`, where presence = ≥1 onsite+hybrid RTX opening (a physical facility). Any facility promotes; an explicit `defense_hub_manual = false` vetoes. Edit `defense_hub_manual`, never `defense_hub`. See SCHEMA.md.
- **`/api/locations`** query params: `snow, no_awb, no_hcm, state_filter, lgbtq_friendly, climate, cost_of_living, price_min, price_max, lifestyle, healthcare, activities, employers, sort`. Response: `{ totalResults, locations }`.
- **Pixel parity is a hard requirement** for public pages. Their CSS is copied verbatim into `app/styles/*.css` and left **unlayered** so it always beats any Tailwind base. Do not introduce global Tailwind/Preflight.

## Deployment

Vercel, `framework: nextjs` (see `vercel.json`). Requires `DATABASE_URL` in the Vercel project env (provided by the Neon integration). Pages that read the DB use `export const dynamic = "force-dynamic"`.

## Notes

- Three data-maintenance commands were not ported from Django and live only in git history: `import_state_info`, `update_state_law_data`, `update_lgbtq_data`. Port to TS (like `scripts/import-csv.ts`) when next needed.
- `SCHEMA.md` documents the (unchanged) database schema.
