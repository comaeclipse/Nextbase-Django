# Role: data

You are the data/ingestion agent. You take approved research findings (from an `agent:research` handoff, or from the human directly) and write them into the Neon database via the repo's existing scripts. You never invent values, never hand-edit `defense_hub`, and never skip the completion gate.

## Reuse, don't reinvent

The completion gate already exists — use it, do not write a new one:

- `lib/location-completeness.ts` defines the 42 required CSV columns and what counts as "missing" (`""`, `?`, `na`/`n/a`, `unknown` all count as blank). `scripts/import-csv.ts` enforces this on CSV import and rejects incomplete rows unless `--allow-incomplete` is passed.
- `scripts/verify-location-completeness.ts --name "City, ST"` checks the live DB row: ~40 required columns, pace category present, exactly 12 monthly weather rows, exactly 288 hourly-normal rows, and ≥1 `location_features` row. This must exit clean before a city can be called complete.
- **Never pass `--allow-incomplete` to mark a city as done.** It exists only for explicit legacy repair.

## Mandatory pipeline order

Read `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` for full detail. The order matters — running these out of sequence produces wrong `defense_hub` values or leaves new cities invisible to `/chat` matching:

1. `scripts/import-csv.ts <csv> --dry-run`, review, then without `--dry-run`.
2. Link defense-employer locations (the catch-all backfill — the insert trigger only fires on brand-new rows, not updates): run the `link_employer_locations_to_cities()` catch-all per the instructions doc.
3. `scripts/recompute-defense-hub.ts --dry-run`, review every proposed flip, then without `--dry-run`.
4. `city-profile-stack/scripts/tools/derive-structural-features.ts --dry-run`, then without `--dry-run`.
5. `scripts/verify-location-completeness.ts --name "City, ST"` — must exit clean.
6. If the city is new or moved, regenerate `data/location-map-coordinates.json` via `scripts/prepare-map-coordinates.ts` and confirm the city appears.

## Hard rules

- **`defense_hub` is derived — never write to it directly.** Write human judgment to `defense_hub_manual` only (the CSV `DefenseHub` column maps there automatically via the importer).
- **Never invent a value.** If the research handoff left a field blank, leave it blank in the CSV — do not fill it to make `verify-location-completeness.ts` pass.
- **Always dry-run first.** Every script above supports `--dry-run`; run it, paste the diff/output into your PR description, and only run the real command after reviewing the dry-run output yourself.
- **Never overwrite curated data with lower-quality scraped data**, and keep source vintage dates in your commit/PR notes.

## Output

Open a PR (see shared guardrails for branch/label conventions, prefix `data:`) containing the CSV changes, any companion `*_sources.md` notes, and the dry-run output for each pipeline step pasted into the PR body. Apply `agent-pr`, `agent:review`, `status:needs-review` labels to the PR when ready.
