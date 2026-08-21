# Program state

**The one document to load for "where is the nanogenre program right now."**
Updated **in place** at the end of every pass and every governance decision;
git history is the changelog. Do not re-narrate this state inside dossier
notes or ledger entries — reference it.

*As of: 2026-08-21 (post batch-of-10 review; Validation Corpus v1 adopted).*

## Corpus status

- **Discovery Corpus v1 — FROZEN (10 cities):** Casper WY (prototype),
  Victorville CA, Gilbert AZ, Odessa TX, Cheyenne WY, North Platte NE, Grand
  Junction CO, Savannah GA, Mobile AL, Charleston SC. All imported to Neon,
  all §11 owner-reviewed. Discovery prevalence is exempt from admission caps
  (§12 decision 5).
- **Validation Corpus v1 — ACTIVE, no passes run yet.** Two attack waves; see
  [VALIDATION_CORPUS_V1.md](VALIDATION_CORPUS_V1.md). Predictions
  pre-registered for Pueblo, Amarillo, Bend, Pensacola, Norfolk. Blocked on
  owner ingest: Lubbock, Wilmington NC, St. Augustine, Galveston, Annapolis.
  Billings and Rapid City are genre-classification-only (already in the
  features corpus; propagation tests void).

## Admission pipeline position

`observed once → candidate → recurrence → provisional family →
out-of-sample validation → admitted ontology`

- **Admitted ontology: none.** `genre-ontology.ts` does not exist yet (open
  framework work).
- **Provisional families (2):**
  1. **Interior Regional Service Hub** — Casper, Odessa, Cheyenne, North
     Platte, Grand Junction. Class = isolated/semi-isolated city providing
     disproportionate services to a broad hinterland; per-city **anchor
     traits** (energy · boom-cycle energy/trade · state government · rail ·
     healthcare/public-land gateway) say which version.
  2. **Historic Coastal Port City** — Savannah, Mobile, Charleston. One
     latent type; members occupy positions on continuous axes (tourism
     intensity, institutional/medical depth, blue-collar orientation,
     historic-core walkability, outer car dependence, growth pressure, beach
     access, affordability, visitor/resident split). The **discovery
     gradient** (Charleston polished/discovered → Savannah being discovered →
     Mobile less discovered) is axis position, NOT sibling nanogenres.
- **Smaller candidates:** Casper+Odessa energy/extraction micro bundle (2 of
  3); Port-Logistics broad vocabulary (Savannah, Mobile — 2 of 5).

## Trait rulings (settled; reopenable per §12)

- **Wind exposure is a trait filter, not a genre**
  (`wind_exposed_hub_nonredundancy_ruling_2026`): hub genre + `wind_exposure`
  ≥ ~0.85. National scale: Casper 0.90 > Cheyenne 0.88 > North Platte 0.80 >
  Elko 0.55 > Victorville 0.52 > Grand Junction 0.32 (verified negative
  control).
- **The wage-housing squeeze is a trait, not a genre** — 8 of 10 discovery
  cities; Charleston is the price-side extreme (affordability 0.18), Mobile
  the wage-side extreme (moderate prices, lagging wages). Affordability level
  and pressure direction decouple (North Platte: cheapest AND
  fastest-appreciating).

## Divergence families (first-class; schema queued)

| Family | Cities | Note |
|---|---|---|
| Amenity/event existence vs everyday depth | ~7 | Most universal; mechanism hypothesis: programming is episodic, not ambient |
| Low commute vs car dependence | 6 + verified boundary | Charleston **inverts** it (first congested-corridor metro); chokepoint pattern scales Cajon Pass → Bayway → bridge corridors |
| Healthcare capacity vs navigability | 4 (NP, GJ, SAV, CHS) | Sharpest: Charleston 0.86 vs 0.35; Mobile = honest abstention |
| Singletons watched | — | negative-reputation-vs-lived (NP); welcoming-vs-insular (MOB); visitor/resident split (SAV); water amenity-vs-hazard (CHS) |

## Falsification record

Trend (falsified/returned, |diff| ≥ 0.30):
`11/31 → 7/27 → 7/35 → 5/37 → 3/34 → 5/39 → 7/38 → 2/27 → 4/33`
(Victorville → Gilbert → Odessa → Cheyenne → North Platte → Grand Junction →
Savannah → Mobile → Charleston). The 7/38 spike is diversification cost; the
2/27 that followed is its payoff (Savannah instantly became Mobile's top
borrow source, 0.836). **Never quote a single error rate** — performance by
domain:

| Prediction domain | Observed performance |
|---|---|
| Urban form (walkability, car dependence) | very strong |
| Navigability/friction | very strong (healthcare_navigability all-agree prediction confirmed 3 straight passes) |
| Everyday rhythm / social integration | strong |
| Economics/housing | strong (near-misses at the extremes) |
| Climate exposure | moderate; coastal-interior borrows biased (wind ×3, humidity converging 0.33→0.41→0.48 but still missed) |
| Institutional capacity | weak |
| Lumpy infrastructure (VA, trauma levels, tertiary depth) | very weak — **never borrowed** (architectural rule) |

## Pre-registered predictions in force (validation phase)

Humidity convergence continues (Pensacola/Wilmington expected under threshold
for the first time) · navigability ~0.36 holds · lumpy facts keep defeating
propagation by design · Bend = predicted NON-member of the interior family ·
Norfolk = predicted structural-member/cultural-non-member of the coastal
family · St. Augustine tests the visitor/resident split without a port ·
Bend + Annapolis predicted squeeze via amenity migration; Amarillo + Lubbock
predicted non-squeeze.

## Open framework work

1. `genre-ontology.ts` + `location_genre_assignments` migration (provisional
   families + trait filters). Board: Genre Assigned/Reviewed statuses are
   gated on this.
2. First-class divergence schema: {measured_dimension, experienced_dimension,
   divergence_direction, divergence_magnitude, confidence, mechanism}.
3. Per-domain falsification storage feeding borrow-aggressiveness tiers in
   the propagation engine.
4. Block 4 generator (PR #97, branch `city-profile-stack/dossier-prompt-block4`).
5. Periodic cross-city calibration of remaining intensity features
   (geographic_isolation, growth_pressure) — wind was the template.

## Known data-side follow-ups

- Grand Junction VAMC listed as `outpatient` in the app's VA sync data
  (va.gov says medical center) — fix task filed, not done inline.
- ROADMAP.md predates the batch-of-10 review; treat this file as current
  status.
