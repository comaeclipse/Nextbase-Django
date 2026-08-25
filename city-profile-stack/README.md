# City Profile Stack

An evidence-backed layer over VetRetire's cities that answers two questions:
**"what's like Elko?"** and **"best city for this kind of person?"** — with real
sources and honest "I don't know"s.

**Start with [PRODUCT.md](PRODUCT.md)** — it states the goal in plain words and
shows both answers running today. This README is the how-it-fits map.

It is intentionally additive: nothing here changes `locations_location` or the
app's Fit score.

## The two products (they run now)

```bash
# "What's like Elko?" — similar cities, each with its biggest difference
node --env-file=.env node_modules/tsx/dist/cli.mjs \
  city-profile-stack/scripts/tools/find-similar-locations.ts "Elko, NV" [--limit 10] [--explain "Casper, WY"]

# "Best city for this person?" — rank cities against a described person
node --env-file=.env node_modules/tsx/dist/cli.mjs \
  city-profile-stack/scripts/tools/match-profile.ts city-profile-stack/data/profiles/examples/retired-vet-dry-outdoors.json
```

Everything below exists to make those two answers trustworthy.

## Layout

- `PRODUCT.md` — what we're building and why (read first).
- `ROADMAP.md` — delivery plan; the phases harden the evidence behind the two products.
- `lib/` — the trait list (`ontology.ts`) and auto-fill-from-statistics (`derive.ts`).
- `scripts/tools/` — the read side: **find-similar-locations** and **match-profile** are
  the products; the rest generate research prompts and rank research candidates.
- `scripts/migrations/`, `scripts/import/` — additive Neon setup + idempotent loaders.
- `data/` — the scores, the example people, and the research evidence. See
  [data/README.md](data/README.md) for what each folder is.
- `docs/` — living docs plus dated point-in-time reports. See [docs/README.md](docs/README.md).

## The model in one breath

Cities are described by **features** (0-1 trait scores). A feature's value can be
**auto-derived** from statistics (works for every city) or **researched**
(editorial, richer, for a few cities). The two products compare cities, or match
a person, over those features. The research layers — dossiers, signals, gold
packs — exist so a researched score is backed by a citation, never a guess. Plain
definitions of every term are in [PRODUCT.md](PRODUCT.md#plain-language-glossary-no-more-mystery-words).

## R&D preservation and promotion

`data/research-ledger.json` is the registry for collaborative research: each
claim's city/scope, artifact, sources, limitations, and promotion state. New
discussion is captured there or in `data/conversation-captures/` before any
optional database import. The default sequence:

```text
conversation_captured -> source_linked -> locally_normalized -> embedding_ready -> promotion_review
```

This keeps a research trail without treating chat, a marketing page, or a single
anecdote as a database fact.

## Running the full data load

All commands run from the repository root and require `DATABASE_URL` in `.env`:

```powershell
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-research-dossiers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-profile-signals.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-features.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-texture-markers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-experience-observations.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/migrations/migrate-location-genre-assignments.ts

node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-research-dossiers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-location-profile-signals.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-location-features.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-texture-markers.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/import/import-experience-observations.ts
node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/derive-structural-features.ts --dry-run
```

For table/view definitions see [docs/DATABASE.md](docs/DATABASE.md) and the City
Profile Stack section of `SCHEMA.md` at the repo root. Research and derivation
rules are in [docs/METHODOLOGY.md](docs/METHODOLOGY.md).
