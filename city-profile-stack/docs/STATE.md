# Program state

**The one document to load for "where is the nanogenre program right now."**
Updated **in place** at the end of every pass and every governance decision;
git history is the changelog. Do not re-narrate this state inside dossier
notes or ledger entries — reference it.

*As of: 2026-08-25 (genre ontology/schema implementation; Validation Corpus v1
pass 1 of 12 complete: Pensacola).*

## Corpus status

- **Discovery Corpus v1 — FROZEN (10 cities):** Casper WY (prototype),
  Victorville CA, Gilbert AZ, Odessa TX, Cheyenne WY, North Platte NE, Grand
  Junction CO, Savannah GA, Mobile AL, Charleston SC. All imported to Neon,
  all §11 owner-reviewed. Discovery prevalence is exempt from admission caps
  (§12 decision 5).
- **Validation Corpus v1 — ACTIVE, 1 of 12 passes complete.** Two attack
  waves; see [VALIDATION_CORPUS_V1.md](VALIDATION_CORPUS_V1.md).
  **Pensacola (Wave B) — DONE, 2026-08-21: 1 of 39 falsified, the best score
  in program history on the sharpest pre-registered test (Mobile 0.892).**
  Predictions remain pre-registered for Pueblo, Amarillo, Bend, Norfolk.
  Blocked on owner ingest: Lubbock, Wilmington NC, St. Augustine, Galveston,
  Annapolis. Billings and Rapid City are genre-classification-only (already
  in the features corpus; propagation tests void).

## Admission pipeline position

`observed once → candidate → recurrence → provisional family →
out-of-sample validation → admitted ontology`

- **Admitted ontology: none.** `lib/genre-ontology.ts` now records the two
  provisional micro families and their trait boundaries; neither has completed
  out-of-sample validation, so neither is marked admitted.
- **Provisional families (2):**
  1. **Regional Service Hub** (formerly **Interior Regional Service Hub**) —
     Casper, Odessa, Cheyenne, North Platte, Grand Junction; Pensacola is the
     first validation member. Class = a relatively self-contained city providing
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
  3); Port-Logistics broad vocabulary (Savannah, Mobile — 2 of 5);
  "Resident Service City with a Resort Barrier-Island Edge" (Pensacola —
  resident city and resort island spatially distinct, unlike Savannah's
  in-core visitor split; test against Galveston, Wilmington, Corpus Christi).
- **Validation findings on family boundaries (Pensacola):** the Regional
  Service Hub class **crossed the coastline** — the researcher independently
  produced "Military-Anchored Gulf-Coast Regional Service Hub," supporting
  one hub class with position (interior/coastal) and anchor
  (energy/government/rail/medical/military) traits. And Pensacola is **not**
  a Historic Coastal Port City member (no working port) yet carries the
  walkable-core/car-dependent morphology and the wage squeeze — evidence
  those are coastal-Southern **trait pairs**, while the port family's
  distinctive content is the working-port economy plus heritage-tourism
  intensity.

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
| Healthcare capacity vs navigability | 5 (NP, GJ, SAV, CHS, PNS) | Sharpest: Charleston 0.86 vs 0.35; mildest: Pensacola 0.50 (mechanism hypothesis: three competing systems); Mobile = honest abstention |
| Singletons watched | — | negative-reputation-vs-lived (NP); welcoming-vs-insular (MOB); visitor/resident split (SAV); water amenity-vs-hazard (CHS) |

## Falsification record

Trend (falsified/returned, |diff| ≥ 0.30):
`11/31 → 7/27 → 7/35 → 5/37 → 3/34 → 5/39 → 7/38 → 2/27 → 4/33 → 1/39`
(Victorville → Gilbert → Odessa → Cheyenne → North Platte → Grand Junction →
Savannah → Mobile → Charleston → **Pensacola, the first validation pass**).
The 7/38 spike is diversification cost; the 2/27 and 1/39 that followed are
its payoff. **Never quote a single error rate** — performance by domain:

| Prediction domain | Observed performance |
|---|---|
| Urban form (walkability, car dependence) | very strong |
| Navigability/friction | very strong (healthcare_navigability all-agree prediction held 4 passes; the exact ~0.35 streak ended at Pensacola's 0.50 — competing-systems mechanism hypothesis) |
| Everyday rhythm / social integration | strong |
| Economics/housing | strong (near-misses at the extremes) |
| Climate exposure | moderate; coastal-interior borrows biased (wind ×3; humidity converging 0.33→0.41→0.48→0.51, error 0.60→0.54→0.47→0.41, still the only Pensacola miss) |
| Institutional capacity | weak |
| Lumpy infrastructure (VA, trauma levels, tertiary depth) | very weak — **never borrowed** (architectural rule). Pensacola nuance: inheritance worked (va_outpatient 0.93→0.94) only because the institution is *genuinely shared* with top-neighbor Mobile — same VA system, not analogy |

## Pre-registered predictions in force (validation phase)

Verdicts from pass 1 (Pensacola): **military-as-anchor-trait CONFIRMED**;
**humidity-under-threshold FAILED** (error converging, roughly two more
humid-coastal cities needed); navigability held under threshold but the exact
streak ended; the squeeze present as pre-registered; first-ever responsible
scores for racial_inclusion_climate (0.50, all-agree 0.44 confirmed) and
public_land_access (0.78 exact); tourism predicted within 0.04 after two
prior falsifications. Still in force: Bend = predicted NON-member of the
interior family · Norfolk = predicted structural-member/cultural-non-member
of the coastal family (also the navigability competing-systems test) ·
St. Augustine tests the visitor/resident split without a port · Wilmington
carries the next humidity-under-threshold attempt · Bend + Annapolis
predicted squeeze via amenity migration; Amarillo + Lubbock predicted
non-squeeze.

## Open framework work

1. First-class divergence schema: {measured_dimension, experienced_dimension,
   divergence_direction, divergence_magnitude, confidence, mechanism}.
2. Per-domain falsification storage feeding borrow-aggressiveness tiers in
   the propagation engine.
3. An evidence-backed assignment importer after assignment confidence and
   rationale are reviewed; do not infer rows from board labels alone.
4. Periodic cross-city calibration of remaining intensity features
   (geographic_isolation, growth_pressure) — wind was the template.

## Known data-side follow-ups

- Grand Junction VAMC listed as `outpatient` in the app's VA sync data
  (va.gov says medical center) — fix task filed, not done inline.
- ROADMAP.md predates the batch-of-10 review; treat this file as current
  status.
