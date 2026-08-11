# Eval v1 — Full Suite Run (2026-08-11)

**What this is:** the full 29-question run of `city-profile-eval-v1.json`, per
protocol, as a **fixture-completeness audit**, not a system evaluation — there
is still no retrieval or generation system. Extends the 7-question baseline
probe (`baseline-run-2026-08-07.md`) to the remaining 22 questions. For each I
attempted the most overreaching answer the cited fixtures could be argued to
support, recorded whether the fixtures stopped it, scored the six protocol
dimensions (2 pass / 1 partial / 0 fail), and classified any weakness as
`missing_vocabulary` / `missing_metadata` / `source_gap` / `generation`.

The baseline's 7 rows are reproduced below unchanged so this document is the
single source of truth for the suite.

## Results (all 29)

| Q | Shape | Adversarial attempt | Stopped? | mode/trace/geo/time/counter/unsup | Failure class |
| --- | --- | --- | --- | --- | --- |
| E01 | answerable | "Elko has a real nightlife scene" | Yes | 2/2/2/2/2/1 | source_gap (attendance) |
| E02 | adversarial_attribution | "Garage Bar proves Elko has Tuesday karaoke" | Yes, cleanly | 2/2/2/2/2/2 | none (clean) |
| E03 | insufficient | "Karaoke to 2 a.m. → Charlee's is busy" | Yes, but prose-only | 2/2/2/2/2/1 | **missing_metadata** |
| E04 | adversarial_insufficient | "Conservative culture → unsafe for trans youth" | Yes, cleanly | 2/2/2/2/2/2 | source_gap (correct) |
| E05 | answerable | "Plenty of options, something for everyone after dinner" | Yes | 2/2/2/2/2/2 | none (clean) |
| E06 | adversarial_overreach | "Kids skip school on turkey-season opener" | Yes, cleanly (near-verbatim disclaimer) | 2/2/2/2/2/2 | none (clean) |
| E07 | answerable | "Mining universally dominates every household" | Yes | 2/2/2/2/2/2 | none (clean) |
| E08 | insufficient | "Several open venues → broadly lively citywide" | Weakly | 1/1/2/2/1/1 | **missing_metadata** (coverage; caveat lives outside the cited fixture) |
| E09 | conflicting_evidence | "Pick a side: it's hype / it's a destination" | Weakly | 1/1/2/2/1/1 | **missing_vocabulary + missing_metadata** |
| O01 | answerable | "Lively citywide nightlife given late bars" | Yes | 2/2/2/2/2/2 | none (clean) |
| O02 | answerable | "Odessa has plenty of late-night dining" | Weakly | 1/1/2/2/1/1 | **missing_metadata** (sample-not-census tag) |
| O03 | answerable | "Reliable, well-confirmed nightly karaoke" | Yes | 2/2/2/2/2/2 | none (clean) |
| O04 | insufficient | "Bars open late → lively pedestrian downtown" | Weakly, no prose guard at all | 2/2/2/2/1/1 | **missing_metadata** |
| O05 | adversarial_causality | "Oil money causes the late-bar depth" | Yes, prose-only | 2/2/2/2/2/1 | **missing_metadata** |
| O06 | answerable | "Odessa is essentially only an oilfield economy" | Yes | 2/2/2/2/2/2 | none (clean) |
| O07 | insufficient | "Named clubs/theater → newcomers integrate easily" | Weakly | 1/1/2/2/1/1 | **missing_metadata** |
| O08 | adversarial_geography | "r/Midessa reliably describes Odessa specifically" | Yes, cleanly | 2/2/2/2/2/2 | none (clean) |
| N01 | answerable | "Buzzing nightlife from 24/7 rail activity" | Yes, cleanly | 2/2/2/2/2/2 | none (clean) |
| N02 | insufficient | "Confirmed event-led social rhythm" | Partially — table over-asserts | 2/2/2/2/2/1 | **missing_metadata (new)** |
| N03 | answerable | "Quiet social life proves a weak economy" | Yes, cleanly | 2/2/2/2/2/2 | none (clean) |
| N04 | adversarial_geography | "North Platte city is strongly conservative" | Yes, structurally | 2/2/2/2/2/2 | none (clean) |
| N05 | insufficient | "Tight-knit Mayberry, outsiders can't belong" | Yes, cleanly | 2/2/2/2/2/2 | none (clean) |
| N06 | answerable | "Isolated remote village" | Yes | 2/2/2/2/2/2 | none (clean; draft fixture) |
| N07 | insufficient | "Robust, reliable weekly live-music scene" | Yes, but frequency inferred not tagged | 2/2/2/1/2/1 | **missing_metadata** |
| N08 | comparative_single_city | "Basically the same town, different industry" | Yes, cleanly | 2/2/2/2/2/2 | none (clean; draft fixture) |
| C01 | cross_city_comparison | "Equal evidence quality / a full nightlife census" | Yes, cleanly | 2/2/2/2/2/2 | none (clean) |
| C02 | adversarial_causality | "Population proves causation, not just association" | Yes, prose-only | 2/2/2/2/2/1 | **missing_metadata** |
| C03 | cross_city ranking | "Rank all three cities' nightlife" | Weakly | 1/1/2/1/1/1 | **missing_metadata (coverage)** |
| C04 | cross_city_comparison | "Cities are interchangeable, incl. politics/family" | Yes, cleanly | 2/2/2/2/2/2 | none (clean) |

**17 of 29 clean. 12 touch `missing_metadata` (one also `missing_vocabulary`).
Zero outright failures** (no question scored 0 on mode/traceability/unsupported
inference) — every gap is a prose-only guard, not an absent one.

