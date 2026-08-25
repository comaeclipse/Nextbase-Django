# Validation Corpus v1

Adopted 2026-08-21 from the owner's batch-of-10 review (NANOGENRE_TAXONOMY.md §12
decisions 5–8). Discovery Corpus v1 (the first ten classified cities) is **frozen**;
this document defines the second corpus, whose job is no longer discovery but
**attack**: the question changes from "what genre is this city?" to "if the ontology
is correct, what should we predict about this city before researching it?"

## Rules of the phase

1. **Same instrument, different hypotheses.** 80–90% of the research questions stay
   identical to the discovery corpus (the standing Blocks 1–3 prompt from
   `generate-dossier-prompt.ts` + the Block 4 template), so scores, divergences and
   falsification rates remain comparable. The questionnaire is NOT redesigned city by
   city. What each city adds is a small **pre-registered falsification module**: 2–4
   hypothesis questions derived from what the current ontology predicts, written down
   *before* research begins (this file is that record).
2. **Predictions are pre-registered before research.** `rank-dossier-candidates.ts
   --predict` output for each in-database target is committed under
   `city-profile-stack/data/validation-corpus-v1/predictions/` at plan time. The
   standing holdout discipline is unchanged: the researcher must never be shown
   these files.
3. **Falsification results are recorded by prediction domain** (§12 decision 8), not
   only as a headline count. Domains: urban form · everyday rhythm ·
   navigability/friction · climate exposure · institutional capacity · lumpy
   infrastructure · economics/housing · civic/social climate.
4. **Prevalence caps are evaluated against this corpus**, not the discovery corpus
   (§12 decision 5). Provisional families stand or fall on out-of-sample behavior.
5. **Labels compress** (§12 decision 7): new proposals prefer short class labels plus
   traits over sentence-length nanogenres.

## Wave A — attacking the Interior Regional Service Hub family

| City | DB | Status | What it attacks |
|---|---|---|---|
| Billings, MT | id 36 | ⚠ already has 55 editorial features (gold-pack era) — **not a propagation holdout**; genre-classification test only | Should be a textbook member: does the family's vocabulary fit without stretching? |
| Rapid City, SD | id 94 | ⚠ already has 50 editorial features — same caveat as Billings | Member-or-not with a tourism anchor (Black Hills) the family hasn't seen |
| Pueblo, CO | id 85 | ✔ predictions pre-registered | Front-Range-adjacent like Cheyenne but non-capital, legacy-industrial: hub or post-industrial city? |
| Amarillo, TX | id 97 | ✔ predictions pre-registered | Plains hub without deep isolation: does the family require isolation or just hinterland service? |
| Lubbock, TX | — not in DB | needs location row via owner's ingest workflow | College-anchored plains hub: anchor-trait test (education as anchor) |
| Bend, OR | id 110 | ✔ predictions pre-registered | Amenity/outdoor boomtown that superficially resembles a hub: **should NOT fit** — growth-destination dynamics instead of hinterland service |

### Pre-registered hypothesis questions (Wave A)

- **Billings:** Does Billings actually function as a broad regional-service hub
  (healthcare, retail, services for a multi-state hinterland), and does its
  falsification profile match the family's signature (low commute burden + high car
  dependence, amenity existence over depth)?
- **Rapid City:** Does heavy tourism (an intensity the interior family has never
  carried) coexist with hub structure, or does tourism displace the hub vocabulary —
  i.e., is tourism a trait overlay on the family or a different type?
- **Pueblo:** Does the family admit a city whose anchor is legacy steel rather than a
  live extraction/government/rail anchor — or is Pueblo better described by a
  post-industrial type the ontology doesn't have yet?
- **Amarillo:** If Amarillo is a hub without Grand-Junction-grade isolation, does
  `geographic_isolation` belong in the family definition or in traits?
- **Lubbock:** Does a large university function as an anchor trait the way energy,
  government and rail do?
- **Bend:** PREDICTED NON-MEMBER. If Bend's dossier reads like a hub, the family
  definition is too loose; expected instead: growth_pressure and amenity-migration
  dynamics closer to a resort/lifestyle type, with the wage-housing squeeze present
  but amenity-driven.

## Wave B — attacking the Historic Coastal Port City family

