# City Nanogenre Taxonomy (governance doc)

**Status: v1 governance approved; the provisional registry and additive
assignment migration are implemented. The migration has not been run, and
nothing here touches `locations_location` or `locations_stateinfo`.** This
document governs one thing specifically: how a
city gets classified into the broad-genre / microgenre / nanogenre hierarchy
proposed in the wiki source doc. It does **not** re-derive the evidence,
claim, corroboration, or confidence model — those already have an owner (§0)
and this doc adopts them rather than inventing parallel rules.

Inputs, in order of authority:

1. [City Nanogenres: A Data-Driven Framework for Classifying the Character of
   American
   Cities](https://github.com/comaeclipse/Nextbase-Django/wiki/City-Nanogenres:-A-Data%E2%80%90Driven-Framework-for-Classifying-the-Character-of-American-Cities) —
   the source concept doc (56 points). Read that for *why*; this doc is the
   *how*.
2. [`docs/KNOWLEDGE_MODEL.md`](KNOWLEDGE_MODEL.md) — frozen v1 claim/evidence
   model. Anything about sources, claims, stance, corroboration, or confidence
   is governed there, not here.
3. [`../SCHEMA.md`](../../SCHEMA.md) §"City profile stack" — the already-migrated
   L0-L3 tables (`location_research_dossiers`, `location_profile_signals`,
   `location_features`).
4. The [City Nanogenres Research](https://github.com/users/comaeclipse/projects/4)
   project board — 141 per-city cards plus the `[Framework]` cards that trace
   back to sections of this doc.

## 0. Scope: one taxonomy doc, not a second knowledge model

`KNOWLEDGE_MODEL.md` already defines, as frozen v1 policy: claim types,
evidence classes, a `corroborates` link relation (§2.8), a `Divergence`
construct with named stances (§4.4), and canonical confidence (§3.5). The
wiki's points 25-27 (corroboration), 13-14 + 42 (divergence), and 47-48
(evidence object, multidimensional confidence) are **not new schema
questions** — they are the same constructs KNOWLEDGE_MODEL.md already solved,
one layer up. Where this doc's design depends on them, it cites the section
rather than restating it, and flags whether that section is already
implemented (L0-L3 are) or still R&D-only JSON (`cps_*` per KNOWLEDGE_MODEL
§8, not yet migrated).

What actually has no existing owner, and is this doc's real job:

- The genre hierarchy itself (levels, counts, what a "genre" is as opposed to
  a trait) — §1-2
- Admission rules for adding a genre to the taxonomy — §3
- Multi-label membership — §4
- Where an assignment lives in the database — §5
- Review/governance cadence for the taxonomy over time — §8

## 1. What a genre is, as opposed to a trait

A **trait** (`location_features` row, or a future `cps_claim`) is one
measured or claimed fact about a place: `winter_cold_severity = 0.72`,
`specialist_healthcare_access = 0.15`. A **genre** is a recognizable *bundle*
of co-occurring traits that recurs across multiple cities and has
explanatory, not just descriptive, value — "why Casper feels like Casper," not
"Casper's snowfall total." Wiki point 6: nanogenres must not replace traits.
If a distinction is real but doesn't recur across multiple cities, it stays a
trait. Only a recurring *bundle* becomes a genre candidate.

## 2. Hierarchy

Three levels, per wiki point 5:

| Level | Target count | Grain |
| --- | --- | --- |
| `broad` | 10-20 | Coarse family, e.g. "Interior-West Regional Service Hub" |
| `micro` | 40-80 | The Casper-test grain, e.g. "Isolated Interior-West Regional Service Hub" |
| `nano` | 150-250 (hard ceiling) | Most specific reusable archetype, e.g. "Wind-Exposed Mountain-Edge Energy/Service Hub" |

The 250 ceiling on `nano` is a hard operational cap (wiki point 7): unlimited
traits, bounded genres. If the taxonomy is approaching the ceiling, that is a
signal to review for near-duplicates (§3, nonredundancy), not to raise the
ceiling. The ceiling is long-run headroom, not a near-term target: at 141
cities and multi-label tagging, filling even a fraction of 250 well-evidenced
nano genres will take many research passes. An early, sparsely-populated
`nano` level is expected, not a gap.

**Broad-level admission (§12 decision 3, resolved 2026-08-20):** `broad` does
not get its own independent, research-driven admission pass. It is inferred
mechanically once enough `micro` genres exist to cluster: group stabilized
micro genres by shared traits and let the cluster's common ground become the
broad label, rather than researching broad membership city by city. This
matches the wiki's own worked example (points 43-44), which names a primary
*micro* and *nano* genre for Casper but never independently derives a broad
one — broad is a navigational grouping over micro, not a third layer of
fieldwork. Until enough micro genres exist to cluster meaningfully, `broad`
stays unpopulated; that is expected, not a gap.

## 3. Admission rules

A candidate genre (at any level) must clear all six before entering the
registry (wiki point 8):

1. **Minimum membership** — recurs across a defined minimum number of cities,
   not invented for one city's idiosyncrasy (see §11's "no Casper-Type"
   rule).
2. **Meaningful distinction** — differs from its nearest neighbor genre on at
   least one trait a resident would notice.
3. **Reasonable rarity** — not so common it fails to discriminate (e.g. "has
   a downtown" is not a genre).
4. **Nonredundancy** — not already expressed by an existing genre plus a
   trait filter.
5. **Temporal persistence** — the bundle is a structural pattern, not a
   one-season or one-event artifact (ties to KNOWLEDGE_MODEL §3.6
   `temporal_pattern`; an `event_driven` claim alone cannot justify a genre).
6. **Interpretability** — a person unfamiliar with the taxonomy can
   understand the label without a glossary.

Numeric thresholds for #1 and #3, resolved 2026-08-20 (§12 decision 1):

| Level | Minimum members | Maximum prevalence |
| --- | --- | --- |
| `broad` | 5 independently-researched cities | 40% of currently-classified cities |
| `micro` | 3 independently-researched cities | 25% of currently-classified cities |
| `nano` | 2 independently-researched cities | 15% of currently-classified cities |

"Currently-classified" means cities that have reached `Genre Assigned` on the
board, not all 141 — the denominator grows with the research, so a genre's
prevalence is recomputed as new cities are classified rather than judged
against a fixed count that will be wrong for years. A genre that would exceed
its level's maximum prevalence is behaving like the level above it and should
be split or promoted, not admitted as-is. `nano`'s floor of 2 is the literal
form of §11's "no Casper-Type" rule. Admission stays a human editorial call
against all six criteria — these two get a number; the other four stay
judgment calls recorded in `rationale` (§5).

## 4. Multi-label membership

A city holds multiple simultaneous genre memberships per level — this is a
tagging model (wiki point 9), not single-label classification. Casper can be
`micro: Isolated Interior-West Regional Service Hub` while also carrying a
secondary micro-genre if a second bundle applies. Each level additionally
names one **primary** membership (wiki points 43-44's "final classification")
used for display and for the board's `Draft Microgenre` / `Draft Nanogenre`
fields; secondary memberships are real but not shown by default.

## 5. Storage

The registry is [`lib/genre-ontology.ts`](../lib/genre-ontology.ts). It contains
only the two owner-approved provisional micro families; no broad or nano genre
has cleared the admission process. Assignment drafts are validated against the
registry before write, including their level, evidence feature keys, ontology
version, and paired review fields.

The additive table is implemented by
[`migrate-location-genre-assignments.ts`](../scripts/migrations/migrate-location-genre-assignments.ts),
following the same boundary as `location_features`:

```sql
CREATE TABLE location_genre_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  location_id bigint NOT NULL REFERENCES locations_location(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('broad', 'micro', 'nano')),
  -- References the registry in genre-ontology.ts, same pattern as
  -- location_features.feature_key referencing lib/ontology.ts: the TS file
  -- is the source of truth, not a DB foreign key.
  genre_key text NOT NULL CHECK (btrim(genre_key) <> ''),
  is_primary boolean NOT NULL DEFAULT false,
  confidence numeric(4, 3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  -- Verbatim: which claims/features/divergences justified this assignment.
  -- Same "verbatim survives structuring" rule as KNOWLEDGE_MODEL principle 3.
  rationale text NOT NULL CHECK (btrim(rationale) <> ''),
  -- claim_ids / feature_keys / divergence_ids cited, once cps_* exists;
  -- source_signal_keys in the interim (location_profile_signals only).
  evidence jsonb NOT NULL CHECK (
    jsonb_typeof(evidence) = 'object' AND evidence <> '{}'::jsonb
  ),
  ontology_version text NOT NULL CHECK (btrim(ontology_version) <> ''),
  method_version text NOT NULL CHECK (btrim(method_version) <> ''),
  assigned_on date NOT NULL DEFAULT current_date,
  reviewed_by text,
  reviewed_at timestamptz,
  CHECK ((reviewed_by IS NULL) = (reviewed_at IS NULL)),
  CHECK (reviewed_by IS NULL OR btrim(reviewed_by) <> ''),
  UNIQUE (location_id, level, genre_key)
);

-- At most one primary genre per city per level.
CREATE UNIQUE INDEX location_genre_assignments_primary_idx
  ON location_genre_assignments (location_id, level)
  WHERE is_primary;

CREATE INDEX location_genre_assignments_location_id_idx
  ON location_genre_assignments(location_id);
CREATE INDEX location_genre_assignments_genre_key_idx
  ON location_genre_assignments(genre_key);
```

No production migration or assignment import has been run. Assignments remain
an explicit editorial act; the registry does not infer them from feature scores.

## 6. Corroboration (adopted, not reinvented)

Cross-source corroboration (wiki points 25-27) is already `corroborates` in
KNOWLEDGE_MODEL §2.8's `Link` entity. The real work isn't a new field, it's
sequencing:

- **Once `cps_*` ships** (KNOWLEDGE_MODEL §8, not yet migrated): a genre
  assignment's corroboration strength is `count(links WHERE rel =
  'corroborates')` over the claims cited in its `evidence`. Computed at read
  time, not stored — same pattern as `location_features_resolved`.
- **Until then**: `location_profile_signals.SourceUrls` array length is the
  only corroboration proxy available, and it is weak (it counts URLs, not
  independently-agreeing *sources* — a single article syndicated three places
  would over-count). Treat any pre-`cps_*` corroboration state as
  informational, never as a hard admission gate for §3.

The `[Framework] Add cross-source corroboration field` board card should be
re-scoped to "implement the `cps_link` table with `corroborates` support,"
not "invent a new corroboration column" — flagging this for a card-body
update.

## 7. Confidence (derived, not a new 7-column score)

Wiki point 48 wants confidence scored across quantity, source diversity,
quality, recency, specificity, agreement, and measurement-perception
alignment. Storing seven new raw sub-scores would violate KNOWLEDGE_MODEL
principle 5 ("every new field traces to a failing eval question"). Instead,
every one of the seven is already derivable from fields KNOWLEDGE_MODEL v1
already froze, once `cps_*` exists:

| Wiki dimension | Derived from |
| --- | --- |
| Quantity | count of distinct `cps_claim`s cited in `evidence` |
| Source diversity | count of distinct `evidence_class` values among those claims (§3.2) |
| Quality | `evidence_class` itself — `official_statistic`/`institutional` outrank `marketing_material`/`community_sentiment` |
| Recency | min/max `retrieved_on` across cited sources |
| Specificity | `coverage.basis` (§4.2) — `census`/`representative_sample` vs. `anecdotal`/`single_source` |
| Agreement | ratio of `corroborates` to `contradicts` links (§2.8) among cited claims |
| Measurement-vs-perception alignment | literally the `Divergence` construct (§4.4) — see §8 below, not a separate score |

None of this needs new storage. It needs `cps_*` implemented and a read-time
rollup function, the same shape as `location_features_resolved`. The
`[Framework] Extend confidence model to be multidimensional` card should be
re-scoped accordingly.

## 8. Agreement / Divergence (adopted, not reinvented)

The board's `Divergence Flag` field (`None` / `Minor` / `Notable`) is a
display-layer rollup of KNOWLEDGE_MODEL §4.4's `Divergence.stance`:

| `Divergence.stance` | Board `Divergence Flag` |
| --- | --- |
| `co_true_different_measures` (expected: marketing and lived experience measure different things, wiki's Casper case) | `Minor` |
| `asymmetric_evidence` (one pole thin or missing) | `Minor` |
| `genuine_conflict` | `Notable` |
| `superseded` | `None` |
| no divergence recorded for this city/topic | `None` |

Once `cps_divergence` exists, this rollup should be computed, not
hand-flagged per card. Until then, `Divergence Flag` stays a human judgment
call made during the `Corroborated` → `Signals Drafted` board transition,
following the same six-question Casper reconciliation table pattern (wiki
point 42): compare `location_features` (measured) against
`location_profile_signals` (experienced) per trait and flag where they
disagree.

## 9. Process: mapping to the board

The board's `Status` column is the 8-phase workflow from wiki point 53,
narrowed to the phases that are genuinely per-city manual work (see the
original design conversation — structural/derived phases 1-2 stay automated
via `derive-structural-features.ts` and are not tracked as card movement):

`Not Started → Sources Gathered → Claims Extracted → Corroborated → Signals
Drafted → Genre Assigned → Reviewed`

`Genre Assigned` means: at least one `is_primary` row exists per applicable
level in `location_genre_assignments` (once migrated), each citing a
`rationale` that satisfies §3's six criteria. `Reviewed` means a second
person checked that rationale against the admission rules, not just that the
label reads well.

## 10. Non-goals

- No re-derivation of claim, source, evidence-class, or stance vocabulary —
  that is KNOWLEDGE_MODEL.md's frozen v1, unconditionally.
- No genre invented for a single city's idiosyncrasy before it recurs
  elsewhere (§3 #1) — see §11's "no Casper-Type" governance rule.
- No collapsing `Divergence` into an averaged score. Holding both poles is
  the point (KNOWLEDGE_MODEL §4.4, wiki point 14).
- No new confidence columns where a read-time rollup over existing fields
  already answers the question (§7).
- No production read path (Explore filter, city page, chat tool) built on
  this taxonomy before it clears the same go/no-go gate as the rest of
  `city-profile-stack` (ROADMAP.md Phase 6).

## 11. Governance / review cadence

Wiki point 54: be generous admitting **traits**, conservative admitting
**genres**. Concretely:

- A genre candidate that has cleared §3 for exactly one city stays informal
  (recorded in a card's `rationale`, not in `genre-ontology.ts`) until a
  second, unrelated city's research independently produces the same bundle.
  This is the literal "no Casper-Type category" rule wiki point 54 names.
- Once in the registry, a genre is reviewed on two triggers, resolved
  2026-08-20 (§12 decision 2): whenever a batch of 10 cities newly reaches
  `Genre Assigned` on the board — the natural checkpoint where enough new
  recurrence evidence has accumulated to matter — and a quarterly calendar
  backstop regardless of research pace, so the taxonomy doesn't silently
  stagnate if dossier work slows for a season. Dossier-triggered alone was
  rejected because research pace is uneven; calendar-only alone was rejected
  because a fixed cadence divorced from actual new evidence either fires on
  nothing changed or lags a research burst.
- Sign-off on admitting a new genre (§12 decision 4, resolved 2026-08-20)
  reuses the board's per-city `Reviewed` reviewer model — there is no
  separate taxonomy-owner role to staff. The one addition: whoever authored a
  candidate's `rationale` may not also be its sole reviewer, and review means
  checking the rationale line-by-line against all six §3 criteria, not
  approving a label that reads well. On a single-maintainer project this
  means review happens as a deliberate second pass, not in the same sitting
  as drafting. This rule governs *genre admissions* going forward
  (`genre-ontology.ts` entries); the owner explicitly approved resolving §12
  itself in a single pass, so that policy-setting round is marked Reviewed
  without a separate reviewer.
- Any of this doc's rules can be reopened by a card or issue that cites a
  failing case, same policy as KNOWLEDGE_MODEL §10.

## 12. Decisions (resolved 2026-08-20)

These four were the open questions in the first draft of this document.
Resolved as follows and recorded here as v1 policy, same convention as
KNOWLEDGE_MODEL.md §10. Any of them can be reopened by a card or issue that
cites a failing case.

1. **Thresholds are per-level and prevalence-relative, not one global
   number** (§3). A single minimum/maximum pair across all three levels
   would either starve `nano` (which needs to tolerate small, specific
   clusters) or let `broad` admit near-universal, non-discriminating
   categories. Minimums fall as the level gets finer (`broad` 5, `micro` 3,
   `nano` 2 — literally the "no Casper-Type" rule at the `nano` floor);
   maximum prevalence is expressed as a percentage of *currently-classified*
   cities, not a fixed count, so the rule stays meaningful as the corpus
   grows from today's 141 toward however many the project eventually
   covers.
2. **Review cadence is dual-triggered, not single** (§11). Batch-of-10
   `Genre Assigned` checkpoints catch drift while research is active;
   the quarterly backstop catches drift when it isn't. Neither alone was
   sufficient: purely dossier-triggered review goes silent exactly when
   research stalls, and purely calendar review either fires on no new
   evidence or lags behind a productive stretch.
3. **`broad` is inferred from `micro`, not independently admitted** (§2).
   The wiki's own Casper case study (points 43-44) never derives a broad
   genre for Casper — only micro and nano. Researching broad membership
   city-by-city would duplicate work already done at the micro grain for no
   added evidence; clustering stabilized micro genres is strictly cheaper
   and matches how the concept doc actually uses the hierarchy in practice.
4. **Sign-off reuses the existing per-city reviewer model** (§11), not a new
   taxonomy-owner role. Standing up a distinct governance seat for a genre
   registry this small is premature process for a project whose entire
   per-city pipeline already runs on a single `Reviewed` status and a
   `Reviewed By` field. The only addition needed is separating drafting from
   review by person and by sitting, which the existing board fields already
   support without a schema change.

### Resolved 2026-08-21 (batch-of-10 review, owner)

Recorded from the owner's batch-of-10 review after the tenth classified city
(Charleston). Same reopening convention as decisions 1-4: any of these can be
reopened by a card or issue that cites a failing case.

5. **The first ten cities are Discovery Corpus v1, and discovery prevalence
   does not trigger prevalence-cap rejection.** The discovery corpus was
   deliberately steered (recurrences were chased on purpose), so its
   prevalence figures are selection artifacts, not population estimates —
   finding 5/10 regional-service hubs does not mean 50% of American cities
   are hubs, but it does mean the pattern has been observed enough times to
   propose. The §3 maximum-prevalence caps therefore apply to the validation
   corpus or a representative reference corpus, never to discovery
   prevalence. No selection-adjusted denominator is introduced (that would
   be a second modeling choice compensating for a deliberately biased
   sample). The admission pipeline is: observed once → candidate →
   recurrence → provisional family → out-of-sample validation → admitted
   ontology. Discovery Corpus v1 (Casper, Victorville, Gilbert, Odessa,
   Cheyenne, North Platte, Grand Junction, Savannah, Mobile, Charleston) is
   frozen as of this review.
6. **Two provisional families are admitted at the provisional-family stage**
   (not the admitted-ontology stage — both await out-of-sample validation):
   **Interior Regional Service Hub** (Casper, Odessa, Cheyenne, North
   Platte, Grand Junction) — the class describes why the city exists in its
   regional network (an isolated or semi-isolated city providing
   disproportionately important services/employment/institutions to a
   geographically broad hinterland), with per-city *anchor traits* (energy;
   energy/trade boom-cycle; state government; rail/logistics;
   healthcare/public-land gateway) explaining which version it is — North
   Platte's rail anchor is evidence *for* the family, not a unification
   problem. And **Historic Coastal Port City** (Savannah, Mobile,
   Charleston) — one latent type whose members occupy different positions
   along continuous structural axes (tourism intensity, institutional/
   medical depth, blue-collar port orientation, historic-core walkability,
   outer-fabric car dependence, growth pressure, beach access,
   affordability, visitor/resident split). The three-city "discovery
   gradient" is interpreted as positions on those axes, NOT as three
   sibling nanogenres; sibling promotion waits until repeated clusters
   separate out-of-sample (e.g. Charleston-like vs Savannah-like across
   Wilmington, St. Augustine, Annapolis, Pensacola, Galveston, Norfolk).
7. **Genres compress; traits describe. Labels should get shorter as the
   model improves, not longer.** A sufficiently descriptive nanogenre
   becomes a unique ID for one city and stops doing modeling work; if
   knowing the class tells you nothing you didn't already read in the class
   name, it isn't a class. Test: "would another city ever naturally inherit
   this label?" If not, part of the phrase belongs in traits. Exemplar:
   "Cajon-Pass-Dependent Housing-Value Logistics Exurb" decomposes into
   micro "High-Desert Commuter/Logistics Exurb" + traits (housing-value
   refuge, pass dependency, logistics employment, extreme heat, moderate
   wind exposure), so Hesperia or Palmdale could meaningfully challenge or
   reinforce the category. Applies to new labels going forward; existing
   discovery-corpus labels are kept as-is (frozen with the corpus) and
   compressed at validation time.
8. **Falsification results are stratified by prediction domain, and
   geographically similar cities do not inherit discrete institutions.**
   The headline falsified-count trend (11/31 → ... → 4/33) must not be
   summarized as a single error rate: predicting urban form, everyday
   rhythm, navigability/friction, climate exposure, institutional capacity
   and lumpy infrastructure are radically different tasks with radically
   different observed performance (urban form and navigability generalize
   strongly — healthcare_navigability's all-agree prediction confirmed
   three consecutive passes; institutional capacity and discrete
   infrastructure generalize worst — VA hospitals and tertiary-medicine
   depth defeated propagation in four passes). The no-institutional-
   inheritance rule is architectural for the propagation engine, not merely
   an observed error: it defines what may be borrowed aggressively.
   Divergence families (capacity-vs-navigability, existence-vs-depth,
   commute-vs-car-dependence, and successors) are promoted to first-class
   analytical objects; a schema on the shape
   {measured_dimension, experienced_dimension, divergence_direction,
   divergence_magnitude, confidence, mechanism} is queued as framework
   work.