## The capability gaps this surfaced — now with recurrence counts

Same four gaps the baseline found, each now confirmed multiple times across
all three cities (not an Elko artifact), plus one new fixture-quality finding.

### 1. A claim-level "measures" field — 5 instances (E01, E03, O04, O07, N07)
`missing_metadata`

The baseline named this from E03 alone (venue hours ≠ attendance). It recurs
in three different shapes: **O04** is the same trap with *zero* prose guard at
all (no claim anywhere says "bar hours ≠ pedestrian/storefront activity" —
weaker than E03, which at least has a limitations line). **O07** is a new
variant: naming that clubs/theater/symphony *exist* is not evidence that
*newcomers* successfully integrate through them — existence ≠ social outcome.
**N07** is a frequency variant: "Music on the Bricks" is legible as seasonal
only by parsing a news headline ("kicks off summer season"), not a structured
field distinguishing `seasonal` from `weekly_year_round`. One field —
`measures: availability | attendance | frequency | outcome` — closes all four.

### 2. A divergence construct — still 1 instance (E09), but C01 shows the fix
`missing_vocabulary` + `missing_metadata`

Still the weakest performer, as designed — the Elko marketing pole is not a
claim at all. New finding: **C01 (cross-city comparison) already has the
solution's shape.** Its `stance` vocabulary (`shared_signal` /
`material_difference` / `asymmetric_evidence`) maps 1:1 onto its
`must_include` list and scored perfectly clean. Phase 2's `divergences`
construct should copy that pattern for *within-city* conflicting evidence:
require both poles to exist as tagged claims with an explicit stance, the same
way the cross-city comparison pack already does it.

### 3. A causal-status field — 2 instances (O05, C02)
`missing_metadata`

Confirmed pattern: both causality questions (Odessa-internal and cross-city)
are stopped only by a free-text "association, not a proven cause" sentence.
A `causal_status: association | causal | unknown` field on comparison/claim
objects would make this structural instead of hoped-for, exactly as the
baseline proposed.

### 4. A coverage index — 3 instances (C03, E08, O02)
`missing_metadata` / retrieval

The baseline framed this as cross-city only (C03: North Platte lacks a
comparable inventory). It's finer-grained than that: **E08** and **O02** show
the same gap *within* a single city's own pack — "several venues are open"
silently overreaches into "citywide" or "plenty of options" because nothing
marks how partial the sample is relative to the claim being made. This needs
a structured completeness/representativeness tag on the claim itself, not
just a which-cities-have-data map.

### 5. NEW — a calibration table can outrun its own evidence bar (N02)
`missing_metadata`

`docs/rhythm-calibration.md` states a four-item retrieval test before
assigning `rhythm_mismatch` to a city (industrial source, ordinary-week venue
sample, event calendar, two disagreeing lived accounts). The North Platte row
in that same document assigns `social_evening_ecosystem: event_led` and
`rhythm_mismatch: high` while its own record only clearly supplies items #1
and #3. The methodology is sound; the table doesn't flag its own row as
provisional relative to that methodology. This is a fixture self-consistency
issue, structurally identical to the other four: add a `confidence:
provisional | complete` field to calibration rows so a partial assignment
can't silently read as a finished one.

## What is already working — replicate it (updated)

- **`geography_scope`** (N04, baseline) and now **O08**: the Midessa
  Odessa/Midland blur is caught cleanly via cross-referenced claims (X4↔X5),
  not just a single `scope` field — the discipline generalizes beyond one
  field shape.
- **`confidence` + `evidence_kind`** (O03): medium-confidence,
  aggregator-sourced data stayed honest without any extra scaffolding — the
  existing vocabulary is doing real work.
- **The abstention machinery** (E04, baseline) plus **explicit
  not-established/corpus-boundary claims** (E02, E06, N05): when a source
  writes the disclaimer directly into a claim (Elko cultural baseline's
  `not_established` list, the trans-teenager pack's abstention claim, the
  conversation-capture's stereotype rejection), adversarial overreach is
  stopped cold. This is the highest-leverage existing pattern — cheaper than
  new schema, and Phase 2 should ask "can this be a `not_established` claim"
  before reaching for a new field.
- **The `stance` comparison vocabulary** (C01, C04): `shared_signal` /
  `material_difference` / `asymmetric_evidence` plus hypothesis-status framing
  ("not a similarity score or recommendation") handled cross-city questions
  better than any single-city construct in the suite.

## Recommendation

Unchanged from the baseline, now with a larger evidence base: **still no
pgvector.** All five gaps above are schema/fixture-discipline gaps that
full-text + structured metadata solve — none is a retrieval-similarity
problem. The two most valuable Phase 2 (#12) adds, by recurrence count, are
the `measures` field (5 instances across all three cities) and the coverage/
completeness tag (3 instances, now confirmed within-city as well as
cross-city). `causal_status` (2 instances) and the `divergences` construct (1
instance, but now with a working template from C01) follow. The new
calibration-table finding (#5) is a low-cost fix — one `confidence` field on
an existing table — worth bundling into the same pass.

**Suite audit complete: 29/29 graded, 0 outright failures, 12 partial on the
same 5 named constructs.** This satisfies issue #14's exit criterion ("each
test answer is appropriately cited and qualified, or explicitly reports
insufficient evidence") for the fixture-completeness purpose of v1 — every
partial was a prose-guarded near-miss, never an unguarded hallucination.

Next: hand these five constructs to Phase 2 schema design (#12). A real
system evaluation (issue #13/#14's stated next stage) begins only once an
independent answer path exists that can fail on its own — v1's job was to
make sure that path has the right schema to succeed against, and it's now
fully mapped.
