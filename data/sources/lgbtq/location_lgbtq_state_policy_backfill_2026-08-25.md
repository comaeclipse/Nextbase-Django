# Location `lgbtq_state_policy_score` backfill — 2026-08-25 (issue #55)

Fills **41** NULL `locations_location.lgbtq_state_policy_score` values from the
Movement Advancement Project (MAP) overall state policy score (`/49`).

This is the **city-row** inventory item on #55. It does **not** write
`locations_stateinfo` (that remains #53). `scripts/import-csv.ts` intentionally
ignores `LGBTQStatePolicyScore` on city CSVs, which is why many researched CSVs
never landed the column in Neon.

App reads prefer stateinfo via
`COALESCE(s.lgbtq_state_policy_score, l.lgbtq_state_policy_score)` in
`lib/locations.ts`; filling the location fallback still closes the Fit / profile
gap when stateinfo is empty.

## Method

1. **Sibling propagate (33 cities):** if every already-filled city in the same
   state shares one score, copy that score onto the NULL cities. Those filled
   values are the existing MAP-derived convention already live in Neon.
2. **Current MAP overall (8 cities):** when siblings disagree or the only filled
   sibling is known-stale vs today’s MAP table, use the current MAP overall score
   from [mapresearch.org equality profiles](https://mapresearch.org/equality/)
   (retrieved 2026-08-25):

| State | Score used | Why not sibling-only |
| --- | ---: | --- |
| MT | **-1.75** | siblings −1.75 and −1.50; current MAP −1.75 |
| NE | **1.75** | Omaha still 1.25; current MAP overall 1.75 |
| NY | **44.50** | siblings 44.50 and 45.00; current MAP 44.5 |
| PA | **17.75** | siblings 6.50 / 16.75 / 17.00; current MAP overall 17.75 |

Patch file: `location_lgbtq_state_policy_backfill_2026-08-25.json`.

## Apply

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-lgbtq-state-policy-backfill.ts --dry-run
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-lgbtq-state-policy-backfill.ts
```

Production write only after merge (AGENTS.md).

## Out of scope / follow-ups

- Refreshing already-filled but stale city scores (e.g. Omaha 1.25, Warren PA 6.50
  which looks like an SO subscore, Binghamton 45.00, Great Falls −1.50).
- Writing sourced rows into `locations_stateinfo` (#53).
- `lgbtq_rating` / HRC MEI (municipal, not MAP).
