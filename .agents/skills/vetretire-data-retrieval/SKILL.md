---
name: vetretire-data-retrieval
description: Use this skill when you need to refresh, expand, or inspect the VetRetire data set, including location, state, and defense employer data. It contains detailed instructions on source priority, field maps, and verification checklists.
---

# VetRetire Data Retrieval

**The full procedure lives in [`ALL_DATA_RETRIEVAL_INSTRUCTIONS.md`](../../../ALL_DATA_RETRIEVAL_INSTRUCTIONS.md).
Read that file before doing anything. Do not copy its content back into this one.**

This file used to be a copy of it, and the copy went stale — it had silently lost the
entire city-completion gate: no `--allow-incomplete` guidance, no "a recorded gap is a
blocker" rule, and no `verify-location-completeness` step. Anyone running the skill was
ingesting cities without the gate the instructions require. Pointers cannot rot that way;
copies can, and this one did.

## The rules most often skipped

Everything below is detailed in the instructions file — these are repeated only because
they are the ones that have actually gone wrong.

- **A recorded gap is a blocker for a new city**, not a completion state. Never fill a gap
  with a guess; leave it blank and record it.
- **`--allow-incomplete` is for legacy repair only.** Never for a city addition or a city
  being reported as complete.
- **`scripts/verify-location-completeness.ts --name "City, ST"` must pass** before a city
  is reported complete.
- **Never hand-set `defense_hub`.** Human judgment goes in `defense_hub_manual`; the value
  is derived by `scripts/recompute-defense-hub.ts`.
- **Follow the two-phase ingest workflow** in the instructions: research artifacts land on
  `master` via PR *before* anything is written to Neon.
