# Knowledge Model (Phase 2)

**Status: design for review — no migration has been run, no importer exists,
and nothing here touches `locations_location` or `locations_stateinfo`.** This
document is the Phase 2 (#12) deliverable: a durable R&D knowledge model that
the existing corpus loads into losslessly. The machine-readable half lives in
[`lib/knowledge-model.ts`](../lib/knowledge-model.ts); the exit criterion is
proven by
[`scripts/tools/validate-knowledge-model.ts`](../scripts/tools/validate-knowledge-model.ts),
which loads all three gold packs and every experience observation into the
model and round-trips them byte-for-byte.

Inputs, in order of authority:

1. Issue #12 and the ROADMAP Phase 2 checklist.
2. The five constructs handed over by the eval v1 full-suite run
   (`data/evaluations/full-suite-run-2026-08-11.md`): `measures`, a coverage
   tag, `causal_status`, a divergence construct, and calibration-row
   confidence.
3. The three gold packs and `data/experience-observations.json` — the corpus
   the model must hold without loss.

## 1. Design principles

1. **The claim is the atomic unit.** Sources, places, schedules, packs,
   divergences, chunks, and links all exist to contextualize claims. A claim
   is one assertion with its own provenance, scope, and limitations — never a
   paragraph of prose.
2. **Stance is question-scoped, not a property of the claim.** "Rubies is open
   Tuesday to 23:00" *contradicts* "Elko is dead after 8 p.m." but is mere
   *context* for a cost-of-living question. The corpus already demonstrates
   this: the comparison pack reuses Elko Tuesday claims under a different
   stance vocabulary. Stance therefore lives on the pack↔claim relationship
   (`PackClaim`), not on the claim.
3. **Verbatim survives structuring.** Structured fields are added *alongside*
   original text, never instead of it. `geography_scope` keeps its verbatim
   label and gains optional `precision`/`place_ref` fields; an observation's
   fine-grained `evidence_kind` string is preserved as `evidence_detail` under
   a closed `evidence_class`. Lossless loading is a hard requirement, and
   free-text nuance ("Elko area (commenters sometimes blur Elko / Spring
   Creek / county)") is evidence discipline we must not flatten.
4. **A `not_established` claim beats a new field.** The eval found the
   highest-leverage existing pattern is writing the disclaimer directly into a
   claim (`abstention`, `required_evidence`, corpus-boundary claims). Before
   proposing schema, ask whether an explicit claim already expresses it.
5. **Every new field traces to a failing eval question.** The five additions in
   §4 each cite their question IDs. Nothing else was added.
6. **Places, not people** (unchanged from `lib/ontology.ts`): the model stores
   what a place is like and what evidence says; personas stay derived at read
   time.

## 2. Entities

Every record gets a **stable ID** (human-readable slug, permanent once
assigned), a `schema_version`, and explicit freshness fields (`retrieved_on`
for evidence, `as_of` for schedules, `revised_on` for edited records) so
downstream indexes and caches can invalidate without guessing (ROADMAP
item 5).

### 2.1 `Source`

One citable origin of evidence.

| field | notes |
| --- | --- |
| `id` | slug, e.g. `charlees_bar_site` |
| `locator` | URL, or repo-relative path for internal artifacts |
| `source_class` | closed vocabulary, §3.2 |
| `title`, `publisher` | optional display fields |
| `retrieved_on` | date the content was last read |
| `snapshot` | `{ sha256, path, captured_on }` — optional, §6 |
| `pinned_commit` | for internal artifacts: the commit that fixes their content (the trans-teenager pack already does this via `corpus_boundary.reviewed_at_commit`) |
| `refresh_priority` | `recheck_first \| normal \| stable` — structured form of the Elko pack's "the two corroborated-aggregator venues are the ones to re-check first" |

### 2.2 `Place`

| field | notes |
| --- | --- |
| `id` | slug, e.g. `elko_nv/charlees_bar` |
| `name`, `address` | |
| `city`, `state` | |
| `place_kind` | `venue \| district \| city \| county \| metro \| region \| school_district` |
| `resolution_status` | `verified \| unresolved \| closed \| rebranded` |

`unresolved` exists because of claim C6 (the "Garage Bar" lead that could not
be tied to a real Elko venue): an attribution gap is a fact about a *place
record*, and the correction claim links to it.

### 2.3 `Schedule`

Time-specific venue behavior, the part of the exit criterion most easily lost
in prose. One schedule row set per (place, component):

| field | notes |
| --- | --- |
| `id` | slug |
| `place_id` | |
| `component` | `venue \| kitchen \| bar \| program` — Mattie's kitchen closes 20:00 while its bar runs to ~22:00; collapsing them was exactly the E03-style error |
| `program_name` | for `component: program`, e.g. `karaoke` (Charlee's, nightly from 20:00) |
| `rows` | `[{ days: [mon..sun], open, close, closes_next_day }]` — Rubies needs two rows (Tue–Thu 16:00–23:00 vs Fri–Sat 16:00–04:00 `closes_next_day`), plus closed days by omission |
| `temporal_pattern` | §3.6 — makes N07's "seasonal vs weekly year-round" a field instead of a headline-parsing exercise |
| `as_of` | verification date |
| `claim_ids` | the venue_schedule claims this structure was extracted from |

Schedules are *derived from* claims, never a replacement: the claim keeps the
citation and limitations; the schedule makes the hours computable.

### 2.4 `Claim`

The atomic unit. All current pack fields, plus the eval constructs (§4):

| field | notes |
| --- | --- |
| `id` | stable within its pack today (`C3_charlees_karaoke`); globally qualified as `pack_id/claim_id` |
| `claim` | one-sentence assertion, verbatim |
| `claim_type` | §3.1 |
| `evidence_class` / `evidence_detail` | §3.2 — closed class + preserved fine-grained string |
| `confidence` | §3.5 |
| `geography_scope` | `{ label (verbatim), precision?, place_refs? }` |
| `temporal_scope` | verbatim string today; structured pattern optional |
| `quote` | nullable verbatim excerpt |
| `source_ids` / `source_urls` | source references |
| `retrieved_on` | |
| `limitations[]` | verbatim; the eval showed these prose guards work — they stay first-class |
| `measures` | §4.1 |
| `causal_status` | §4.3 |
| `coverage` | §4.2 |
| `place_ids` | optional subject places |

### 2.5 `Pack` (question context)

A gold pack is a *question with an evidenced answer*, and it is the scope
within which stance means anything.

| field | notes |
| --- | --- |
| `pack_id`, `schema_version` | |
| `question`, `question_shape` | §3.7 |
| `geography_scope`, `temporal_scope` | verbatim |
| `retrieved_on`, `ledger_entries[]` | provenance (accepts the singular `ledger_entry` legacy spelling) |
| `corpus_boundary` | for corpus-only questions: `{ reviewed_at_commit, reviewed_on, reviewed_artifacts[], method }` |
| `vocabulary` | the pack-local *subset* of the global registries (§3); the validator enforces subset-ness |
| `method_note`, `notes_on_sourcing` | verbatim |
| `claims` | list of `PackClaim` = claim + `stance` (question-scoped, principle 2) |
| `answer` | `{ verdict, one_line, sentence_trace: [{ sentence, evidence: [claim_id] }] }` — unchanged; sentence-level traceability is the Phase 1 contract |

### 2.6 `Divergence` (new — §4.4)

### 2.7 `Chunk`

The retrieval unit Phase 3 will embed. Defined now so chunking discipline
("bounded, context-rich, never whole essays") is a schema property, not a
habit:

| field | notes |
| --- | --- |
| `id`, `text` | bounded prose with enough context to stand alone |
| `claim_ids`, `source_id` | everything a chunk says must trace to claims |
| `city`, `topic`, `claim_types`, `temporal_scope`, `evidence_class`, `retrieved_on` | copied-down filter metadata (§7) |
| `content_sha256` | invalidation key |
| *(deferred)* | `embedding`, `embedding_model`, `embedding_version` — Phase 3 only, after pgvector review |

### 2.8 `Link`

Typed edges, replacing implicit cross-references:

`rel: corroborates | contradicts | corrects | supersedes | scopes |
cross_references | reuses`

Observed instances the model must carry: C6 *corrects* the Garage-Bar lead by
pointing at C3; X4 *cross_references* X5 (the Midessa geography guard the eval
praised); the comparison pack *reuses* the Elko Tuesday pack wholesale.

## 3. Controlled vocabularies

Global registries live in `lib/knowledge-model.ts`. A pack may declare a local
`vocabulary` block, which must be a **subset** of the registry (validator
enforced) — packs stay small and readable, while the registry stays the single
place a new value must be argued into. This is the drift-avoidance lesson from
`generate-dossier-prompt.ts`: hand-maintained local lists are fine only
because a machine checks them against the ontology.

### 3.1 `claim_type`

`venue_schedule | lived_texture | comparison | method | correction |
corpus_inventory | context | required_evidence | abstention |
not_established`

All but `not_established` are observed in the corpus today.
`not_established` promotes the Elko cultural baseline's not-established list
(the eval's most effective overreach stopper) to a first-class type.

### 3.2 `evidence_class` (+ free `evidence_detail`)

The packs use a coarse closed set; `experience-observations.json` uses 22
fine-grained strings (`oilfield_worker_community_account`,
`state_wildlife_agency_event`, …). Both are right: the class is what
retrieval filters on; the detail is what a reader trusts. Closed classes:

| class | maps from (examples) |
| --- | --- |
| `venue_hours_primary` | venue's own site |
| `venue_hours_aggregator` | Yelp/`restaurantguru`/corroborated listings |
| `community_sentiment` | every `*_community_account` observation kind |
| `institutional` | `institutional_baseline`, chambers, event institutions, member/newcomer orgs, cultural institutions, economic-development bodies |
| `official_statistic` | `federal_labor_market_data`, `state_workforce_agency`, regulations |
| `marketing_material` | destination/tourism organizations — **the E09 pole**; tonight's Packet 1 lands here |
| `internal_corpus_audit` | corpus-inventory and abstention evidence |

`evidence_detail` preserves the original fine-grained string verbatim.

### 3.3 `stance` (question-scoped, three families)

| family | values | source |
| --- | --- | --- |
| evidential | `supports \| contradicts \| context \| attribution_gap` | Elko Tuesday pack |
| comparison | `shared_signal \| material_difference \| asymmetric_evidence` | comparison pack — the vocabulary the eval scored perfectly clean (C01) |
| abstention | `missing_required_evidence \| abstains` | trans-teenager pack |

A pack declares which stances its question shape admits. Divergences (§4.4)
reuse the comparison family within a single city.

### 3.4 `measures` — see §4.1. `availability | attendance | frequency | outcome`

### 3.5 `confidence`

Canonical scale `high | medium | low`. The observations file's `limited` maps
to `low` with the original string preserved (`confidence_detail`).
Calibration rows additionally get `calibration_status: provisional | complete`
(§4.5) — deliberately a separate field, because "how sure is this source" and
"has this row met its own documented evidence bar" are different questions.

### 3.6 `temporal_pattern`

`year_round_weekly | seasonal | event_driven | one_time | unknown` — on
schedules and (optionally) claims. Motivated by N07: "Music on the Bricks" is
seasonal, and today the only way to know is to parse a news headline.

### 3.7 `question_shape`

As used by the eval fixture and packs: `answerable |
cross_city_comparison | comparative_single_city | conflicting_evidence |
insufficient | adversarial_attribution | adversarial_insufficient_evidence |
adversarial_overreach | adversarial_causality | adversarial_geography`.

### 3.8 `geography_scope.precision`

`city | county | metro | blurred_metro | district | corpus_only` — optional
refinement next to the verbatim label. `blurred_metro` is the Midessa lesson
(O08) made filterable.

## 4. The five eval constructs

### 4.1 `measures` — 5 instances (E01, E03, O04, O07, N07)

`measures: availability | attendance | frequency | outcome` on a claim states
what the evidence actually measures. Venue hours are `availability` — they
prove a door is open, not that anyone walks through it. Sentiment about how
busy or integrated things feel is `attendance`/`outcome`. "Every Friday" vs
"summers only" is `frequency`. The answer layer may not satisfy an
attendance-shaped question with availability-shaped evidence; today that rule
lives in per-claim `limitations` prose and failed adversarial probing five
times.

### 4.2 `coverage` — 3 instances (C03, E08, O02)

```
coverage: { basis: census | representative_sample | partial_sample |
            anecdotal | single_source,
            universe: string }
```

On any claim that generalizes: `universe` names what the claim is about
("late-open bars in Elko city"), `basis` says how much of it the evidence
saw. E08's failure was exactly a `partial_sample` being read as a census —
five verified venues silently became "citywide". Cross-city ranking (C03)
additionally needs per-city coverage comparison, which falls out of the same
field: you cannot rank cities whose packs have different `basis` values
without an `asymmetric_evidence` guard.

### 4.3 `causal_status` — 2 instances (O05, C02)

`causal_status: association | causal | unknown` on claims that relate two
facts ("the depth difference tracks population"). Both causality probes were
stopped only by a free-text "association, not a proven cause" sentence; this
makes it structural. Default when absent: no causal reading permitted.

### 4.4 `Divergence` — 1 instance (E09), template from C01

Within-city conflicting evidence, holding both poles instead of averaging
them:

```
{ id, city, topic,
  poles: [ { perspective: lived | marketing | institutional | official,
             claim_ids: [...],       // MUST be real, tagged claims
             status: present | missing } ],
  stance: co_true_different_measures | asymmetric_evidence |
          genuine_conflict | superseded,
  note }
```

The rules copied from the comparison pack's clean pattern: **both poles must
exist as claims** (a divergence may not reference prose), and the divergence
carries an explicit stance rather than implying a winner.
`co_true_different_measures` is the expected common case — marketing says
"vibrant downtown" (an `availability`/`marketing_material` claim) while
residents say "narrow and repetitive" (an `attendance`/`community_sentiment`
claim), and both are true because they measure different things. A pole with
`status: missing` is a research TODO the answer layer must surface as
one-sided evidence — which is precisely E09's current state: the lived pole
exists (S1, S2), the marketing pole has no claims until Packet 1 captures
them. The validator constructs exactly this divergence.

### 4.5 Calibration-row confidence — 1 instance (N02)

`docs/rhythm-calibration.md` rows gain `calibration_status: provisional |
complete`, set to `complete` only when the four-item evidence bar documented
in that same file is satisfied. North Platte's row becomes `provisional`
(items 2 and 4 outstanding — Packet 2). This is a doc-table convention, not a
new entity; it is listed here so the vocabulary is approved in one place.

## 5. Mapping `experience-observations.json`

Preserved as an input, never replaced (ROADMAP item 3). Each of the 34
observations maps to a `Claim` mechanically:

| observation field | claim field |
| --- | --- |
| `observation_key` | `id` |
| `observation` | `claim` |
| `claim_key` + `topic` | `claim_type: lived_texture`, topic kept as subject tag |
| `stance` | *pack-scoped*: retained as `default_stance` hint, applied when a pack adopts the claim |
| `evidence_kind` | `evidence_class` via the §3.2 table + `evidence_detail` (verbatim) |
| `confidence` | canonical + `confidence_detail` for `limited` |
| `geography_scope` | `{ label: verbatim }` |
| `source_url`/`source_title`/`source_excerpt` | source ref + `quote` |
| `source_retrieved_on` | `retrieved_on` |
| `tags` | kept verbatim |
| `city`/`state` | `place_refs` |

The validator performs this mapping for all 34 rows and round-trips them back
to the original JSON to prove nothing is dropped.

## 6. Provenance, snapshots, hashes

- Every source keeps `retrieved_on` (already universal in the corpus).
- **Snapshots** are content-addressed: `data/snapshots/<sha256[0:2]>/<sha256>.
  {html,txt,md}` with the hash stored on the source record. Optional per
  source — small-business pages change without notice, which is *why* the
  hash slot exists — but required before any claim is promoted beyond R&D.
- **Internal artifacts** are pinned by commit instead of snapshot
  (`pinned_commit`), the pattern the trans-teenager pack already uses.
- `refresh_priority` marks which sources to re-verify first on refresh
  (aggregator-sourced hours before primary-sourced ones).
- Chunks carry `content_sha256` so Phase 3 embeddings can be invalidated
  by comparison, not by guesswork.

## 7. Index fields for early filtering (pre-Phase 3)

The metadata that must be filterable *before* any similarity search, per the
architecture guardrails ("filter early; retrieve bounded evidence"):

`city/state` · `geography_scope.precision` · `topic` · `claim_type` ·
`evidence_class` · `confidence` · `measures` · `coverage.basis` ·
`temporal_pattern` / `temporal_scope` · `retrieved_on` (freshness) · stance
(within a pack) · `question_shape` (pack level).

These become the indexed columns / GIN targets in any future DDL and the
filter arguments of the retrieval API.

## 8. Storage: JSON now, SQL later

The checked-in JSON files remain the source of truth for R&D. When Phase 2
review approves this model, the proposed isolated tables (dry-run migration
first, per ROADMAP) are:

`cps_source, cps_place, cps_schedule, cps_claim, cps_pack, cps_pack_claim
(claim↔pack with stance), cps_divergence, cps_chunk, cps_link`

— all additive, `cps_`-prefixed, and separate from the five existing
`location_*` objects listed in `DATABASE.md`. No pgvector; that decision
belongs to Phase 3 and the eval recommends against reaching for it yet.

## 9. Non-goals

- No changes to `locations_location` / `locations_stateinfo`, ever.
- No embeddings, no pgvector column, no retrieval code (Phase 3).
- No stored personas or person-shaped scores (ontology rule).
- No automatic parsing of claim prose into schedules — schedule structuring
  is a deliberate, reviewable act with `claim_ids` provenance.

## 10. Open questions for review

1. **Vocabulary approval** (issue #12's first checkbox): are the registries in
   §3 — especially the seven `evidence_class` values and the four `measures`
   values — the ones to freeze?
2. Should `coverage` be required on every `comparison` claim, or only when a
   claim generalizes beyond enumerated instances?
3. Divergence `stance` values: is `co_true_different_measures` the right name
   for the marketing-vs-lived common case?
4. When Packet 1 lands the Elko marketing-pole claims, do they join the
   existing Tuesday pack (new claims + divergence) or a new pack? Proposal:
   same pack, bumped `schema_version`, since the question is unchanged.
   *Interim answer taken 2026-08-19, reviewable:* a **separate pack**
   (`elko-marketing-vs-lived.claims.json`) — the capture answers a different
   question (portrayal-vs-lived, E09's shape) than the Tuesday pack's
   after-8-p.m. question, and keeping the verified Tuesday pack byte-stable
   preserves it as the round-trip baseline. The new pack references the
   Tuesday pack rather than duplicating it.
