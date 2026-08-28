# Leidos — job-location sources

Leidos (Reston, VA HQ) is a defense/IT services integrator. We do not scrape a
Leidos ATS feed, so its nationwide site footprint is hand-sourced — the same
pattern as System High.

- **Provenance:** the 293 cities in `leidos_job_locations.csv` were provided by the
  maintainer on 2026-08-25 as Leidos office/facility locations. `SourceKind` is
  `user_attested` and `SourceUrl` is intentionally blank — no scraped source URL is
  claimed. If a machine-readable Leidos locations/careers source is added later,
  record its URL and drop the attested counts.
- **Counts:** `Onsite=1` / `TotalPostings=1` record *attested presence* (≥1 onsite
  opening / a real facility), not a scraped opening total. Under the derived-hub rule
  (`onsite+hybrid ≥ DEFENSE_HUB_MIN_POSTINGS`, currently 1) this is enough for a
  linked city to count as a physical defense facility.
- **Linkage:** 60 of the 293 map to curated retirement locations and gain a
  `location_id`; the other 233 (bases such as Fort Belvoir, Picatinny Arsenal,
  Eglin AFB, Pearl Harbor; large metros we don't curate such as Washington DC,
  Los Angeles, Seattle; and Guam) are stored as `location_id = NULL` footprint rows
  and will attach automatically if those cities are ever added as retirement
  locations.
- **Hub impact — none.** Of the 60 linked cities, 43 are already `defense_hub = true`
  (manual curation) and 17 carry a `defense_hub_manual = false` veto (which wins over
  presence). None are NULL. So `scripts/recompute-defense-hub.ts` flips **0** rows;
  Leidos data only enriches the `employers` and `defense_ecosystem` filters, it does
  not change any hub designation.

Run order (from `master`, after this file merges):

```
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-defense-employers.ts   # seeds the leidos employer row
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-defense-employer-locations.ts data/leidos_job_locations.csv --dry-run
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-defense-employer-locations.ts data/leidos_job_locations.csv
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts --dry-run   # expect: no changes
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/recompute-defense-hub.ts
```
