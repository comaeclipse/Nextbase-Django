# What each data folder is

The products read a few of these; the rest are research evidence at different
stages of trust. If you only care about the working products, you need
`location-features.json` and `profiles/examples/`.

## Consumed by the products

- **`location-features.json`** — the 0-1 trait scores per city. This is what
  find-similar and match-profile actually compare. The source of truth for the
  answers.
- **`profiles/examples/*.json`** — example "people" (preferences + dealbreakers)
  for match-profile. Add one per persona you want to test.
- **`us-metro-anchors.json`** — reference points used by structural derivation.

## Research evidence (five stages, least → most trustworthy)

There are several folders because a claim earns trust in stages. Plain version:

| Folder | What it is | Trust |
| --- | --- | --- |
| `conversation-captures/` | Raw research from a working session, preserved before cleanup. | lowest |
| `drafts/` | A city write-up in progress, not yet normalized. | low |
| `cohorts/` | A queue of *questions to research* for a group of cities — hypotheses, not answers. | n/a (a to-do list) |
| `dossiers/research-dossiers/` | The full researched write-up for a city (`.md` narrative + `.json` structured result). | medium |
| `gold-packs/` | A fully-cited answer to **one hard question** (e.g. "is Elko dead after 8pm?"), every sentence traceable. The gold standard. | highest |

The **`research-ledger.json`** is the index over all of the above: every claim,
its city/scope, which artifact holds it, its sources, and its promotion stage.
Start there to find where any claim lives.

## Derived display data

- **`location-profile-signals.json`** — display-ready observations per city.
- **`location-texture-markers.json`** — short "how it feels" markers.
- **`experience-observations.json`** — source excerpts that support / contradict
  / contextualize a specific claim (never a substitute for a real score).

## Quality gate

- **`evaluations/city-profile-eval-v1.json`** — 29 test questions, deliberately
  including unanswerable ones, that a future answer path must handle without
  bluffing. `evaluations/baseline-run-*.md` are dated audit results.
