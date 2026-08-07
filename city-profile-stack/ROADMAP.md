# City Profile Stack Roadmap

**Status:** local-first research and development. This module is not a
production RAG feature and no database write should occur by default.

## Product decision

We are building a way to answer nuanced questions such as "How many Elkos are
in the database?" with evidence, caveats, and meaningful counterexamples.

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
- Any production UI or integration with VetRetire search.

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

- [ ] Extract atomic claims from the Elko Tuesday research.
- [ ] Add the actual source links and distinguish direct quotes from summaries.
- [ ] Model the relevant venues, Tuesday schedules, and dated observations.
- [ ] Capture the marketing-versus-lived-experience divergence explicitly.
- [ ] Write a short, source-cited answer to: "Is Elko dead after 8 p.m. on a
      normal Tuesday?"
- [ ] Add counterevidence: late venues, karaoke, casinos, special events, and
      seasonal exceptions.

**Exit condition:** a reviewer can trace every sentence of the answer to a
source, see its limitations, and understand why the conclusion is narrower
than "Elko has nightlife" or "Elko is dead."

### Phase 2 - Design the isolated knowledge model

**Goal:** move from documents to durable local knowledge without touching the
main location table.

- [ ] Approve a small controlled vocabulary for claim type, evidence kind,
      stance, temporal pattern, geography scope, and confidence.
- [ ] Define an R&D schema for `sources`, `places`, `schedules`, `claims`,
      `divergences`, `knowledge_chunks`, and link tables.
- [ ] Map the existing `location_experience_observations` table into that
      model; preserve it as an input rather than silently replacing it.
- [ ] Add source snapshots/content hashes and claim-level provenance.
- [ ] Create migration and importer dry runs only after the model review.

**Exit condition:** the Elko pack loads losslessly into the proposed model,
including conflicting evidence and time-specific venue hours.

### Phase 3 - Add hybrid semantic retrieval

**Goal:** retrieve the best evidence, not the most similar paragraph.

- [ ] Enable pgvector in an isolated R&D database/schema after Phase 2 review.
- [ ] Embed bounded, context-rich knowledge chunks; do not embed whole essays.
- [ ] Store the embedding model/version and source/chunk hashes.
- [ ] Combine vector similarity with full-text search and metadata filters for
      city, subject, claim type, scope, date, and evidence quality.
- [ ] Return citations, supporting evidence, counterevidence, and uncertainty
      with every candidate answer.

**Exit condition:** the system retrieves Elko Tuesday evidence for the
after-8-p.m. question without surfacing irrelevant tourism prose as the answer.

### Phase 4 - Evaluate before scaling

**Goal:** demonstrate that the retrieval behaves better than a generic chat
summary.

- [ ] Create 20-30 answerable test questions across Elko, Odessa, and North
      Platte.
- [ ] Include adversarial questions and questions with insufficient evidence.
- [ ] Score citation correctness, geographic precision, temporal precision,
      counterevidence coverage, and unsupported-claim rate.
- [ ] Fix schema, metadata, and chunking failures before adding more cities.

**Exit condition:** every test answer is either well-cited and appropriately
qualified, or explicitly says the corpus cannot support a conclusion.

### Phase 5 - Scale by research cohort

**Goal:** expand sustainably, not one sprawling essay at a time.

- [ ] Select a 12-city cohort with deliberately different local economies and
      social rhythms.
- [ ] Run the same bounded research template for each city.
- [ ] Add cross-city questions such as "places like Elko, but with a stronger
      healthcare employment base" and inspect the evidence behind results.
- [ ] Use failures to revise the vocabulary and corpus template.

**Exit condition:** comparable cities can be ranked with an explanation of
both shared bones and material differences.

### Phase 6 - Decide whether to productize

**Goal:** only connect R&D to VetRetire once it is trustworthy and useful.

- [ ] Choose a narrow user experience: evidence panel, "ask about a place," or
      research-assisted comparison.
- [ ] Define editorial review, correction, source-refresh, and deletion rules.
- [ ] Add production migrations and UI only with explicit approval.

## Non-goals for now

- No bulk AI-generated city profiles presented as facts.
- No automatic promotion from a chat or a single review to production data.
- No citywide nightlife score inferred from venue hours alone.
- No embedding database or production chat UI before the gold pack and
evaluation set pass review.

## Immediate next action

Finish the **Elko normal-Tuesday gold pack** locally. It is the smallest test
that can prove whether this project produces useful, inspectable answers rather
than another never-ending research pipe.
