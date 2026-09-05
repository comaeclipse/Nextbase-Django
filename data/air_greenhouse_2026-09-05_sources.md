# Air / Govini listings snapshot — 2026-09-05

- Source: https://boards-api.greenhouse.io/v1/boards/air/jobs?content=true
- Retrieved: 2026-09-05 UTC with the merged Greenhouse adapter and `sync-defense-job-listings.ts --employer air --pull-only`.
- Output: `data/air_greenhouse_2026-09-05.csv`, 36 unique listing URLs, all classified `prime` by the existing defense-employer policy.
- Purpose: #313 closeout found 33 live rows whose `Company=Air (Govini)` label did not map to an employer slug. PR #367 fixes that mapping. All 33 affected URLs occur in this complete board snapshot; importing it will relink them through the normal URL upsert and add three openings.
- This research phase wrote no production data. Apply only after this CSV is merged, from merged master, using `sync-defense-job-listings.ts --employer air --from-csv data/air_greenhouse_2026-09-05.csv`, then the same command with `--apply` after reviewing the dry run. No `--force` or `--clear` is needed.

## Importer dry run

Command: `scripts/import-defense-job-listings.ts data/air_greenhouse_2026-09-05.csv --dry-run` with the local database environment loaded.

```text
Parsed 36 listing(s), skipped 0 (missing url/title/company).
Geocoded (US, on map): 30; unmapped/remote/international: 6.

By company:
    36  Air (Govini)

By sector:
    14  Software & Data
     4  Hardware & Engineering
     4  Other
     4  Corporate & G&A
     4  Mission & Flight Ops
     3  Business & Growth
     2  Product & Design
     1  Manufacturing & Production

Dry run complete. No rows written.
```

The sync dry run reports 36 new employer-scoped URLs because existing null-slug rows are absent from its employer lookup. The importer upserts globally on URL, so those 33 rows are updated rather than duplicated.
