# City Profile Stack Roadmap

**North star:** [PRODUCT.md](PRODUCT.md) — the goal in plain words.

**Status:** the two products (**"what's like Elko?"** and **"best city for this
person?"**) already run against all ~114 cities via `scripts/tools/`. What is
still R&D is the *evidence layer* underneath and the go/no-go on putting the
answers in front of users. This module is not yet a production feature and no
database write happens by default. The phases below harden the evidence; they do
not rebuild the engine.

## Product decision

We are building a way to answer nuanced questions such as "what cities are like
Elko?" and "what's the best city for this kind of person?" with evidence,
caveats, and meaningful counterexamples.

The system must combine three things:

1. **Structured facts** for stable, filterable claims: a venue, its hours, a
   major employer, industry mix, election results, or an event calendar.
2. **Evidence-backed local observations** for lived texture: whether a normal
   Tuesday feels quiet, whether work is shift-driven, or whether social life is
   event-dependent.
3. **Semantic retrieval** for a user's natural-language question, constrained
   by the claim type, geography, date, and evidence quality.

Embeddings help find relevant evidence; they must never turn a single Reddit
comment or tourism listing into a citywide fact.

## Architecture guardrails

The chat model is the natural-language interface and synthesis layer, not the
primary database, search engine, or calculator. Keep these boundaries explicit
as the corpus grows:

1. **Use the right engine for the question.** Exact IDs and stable facts use
   indexed lookup/SQL; rankings and cost calculations stay deterministic;
   prose and lived-texture evidence use retrieval. Do not force every question
   through embeddings.
2. **Keep calculations out of the model.** Aggregation, filtering,
   disqualification, affordability arithmetic, and similarity scoring belong in
   SQL or typed application code. The model should explain returned results,
   not reproduce the math from a bag of retrieved chunks.
3. **Retrieve bounded evidence, not the corpus.** Filter early by geography,
   subject, claim type, time, and evidence quality; retrieve a candidate set;
   then optionally rerank. Only the strongest supporting and contradicting
   evidence should reach the answer model.
4. **Prefer a fast path over an agent loop.** Common intents should eventually
   route deterministically or through a very small/fast classifier. Multi-step
   model/tool loops are for genuinely ambiguous or compositional questions, not
   the default for every request.
5. **Version everything that can make an answer stale.** Source snapshots,
   claim hashes, derived features, embedding model/version, index version, and
   cache keys must make invalidation explainable and reproducible.
6. **Ground before fluency.** A fast unsupported answer is a failure. Missing,
   contradictory, stale, or insufficient evidence must remain visible through
   retrieval, scoring, and final synthesis.

## Current snapshot

### Implemented

- The local `city-profile-stack/` project, with a feature ontology,
  deterministic structural derivation, profile matching, candidate ranking,
  similarity tools, and source data.
- Additive experimental database migrations and importers for dossiers,
  signals, features, texture markers, and experience observations.
- A source-level observation model with `supports`, `contradicts`, and
  `context` stances, plus full-text search.
- Local research preservation: `data/research-ledger.json` and
  `data/conversation-captures/` retain collaborative work before any optional
  import.
- Initial comparative work for Elko, Odessa, and North Platte, including the
  industrial-versus-social-rhythm hypothesis.
- A grounded `/chat` route with explicit tools for similarity, person-to-city
  matching, cost estimates, and state tax/gas comparison. Tool results are
  structured JSON and deterministic application code owns the scoring/math.

### In progress

- Normalizing the captured research into small, source-linked claims.
- Separating availability from lived use: an open late bar is not proof of a
  broad late-night social scene.
- Calibrating the Elko / Odessa / North Platte comparison without treating
  different kinds of industrial towns as interchangeable.

### Not yet built

- A canonical knowledge schema for source documents, venues, schedules,
  claims, divergences, chunks, and links between them.
- The `pgvector` extension, embeddings, hybrid retrieval, and an answer path.
- A retrieval evaluation set and quality gates.
- Request/result caching, precomputed/materialized retrieval artifacts, or
  explicit cache invalidation rules.
- A low-latency routing fast path separate from the general model/tool loop.
- End-to-end latency, retrieval, and tool-routing instrumentation with p50/p95
  budgets.
- Any production UI or integration with VetRetire search.

## Known scale and latency concerns

These are not blockers at the current corpus size, but they should become
measured gates before broad expansion:

- **Application-side full scans.** Current similarity and profile matching read
  the location/feature population into application memory and score there. That
  is simple and appropriate for the current small corpus, but it should not be
  assumed to scale linearly forever. Benchmark before expansion and move
  filtering/ranking into indexed SQL, materialized vectors, or ANN retrieval
  when scans become a measurable bottleneck.
- **LLM-only routing.** `/chat` currently lets the model choose tools and can
  take multiple model/tool steps. This is flexible, but every extra round trip
  increases latency and failure surface. Common one-tool intents should gain a
  deterministic/fast routing path once their language is stable enough.
- **No request cache by design.** Live, force-dynamic reads are useful during
  development, but repeated similarity, trait-catalog, and stable structural
  queries will eventually benefit from versioned caching or materialization.
  Cache invalidation must be tied to data/source versions, not arbitrary TTLs
  alone.
- **RAG is not the analytics engine.** Phase 3 semantic retrieval should add an
  evidence path, not replace the existing SQL/application query layer. Numeric
  comparisons, rankings, filters, and aggregations should remain deterministic.
- **Reranking has a cost.** Add reranking only where evaluation shows that the
  retrieval-quality gain justifies the latency. Exact lookup and strongly
  filtered queries should be allowed to bypass it.
- **Context growth can quietly destroy latency.** Set an evidence/context
  budget and measure answer quality against it rather than allowing retrieved
  chunks to grow with the corpus.

## Roadmap

### Phase 0 - Preserve the corpus

**Goal:** nothing useful from research conversations disappears.

- [x] Create a local research ledger and conversation-capture directory.
- [ ] Require every new research pass to create an artifact and ledger entry.
- [ ] Record source URLs, date checked, geography scope, and uncertainty.

**Exit condition:** every Elko, Odessa, and North Platte claim can be located
in a checked-in local artifact, even if it is still unverified.

### Phase 1 - Build one gold-standard pack: Elko on a normal Tuesday

**Goal:** prove the method before designing a system for every city.

- [x] Extract atomic claims from the Elko Tuesday research.
- [x] Add the actual source links and distinguish direct quotes from summaries.
- [x] Model the relevant venues, Tuesday schedules, and dated observations.
- [x] Capture the marketing-versus-lived-experience divergence explicitly.
- [x] Write a short, source-cited answer to: "Is Elko dead after 8 p.m. on a
      normal Tuesday?"
- [x] Add counterevidence: late venues, karaoke, casinos, special events, and
      seasonal exceptions.

**Exit condition:** a reviewer can trace every sentence of the answer to a
source, see its limitations, and understand why the conclusion is narrower
than "Elko has nightlife" or "Elko is dead."

**Delivered:** `data/gold-packs/elko-tuesday-after-8pm.md` (answer + venue
schedule + divergence + counterevidence) and `elko-tuesday-after-8pm.claims.json`
(atomic claims with source URLs, direct quotes, stances, and per-claim
limitations). Six venue schedules verified and re-confirmed 2026-08-07 (three
primary-sourced, two corroborated across multiple listings). One optional
refinement remains before the answer moves from "open" to "lively": a
representative weekday foot-traffic sample.

### Phase 2 - Design the isolated knowledge model

**Goal:** move from documents to durable local knowledge without touching the
main location table.

- [x] Approve a small controlled vocabulary for claim type, evidence kind,
      stance, temporal pattern, geography scope, and confidence.
      (`docs/KNOWLEDGE_MODEL.md` §3, frozen as v1 per §10 decision 1;
      registries live in `lib/knowledge-model.ts`.)
- [x] Define an R&D schema for `sources`, `places`, `schedules`, `claims`,
      `divergences`, `knowledge_chunks`, and link tables.
      (`docs/KNOWLEDGE_MODEL.md` §2; proposed `cps_*` tables in §8.)
- [x] Map the existing `location_experience_observations` table into that
      model; preserve it as an input rather than silently replacing it.
      (§5; `validate-knowledge-model.ts` round-trips all 34 rows.)
- [ ] Add source snapshots/content hashes and claim-level provenance.
      (Claim-level provenance is in place; snapshot *capture* is designed in
      §6 but not yet implemented.)
- [x] Give source, claim, place, chunk, and derivation records stable IDs and
      explicit version/freshness fields so indexes and caches can be invalidated
      without guessing. (§2 preamble.)
- [x] Identify the metadata fields that must be indexed for early filtering:
      geography, subject, claim type, temporal scope, stance, source quality,
      and freshness. (§7.)
- [ ] Create migration and importer dry runs only after the model review.

**Exit condition:** the Elko pack loads losslessly into the proposed model,
including conflicting evidence and time-specific venue hours, and every loaded
claim can be deterministically traced back to a versioned source snapshot.

### Phase 3 - Add hybrid semantic retrieval

**Goal:** retrieve the best evidence, not the most similar paragraph.

- [ ] Enable pgvector in an isolated R&D database/schema after Phase 2 review.
- [ ] Embed bounded, context-rich knowledge chunks; do not embed whole essays.
- [ ] Store the embedding model/version and source/chunk hashes.
- [ ] Combine vector similarity with full-text search and metadata filters for
      city, subject, claim type, scope, date, and evidence quality.
- [ ] Apply selective query expansion/reranking only when the baseline hybrid
      result is insufficient; measure whether each extra stage earns its
      latency.
- [ ] Define a bounded candidate count and final evidence/context budget instead
      of allowing retrieval size to grow with corpus size.
- [ ] Return a typed evidence packet containing citations, supporting evidence,
      counterevidence, uncertainty, source freshness, and retrieval scores.
- [ ] Preserve bypass paths for exact lookup and structured analytics; semantic
      retrieval must not become the mandatory gateway to all data.

**Exit condition:** the system retrieves Elko Tuesday evidence for the
after-8-p.m. question without surfacing irrelevant tourism prose as the answer,
and does so with a bounded candidate/evidence set whose latency is measured.

### Phase 4 - Evaluate retrieval, routing, and latency before scaling

**Goal:** demonstrate that the system behaves better than a generic chat
summary without hiding unacceptable latency or routing errors.

- [ ] Create 20-30 answerable test questions across Elko, Odessa, and North
      Platte.
- [ ] Include adversarial questions and questions with insufficient evidence.
- [ ] Include mixed intent tests: exact lookup, similarity, profile matching,
      cost/tax analytics, evidence retrieval, and questions that require more
      than one subsystem.
- [ ] Score citation correctness, geographic precision, temporal precision,
      counterevidence coverage, unsupported-claim rate, and retrieval recall for
      known relevant evidence.
- [ ] Score tool/route correctness separately from final-answer quality so a
      fluent answer cannot hide a bad execution path.
- [ ] Record per-stage timing: route/intent decision, SQL/lookup, lexical/vector
      retrieval, optional rerank, model time-to-first-token, total response,
      tool-step count, and context size.
- [ ] Report p50 and p95 rather than averages alone; keep a warm-path and
      cold-path result where infrastructure makes that distinction meaningful.
- [ ] Establish provisional production targets. Starting point: deterministic
      retrieval below ~250 ms p95 on the warm path, common one-tool requests
      limited to one tool round trip, and first useful streamed text near or
      below ~1 second when the model/provider permits it. Treat these as
      benchmark targets, not promises.
- [ ] Fix schema, metadata, chunking, routing, or latency failures before adding
      more cities.

**Exit condition:** every test answer is either well-cited and appropriately
qualified, or explicitly says the corpus cannot support a conclusion; common
intents route correctly; and no known stage has unbounded work as corpus size
increases.

### Phase 5 - Scale by research cohort

**Goal:** expand sustainably, not one sprawling essay at a time.

- [ ] Select a 12-city cohort with deliberately different local economies and
      social rhythms.
- [ ] Run the same bounded research template for each city.
- [ ] Add cross-city questions such as "places like Elko, but with a stronger
      healthcare employment base" and inspect the evidence behind results.
- [ ] Use failures to revise the vocabulary and corpus template.
- [ ] Re-run the Phase 4 quality/latency suite at roughly 10x and, using
      generated or staging-only scale data if necessary, 100x the current
      evidence volume so the first production bottleneck is discovered before
      the real corpus reaches it.
- [ ] Benchmark current application-side ranking against DB-side filtering,
      precomputed/materialized feature vectors, and indexed/ANN candidates;
      migrate only when the simpler path measurably misses the budget.
- [ ] Verify that retrieval candidate count, model context size, and number of
      model/tool round trips remain bounded as the corpus grows.

**Exit condition:** comparable cities can be ranked with an explanation of
both shared bones and material differences, while the same query class retains
predictable work and acceptable p95 latency as evidence volume increases.

### Phase 6 - Decide whether to productize

**Goal:** only connect R&D to VetRetire once it is trustworthy and useful.

- [ ] Choose a narrow user experience: evidence panel, "ask about a place," or
      research-assisted comparison.
- [ ] Define editorial review, correction, source-refresh, and deletion rules.
- [ ] Define the production query matrix: which intents use direct lookup,
      deterministic analytics, hybrid retrieval, or multi-step orchestration.
- [ ] Define cacheable artifacts and invalidation keys before introducing a
      cache: e.g. feature-vector version, source/claim hash, embedding version,
      retrieval-index version, and model-independent structured results.
- [ ] Define observability for route choice, tool errors, retrieval misses,
      citation failures, latency, token/context size, and cache effectiveness.
- [ ] If private or user-specific sources are ever added, enforce authorization
      before retrieval/filtering rather than removing unauthorized evidence
      after it reaches the model.
- [ ] Add production migrations and UI only with explicit approval.

### Phase 7 - Production hardening and low-latency path

**Goal:** if Phase 6 approves productization, make common requests boring,
predictable, observable, and fast before optimizing rare agentic cases.

- [ ] Add a fast intent path for stable/common requests. Prefer deterministic
      routing where phrasing is reliably recognized; use a small/fast classifier
      where language is ambiguous; fall back to the general model/tool planner
      only when needed.
- [ ] Precompute or materialize stable feature vectors, derived summaries, and
      other repeated query inputs rather than rebuilding the entire working set
      on every request.
- [ ] Move broad scans/ranking into indexed SQL or ANN candidate generation when
      Phase 5 benchmarks show the in-memory implementation no longer meets the
      budget.
- [ ] Run independent retrieval work in parallel where semantics allow it
      (e.g. lexical + vector candidate retrieval), then merge before synthesis.
- [ ] Add versioned caches for safe repeated structured results and retrieval
      candidates. Never cache away freshness/provenance changes.
- [ ] Keep a strict model context budget and prefer compact typed tool results
      over raw source text whenever the answer does not require prose evidence.
- [ ] Keep the common path to one model synthesis call after retrieval whenever
      possible. Multi-step loops must justify themselves in evaluation.
- [ ] Stream final synthesis immediately after enough evidence is available;
      measure time-to-first-useful-token separately from total completion time.
- [ ] Define degraded behavior for unavailable model/provider, retrieval index,
      or optional reranker so one nonessential component does not take the whole
      product down.
- [ ] Add load/concurrency testing and track p50/p95/p99 latency, error rate,
      cache hit rate, retrieval candidate counts, model/tool step counts, and
      answer-grounding metrics together.

**Exit condition:** common supported questions have a bounded, documented
execution path; latency and grounding meet the production SLOs under load; and
larger corpus size does not silently increase scans, context, or model/tool
round trips.

## Non-goals for now

- No bulk AI-generated city profiles presented as facts.
- No automatic promotion from a chat or a single review to production data.
- No citywide nightlife score inferred from venue hours alone.
- No embedding database or production chat UI before the gold pack and
  evaluation set pass review.
- No premature replacement of simple SQL/application ranking solely because a
  vector database or agent framework is available.
- No optimization whose only evidence is architectural fashion; complexity must
  buy measured quality, scale, or latency.

## Chat integrity (#16–#18)

The grounded `/chat` assistant exposed matcher and coverage gaps: missing
dealbreaker traits were not enforced in ranking, five recently imported cities
had no profile features, VA hospital coverage is nearly empty, and tax facts
exist on `locations_location` but not in the profile ontology.

**Plan:** [docs/CHAT_INTEGRITY_PLAN.md](docs/CHAT_INTEGRITY_PLAN.md) — strict
`requireKnown` / dealbreaker matching, chat polish, post-import structural
derive, and typed VA facilities backfill. Tax ontology and street-life editorial
expansion are deferred there.

## Immediate next action

Execute [docs/CHAT_INTEGRITY_PLAN.md](docs/CHAT_INTEGRITY_PLAN.md) (matcher first,
then derive + VA backfill). The Elko Tuesday gold pack remains the evidence-layer
north star for lived-texture research. The scale/latency work above remains a
measured gate for later phases rather than a reason to complicate the current
small-corpus implementation prematurely.
