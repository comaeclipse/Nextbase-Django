# Eval v1 — Baseline Fixture Audit (2026-08-07)

**What this is:** the first pass of `city-profile-eval-v1.json`, run per protocol
as a **fixture-completeness audit**, not a system evaluation — there is no
retrieval or generation system yet. For each question I attempted the *most
overreaching answer the fixtures could be argued to support* and recorded
whether the fixtures stopped me, scoring the six protocol dimensions
(2 pass / 1 partial / 0 fail) and classifying any weakness as
`missing_vocabulary` / `missing_metadata` / `source_gap` / `generation`.

**Sample:** 7 of 29 questions, chosen to cover each shape and trap. This is a
representative probe to surface capability gaps, not the full graded suite.

## Results

| Q | Shape | Adversarial attempt | Stopped? | mode / trace / geo / time / counter / unsup | Failure class |
| --- | --- | --- | --- | --- | --- |
| E01 | answerable | "Elko has a real nightlife scene" | Yes | 2 / 2 / 2 / 2 / 2 / 1 | source_gap (attendance) |
| E03 | insufficient | "Karaoke to 2 a.m. → Charlee's is busy" | Yes, but prose-only | 2 / 2 / 2 / 2 / 2 / 1 | **missing_metadata** |
| E09 | conflicting_evidence | "Pick a side: it's hype / it's a destination" | Weakly | 1 / 1 / 2 / 2 / 1 / 1 | **missing_vocabulary + missing_metadata** |
| E04 | adversarial_insufficient | "Conservative culture → unsafe for trans youth" | Yes, cleanly | 2 / 2 / 2 / 2 / 2 / 2 | source_gap (correct) |
| O05 | adversarial_causality | "Oil money causes the late-bar depth" | Yes, prose-only | 2 / 2 / 2 / 2 / 2 / 1 | **missing_metadata** |
| N04 | adversarial_geography | "North Platte city is strongly conservative" | Yes, structurally | 2 / 2 / 2 / 2 / 2 / 2 | none (clean) |
| C03 | cross_city ranking | "Rank all three cities' nightlife" | Weakly | 1 / 1 / 2 / 1 / 1 / 1 | **missing_metadata (coverage)** |

Two questions passed clean (E04, N04). Two passed only because a *prose
limitation string* inside a claim blocked the overreach (E03, O05). Three
exposed a structural gap (E09, C03, and the pattern behind E03/O05).

## The capability gaps this surfaced

The valuable output. Each is a specific thing Phase 2/3 must add, grounded in a
failing question — not a wishlist.

### 1. A claim-level "measures" field — availability vs attendance
`missing_metadata` · surfaced by E03 (and latent in E01, O01)

Every venue-hours claim proves a door is *open*; the error is reading that as
*busy*. Today the only guard is a prose `limitations` string ("availability is
not attendance"). A retriever ranking by similarity can surface the hours claim,
and a generator can overreach, because nothing structurally marks **what the
datum measures**. Phase 2 needs a field like `measures: availability` with the
common misread named, so abstention on attendance is enforceable, not hoped for.

### 2. A divergence construct — and the missing pole as a claim
`missing_vocabulary` + `missing_metadata` · surfaced by E09 (the question added for exactly this)

E09 was the weakest performer, as designed. The Elko pack *discusses*
marketing-vs-lived in prose, but the claims fixture has **no structured
divergence object** linking the opposing claims, and — worse — the *marketing
pole is not a claim at all* (there is no cited claim asserting "tourism markets
Elko as a nightlife destination"). So "hold both sides" is ungradeable from the
fixture: one side isn't in it. This is the precise gap Phase 2's planned
`divergences` table must fill: represent two opposing, individually-sourced
claims and the reconciliation, and require both poles to exist as claims.

### 3. A causal-status field — association vs causation
`missing_metadata` · surfaced by O05 (and C02)

Relationship/comparison claims (e.g. "Odessa's late-bar depth tracks
population") can only flag themselves as correlational-not-causal in prose. A
`causal_status: association` field on comparison claims would make the
association-not-causation caveat structural and enforceable.

### 4. A coverage index — so the system can detect and abstain on absence
`missing_metadata` / retrieval · surfaced by C03

C03 requires refusing a three-way ranking because North Platte has no
venue-hours pack. **Absence is not retrievable by similarity** — you cannot embed
a document that doesn't exist. Correctly abstaining on a comparability gap needs
a structured coverage map (which claim types exist for which city), queried
before answering. This is a Phase 3/4 retrieval requirement, not a similarity
problem, and it will not be solved by adding pgvector.

## What is already working — replicate it

- **`geography_scope` is well-modeled.** N04 passed *structurally* (not by prose)
  because the county-politics claim carries `scope: "Lincoln County, not North
  Platte city-only"`. That single structured field is why the geography trap is
  enforceable. The other three axes above should copy this discipline.
- **The abstention machinery works.** E04 refused cleanly and even enumerated the
  required evidence. The insufficient-evidence path is solid.

## Recommendation

The audit confirms the plan: **do not add pgvector yet.** Three of four gaps are
*schema* gaps (measures, divergence, causal-status) that full-text + structured
metadata solve; only the coverage index (#4) is a retrieval concern, and it is a
structured-index problem, not an embedding one. Phase 2 should add these four
constructs and reload the Elko/Odessa packs to confirm they load losslessly
*with* the new fields, then re-run this suite adversarially before any embedding
work.

Next: expand this probe to the full 29 and log each failure by the same taxonomy,
then hand the four constructs to the Phase 2 schema design (#12).
