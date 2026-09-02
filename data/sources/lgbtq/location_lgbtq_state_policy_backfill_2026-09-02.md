# Location `lgbtq_state_policy_score` backfill — 2026-09-02 (issue #55)

Fills **69** NULL `locations_location.lgbtq_state_policy_score` values on ranked
city candidates added since the 2026-08-25 backfill (`location_lgbtq_state_policy_backfill_2026-08-25.md`),
using the same two-step method. Same scope rules as before: this is the
**city-row** fallback column only; it does **not** write `locations_stateinfo`
(#53), and `scripts/import-csv.ts` still ignores `LGBTQStatePolicyScore` on
city CSVs, which is why every batch of new cities re-opens this gap.

## Method

1. **Sibling propagate (56 cities, 23 states):** where every already-filled city
   in the state carries one score, copy it. Those values are the MAP-derived
   convention already live in Neon.
2. **Current MAP overall (13 cities, 6 states):** where filled siblings disagree,
   use the current Movement Advancement Project overall policy tally (`/49`)
   from [mapresearch.org equality profiles](https://www.mapresearch.org/equality-maps/profile_state/XX),
   retrieved 2026-09-02:

| State | Score used | Filled siblings | Cities |
| --- | ---: | --- | --- |
| MT | **-1.75** (Negative) | -1.50 / -1.75 | Libby |
| NY | **44.50** (High) | 44.50 / 45.00 | Buffalo, Endicott, Greenlawn, Liverpool, Niagara Falls, Owego |
| OH | **0.25** (Low) | 1.75 / 8.25 | Dayton |
| OK | **-6.75** (Negative) | -6.75 / 1.50 | Altus, Enid, Lawton |
| PA | **17.75** (Fair) | 6.50 / 16.75 / 17.00 / 17.75 | Archbald, Carlisle |
| UT | **7.50** (Low) | 8.00 / 9.00 | Clearfield, Corinne |

MT / NY / PA re-verified today at the same values the 2026-08-25 backfill used.

Sibling-propagated states and the score copied: AK 8.25, AL -10.5, AZ 7.5,
CA 45, CO 45.5, CT 42.25, FL -5.5, GA -0.75, IL 45, IN -6.25, KS -1, LA -6.75,
MA 40, MD 44, NC 6.25, ND 10.5, NH 32, NJ 41.75, NM 36, NV 42.25, TX -6.75,
VA 25, WV 0.25.

Patch file: `location_lgbtq_state_policy_backfill_2026-09-02.json`
(format: `scripts/apply-location-patches.ts`).

## Apply

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch data/sources/lgbtq/location_lgbtq_state_policy_backfill_2026-09-02.json --dry-run
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch data/sources/lgbtq/location_lgbtq_state_policy_backfill_2026-09-02.json
```

Production write only after merge (AGENTS.md).

## Out of scope / follow-ups

- Refreshing already-filled but stale city scores (the disagreeing siblings
  above: e.g. Ohio's 8.25, Oklahoma's 1.50, Utah's 9.00, Warren PA's 6.50).
- Writing sourced rows into `locations_stateinfo` (#53).
- Making `import-csv.ts` honour `LGBTQStatePolicyScore` so new cities stop
  re-opening this gap.
