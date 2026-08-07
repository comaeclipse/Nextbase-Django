# City Profile Stack

This self-contained research module adds a richer, evidence-backed layer to
VetRetire's existing location rows. It is intentionally additive: nothing in
this directory changes `locations_location` or replaces the app's Fit score.

The delivery plan is in [ROADMAP.md](ROADMAP.md).

## Layout

- `lib/` — the feature ontology and deterministic structural derivation.
- `scripts/migrations/` — additive Neon schema setup for dossiers, signals,
  features, and texture markers.
- `scripts/import/` — idempotent loaders for the checked-in research data.
- `scripts/tools/` — derivation, similarity, profile matching, candidate
  ranking, and prompt generation.
- `data/` — source dossiers, observations, feature values, texture markers,
  metro anchors, and example profiles.

`data/experience-observations.json` is the source-level layer for subjective
questions. It records excerpts that support, contradict, or contextualize a
precise claim; it never substitutes missing evidence with a numeric score.

`data/cohorts/` holds bounded, source-linked research queues. A cohort is a
set of falsifiable hypotheses, not a similarity-score result or recommendation.

## R&D preservation and promotion

`data/research-ledger.json` is the local registry for collaborative research.
It records each claim's city/scope, artifact, source state, limitations, and
promotion state. New discussion should be captured there or in
`data/conversation-captures/` before any optional database import.

The default sequence is:

```text
conversation_captured -> source_linked -> locally_normalized -> embedding_ready -> promotion_review
```

This keeps a useful research trail without treating chat, a marketing page, or
a single anecdote as a database fact. `embedding_ready` means a claim has a
bounded source-backed passage suitable for a future pgvector corpus; it does
not authorize a Neon write or a production feature.

## Model

The stack keeps four layers separate:

1. **Dossiers** preserve the raw narrative and structured research result.
2. **Signals** are discrete source-backed observations intended for display.
3. **Features** are 0..1 place descriptors. Their `capacity`, `intensity`, or
   `position` kind determines how a person's preference may match them.
4. **Vectors** are composed at query time from resolved features; they are not
   stored because the current city count does not justify a materialized table.

Editorial research and deterministic structural derivation can coexist for a
feature. The resolved database view selects the best available value while the
tools retain both for calibration and falsifiable predictions.

## Running it

All commands run from the repository root and require `DATABASE_URL` in
`.env`:

```powershell
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-research-dossiers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-profile-signals.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-features.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-texture-markers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-experience-observations.ts

node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-research-dossiers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-location-profile-signals.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-location-features.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-texture-markers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-experience-observations.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/derive-structural-features.ts --dry-run
```

For the table and view definitions, see [docs/DATABASE.md](docs/DATABASE.md)
and the City Profile Stack section of `SCHEMA.md` at the repository root. The
research and derivation rules are in [docs/METHODOLOGY.md](docs/METHODOLOGY.md).
