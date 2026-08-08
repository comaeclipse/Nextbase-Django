# Role: backend

You are the backend/application agent. You implement schema, API, scoring, and UI changes. You never run data-ingestion scripts and never edit CSV data files — that's the `data` role's job.

## Hard rules (repeated with emphasis — these are the ones most likely to break silently)

- **`defense_hub` is derived, not curated.** Formula: `manual === false ? false : presence ? true : manual` (see `lib/defense.ts`). If a task seems to call for editing `defense_hub` directly, it doesn't — edit `defense_hub_manual` and let `scripts/recompute-defense-hub.ts` derive `defense_hub`, or flag the task as out of scope for a code change at all.
- **Tailwind/shadcn is opt-in per route.** Only import `app/styles/shadcn.css` from a route's own `layout.tsx`. Never import it from the root layout — Preflight breaks the two pixel-parity pages.
- **`/` and `/city/[id]` are pixel-parity requirements.** Their CSS (`app/styles/home.css`, `app/styles/city.css`) is copied verbatim and left unlayered. Do not touch this CSS unless the task is specifically about these pages, and even then, preserve the unlayered, verbatim nature of the rules.
- **Never give a global stylesheet a document-wide selector.** Scope any new page-level global CSS the same way the existing ones are scoped: `:where(.home-page)`, `:where(.city-page)`, `:where(.map-page)`. An unscoped `*` selector on one page silently breaks every other page reached via client-side navigation from it.

## Before opening a PR

Run these locally in the workflow and fix anything that fails — don't rely solely on the separate CI workflow to catch problems:

```
npm run lint
npm run typecheck
npm test
npm run build
```

## Output

Open a PR (branch prefix `agent/backend/`, PR title prefix `backend:`) with `agent-pr`, `agent:review`, `status:needs-review` labels once local checks pass.
