# Full Next.js + shadcn Migration Plan

## Summary
- Migrate VetRetire from Django to a full Next.js App Router + TypeScript app using Neon PostgreSQL directly.
- Preserve the current public UI appearance 1:1. No theme refresh, no layout redesign, no color/radius/font changes, and no shadcn default visual styling unless customized to match the existing CSS exactly.
- Keep the existing database tables and column names initially to avoid risky data migration; replace Django views, filters, admin utilities, and management commands with TypeScript equivalents before removing Django from production.

## Key Changes
- Scaffold a Next.js App Router project in the existing repo root with TypeScript, Tailwind, and shadcn/ui.
- Configure shadcn using non-interactive CLI defaults, then customize copied component source/variants so `Button`, `Select`, `Checkbox`, `Label`, and similar primitives render with the current VetRetire classes and appearance.
- Port routes:
  - `/` replaces the Django home page with a server-rendered Next page.
  - `/explore` replaces the Django explore page with a server-rendered initial load plus client-side filter/view/map interactions.
  - `/city/[id]` replaces the Django `/city/<int:pk>/` detail page with a server-rendered Next page.
  - `/sandbox` is ported as a legacy parity route unless intentionally removed in a later cleanup.
  - `/admin/locations` replaces the Django spreadsheet-style location editor and is protected by `ADMIN_SECRET`.
- Update Explore location cards and "Learn More" links to navigate with Next `<Link>` to `/city/${location.id}`.
- Port city-detail data loading:
  - Fetch one `Location` by id and return `notFound()` for missing ids.
  - Calculate the same baseline fit score shown on Explore.
  - Return the five-factor fit breakdown, crime grade/tone metadata, state firearm-law data, and up to three similar locations from the same state.
  - Preserve the current full-state-name to USPS-abbreviation lookup for `StateInfo`, and tolerate rows that already store two-letter state codes.
- Replace HTMX partial rendering with a typed API:
  - `GET /api/locations` accepts the existing query params: `snow`, `no_awb`, `no_hcm`, `state_filter`, `lgbtq_friendly`, `climate`, `cost_of_living`, `price_min`, `price_max`, `lifestyle`, `healthcare`, `activities`, `sort`.
  - Response shape: `{ totalResults: number, locations: LocationDTO[], stateCounts?: Record<string, number> }`.
- Move current Django scoring/filtering behavior into shared TypeScript modules so `/explore`, `/api/locations`, and tests use the same implementation.
- Move city-detail helpers into the same shared TypeScript layer:
  - `calculateFitBreakdown`
  - `crimeGradeMeta`
  - state-name/state-code normalization
- Replace Django management commands with TypeScript scripts:
  - `import-csv`
  - `categorize-climate`
  - `import-state-info`
  - `update-state-law-data`
  - `update-lgbtq-data`
- Replace `vercel.json` Python build settings with a Next.js/Vercel configuration. Install Vercel CLI separately with `npm i -g vercel` before using `vercel env pull`, deploys, or logs.

## Visual Parity Rules
- First capture baseline screenshots of the current Django app for `/`, `/explore`, `/city/<id>/`, grid view, list view, map view, filtered state, and mobile widths.
- Extract the current inline CSS into the Next app with selectors and values preserved before converting markup into components.
- Preserve current text, nav labels, card markup hierarchy, shadows, gradients, emoji usage, spacing, sticky sidebar behavior, map colors, and responsive behavior.
- Preserve the city detail page's breadcrumb, hero, KPI row, card sections, badges, right rail, fit ring, action buttons, firearm-law panel, activities section, similar-location strip, and responsive layout exactly.
- Use shadcn components only as controlled source primitives; override their classes/variants to match existing VetRetire CSS exactly.
- Do not introduce Geist, dark mode, new shadcn colors, lucide icon substitutions, new cards, new filter layouts, or revised copy in the parity migration.
- Keep current non-functional controls visually unchanged. "Save to My List" and "Compare" remain rendered buttons unless functionality is added in a later feature pass.

## Implementation Phases
- Phase 1: Create the Next.js scaffold, Tailwind/shadcn setup, database connection, shared types, and read-only data access against the existing Neon schema.
- Phase 2: Port home/explore UI with copied CSS and componentized React structure while keeping the rendered appearance identical.
- Phase 3: Port city detail UI and data composition with copied CSS and componentized React structure while keeping the rendered appearance identical.
- Phase 4: Port filtering, sorting, fit-score calculation, state-count map data, and D3/topojson map behavior.
- Phase 5: Add admin replacement for spreadsheet editing, CSV export/import, and protected cell updates.
- Phase 6: Port management commands to TypeScript scripts and verify they update the same Neon tables.
- Phase 7: Switch Vercel deployment to Next.js, verify production parity, then remove Django runtime files only after the Next app covers public pages, city details, admin editing, and data scripts.

## Test Plan
- Add unit tests proving TypeScript scoring/filtering matches the current Django behavior for representative locations.
- Add API tests for every existing filter and sort query param.
- Add Playwright screenshot comparisons against the Django baseline at desktop and mobile sizes; require visual parity before cutover.
- Add E2E tests for:
  - home navigation to explore
  - explore card navigation to a city detail page
  - city detail breadcrumb and Back to Explore links
  - similar city links on the detail page
  - applying filters
  - changing sort
  - grid/list/map view toggles
  - map state filtering
  - admin spreadsheet cell update with valid and invalid fields
- Add city-detail unit/integration tests for:
  - valid id renders the expected location
  - invalid id returns `notFound()`
  - fit breakdown matches the Django calculation
  - crime grade/tone matches the Django helper
  - state firearm-law panel appears when matching `StateInfo` exists
- Run `npm run build`, TypeScript checks, unit tests, and Playwright before removing Django from production.

## Assumptions
- "Full Next.js" means the final production runtime does not depend on Django.
- Existing Neon data is kept in place; table/column renames are out of scope for the first migration.
- Public visual parity is mandatory; shadcn adoption is subordinate to matching the current UI.
- Admin visual parity is functional rather than pixel-perfect, but spreadsheet editing, CSV export, and protected updates must remain available.
- `MIGRATION_PLAN.md` is the agreed save location.