| City | DB | Status | What it attacks |
|---|---|---|---|
| Wilmington, NC | — not in DB | needs location row | Historic coastal city + port + beach: expected member; tests the family away from the Gulf/Lowcountry |
| Pensacola, FL | id 18 | ✔ predictions pre-registered (top borrow: Mobile at 0.892 — highest similarity yet recorded) | Military-anchored Gulf city: member, or Navy-town type the family shouldn't absorb? |
| St. Augustine, FL | — not in DB | needs location row | Tourism-saturated historic core WITHOUT the working port: does the visitor/resident split survive removal of the port function? |
| Galveston, TX | — not in DB | needs location row | Port + beach + hurricane exposure without a polished historic-tourism economy at Charleston scale: which axes carry the family? |
| Norfolk, VA | id 60 | ✔ predictions pre-registered | Massive port + medical + military depth: does port/institutional depth produce the walkable-core/car-dependent pattern without the heritage-tourism identity? |
| Annapolis, MD | — not in DB | needs location row | Historic walkable waterfront capital without a cargo port: government anchor meets coastal-historic form — which family claims it, or neither? |

### Pre-registered hypothesis questions (Wave B)

- **Wilmington:** Does the walkable-historic-core / car-dependent-outer bundle appear
  intact in a Mid-Atlantic member, and where does Wilmington sit on the discovery
  gradient (predicted: between Savannah and Mobile)?
- **Pensacola:** With Mobile as its 0.892 nearest neighbor, this is the sharpest
  propagation test ever pre-registered — a low falsification count here is the
  family's strongest possible confirmation. Hypothesis: military presence acts as an
  anchor trait, not a type change.
- **St. Augustine:** PREDICTED PARTIAL MEMBER. Does the same resident/visitor split
  arise without the port function — i.e., is the split caused by tourism intensity
  alone, or by the port-city structure?
- **Galveston:** Does hurricane/flood adaptation plus a working port, minus a
  polished historic-tourism machine, still produce the family's signature — or does
  Galveston align with Mobile's "less-discovered" pole so strongly that
  discovery-stage is confirmed as a continuous axis?
- **Norfolk:** PREDICTED STRUCTURAL MEMBER / CULTURAL NON-MEMBER. Port + medical +
  military depth should reproduce walkable-core/car-dependence and the
  capacity-vs-navigability divergence, without heritage-tourism pressure. If Norfolk
  fits *fully*, the family is over-broad (it would be absorbing generic port
  metros).
- **Annapolis:** Boundary probe between the coastal-historic form and a
  government-anchor type; expected to strain both families and possibly neither —
  the most likely source of a new candidate.

## Cross-cutting pre-registrations

- **Humidity convergence:** the borrowed-climate humidity bias should continue
  shrinking as Gulf/Atlantic cities accumulate (prediction error was 0.60 → 0.54 →
  0.47 across Savannah/Mobile/Charleston). Pensacola/Wilmington should show
  humidity predictions ≥ 0.55 and falsification below the 0.30 threshold for the
  first time.
- **No-institutional-inheritance rule:** VA facilities, Level I trauma centers and
  tertiary referral depth are expected to keep defeating propagation in every city
  where they differ from neighbors — each occurrence is logged as confirmation of
  the architectural rule, not as model failure.
- **Navigability generalization:** healthcare_navigability's all-agree prediction
  (~0.36) has held three consecutive passes; it is pre-registered to hold across
  the validation corpus.
- **Squeeze prevalence:** the wage-housing squeeze appeared in 8/10 discovery
  cities under steered selection. Its validation-corpus prevalence is a genuine
  unknown — Bend and Annapolis are pre-registered as likely squeeze cities via the
  amenity-migration mechanism, Amarillo and Lubbock as likely non-squeeze.

## Sequencing and prerequisites

1. Five targets need `locations_location` rows before their passes (owner's CSV
   ingest workflow): Lubbock TX, Wilmington NC, St. Augustine FL, Galveston TX,
   Annapolis MD. Predictions must be generated and committed immediately after
   ingest, before any research.
2. Billings and Rapid City run genre-classification passes only; their propagation
   tests are void (already in the features corpus) and must not be counted in
   falsification trends.
3. The per-city loop itself is unchanged (verify → falsify → import → PR → board →
   §11 review), with the falsification table now also recorded per domain.

## Queued framework work (from the same review)

- `genre-ontology.ts` + `location_genre_assignments` migration, now including the
  two provisional families and the trait-filter representation from the wind ruling.
- First-class divergence schema: {measured_dimension, experienced_dimension,
  divergence_direction, divergence_magnitude, confidence, mechanism} — with
  mechanism capture (e.g. "event programming is episodic rather than ambient" for
  existence-vs-depth).
- Per-domain falsification storage for the prediction engine, encoding the
  borrow-aggressiveness tiers (urban form/navigability: aggressive; climate:
  moderate with coastal-interior guards; institutional/lumpy: never borrowed).
