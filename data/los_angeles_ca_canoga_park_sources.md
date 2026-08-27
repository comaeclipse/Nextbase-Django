# Canoga Park, CA — Data Sources & Provenance

**Retrieval Date:** 2026-08-26
**Geography:** Canoga Park, a neighborhood of the City of Los Angeles, Los Angeles County, California
**Geo type:** `neighborhood` · **Parent:** `ca-los-angeles` (`municipal_containment`) · **Candidate:** No

---

## Read this first: Canoga Park is not a Census place

It was annexed by the City of Los Angeles in 1917 (as Owensmouth) and renamed in
1931, so it lies wholly inside an incorporated place. A CDP by definition only
exists *outside* incorporated places, so **there is no CDP GEOID and there cannot
be one.** There is no county-subdivision equivalent either.

`BoundaryGeoid` is therefore deliberately blank. It is **not** set to Los
Angeles' `0644000`, which would assert that Canoga Park and Los Angeles are the
same geography — the exact error this whole column exists to prevent.

What does exist, and what each thing actually is:

| Artifact | What it is | Usable as the neighborhood? |
|---|---|---|
| USGS GNIS Feature ID **240203** | A named point feature (the historic Owensmouth townsite) | As a point, yes. It is not a boundary. |
| **ZCTA 91303** | Census tabulation area from USPS ZIP delivery | No — ~2.1 sq mi of a ~4.35 sq mi neighborhood |
| **ZCTA 91304** | Same, but extends well into West Hills | No — materially over-broad |
| **LA Times "Mapping L.A."** boundary | A media-defined boundary, widely reused | Best available boundary; not official |
| Canoga Park Neighborhood Council | A City of LA administrative boundary | Official, but its demographic profile was unreachable — see Gaps |

---

## Field Provenance & Sources

### 1. Identity & Geography

- **`City` / `State` / `County`:** Canoga Park, CA, Los Angeles County. Within Los Angeles city limits. (USGS GNIS record; [Wikipedia](https://en.wikipedia.org/wiki/Canoga_Park,_Los_Angeles))
- **`Latitude` / `Longitude`:** `34.2011156, -118.5981424` — USGS GNIS Feature ID 240203, populated place, Los Angeles County. Retrieved via GNIS mirrors ([geo.mytopo.com](https://geo.mytopo.com/feature/california/los-angeles/populated-place/240203/canoga-park/)); the USGS GNIS query interface itself was unreachable.
  **Note:** this is a GNIS *name point*, not a population-weighted or area centroid. No official neighborhood centroid exists, because no official boundary exists. The Wikipedia infobox gives `34.20111, -118.59722`, ~80 m east — immaterial at the 25-mile VA radius.
- **`ParentSlug`:** `ca-los-angeles`. Recorded as `municipal_containment`.
- **`BoundarySource`:** LA Times Mapping L.A. neighborhood boundary (4.35 sq mi).
- **`BoundaryGeoid`:** *blank by design* — see above.

### 2. Population

- **`Population`:** `53,227`
- **`PopulationSource`:** 2000 Decennial Census, aggregated by the Los Angeles Times to the Mapping L.A. Canoga Park boundary
- **`PopulationVintage`:** `census_2000`

**Why this figure and not a more recent one.** There is no figure that is
simultaneously current, official, and boundary-correct. The candidates:

| Figure | Geography | Vintage | Verdict |
|---|---|---|---|
| **53,227** | Mapping L.A. boundary | 2000 Decennial Census | **Chosen.** Boundary-correct and census-derived; 26 years stale, which the `census_2000` vintage stamp makes visible. |
| 60,578 | Mapping L.A. boundary | **2008 City of Los Angeles estimate** | Rejected: an estimate of unstated method. |
| 29,805 (±1,785) | **ZCTA 91303 only** | ACS 2020–2024 5-yr | Rejected as the neighborhood figure: official and current, but describes ~half the neighborhood's area. |
| 52,474 (±2,091) | **ZCTA 91304** | ACS 2020–2024 5-yr | Rejected: includes West Hills. |
| 60,971 | Undocumented | Undocumented | Rejected: aggregator-only (Statistical Atlas and real-estate blogs), no stated boundary or vintage. |

**Correction worth recording:** 60,578 is *not* a 2000-census figure, though it is
widely repeated as one. 53,227 is the 2000 count; 60,578 is a 2008 city estimate
over the same boundary. Anyone pairing 60,578 with the commonly-quoted density of
~12,240/sq mi is mixing vintages, since that density is 53,227 ÷ 4.35.

- **`Density`:** `12,236` per sq mi. **Calculated:** 53,227 ÷ 4.35 sq mi. Both
  numerator and denominator are the Mapping L.A. boundary, so the vintages match.

### 3. Climate

- **`Climate`:** Mediterranean. Set **directly** rather than inherited from Los
  Angeles, because the inheritance would be subtly wrong: coastal/downtown LA is
  Köppen **Csb** (warm-summer) while inland valleys including the San Fernando
  Valley are **Csa** (hot-summer). At the descriptor granularity this column
  stores, both read "Mediterranean", but the Csa/Csb distinction is real and is
  recorded here so a future refinement does not silently lose it.
  ([Climate of Los Angeles](https://en.wikipedia.org/wiki/Climate_of_Los_Angeles))

### 4. Deliberately absent — resolved at read time

These are **not** blank for lack of effort. `lib/geo-inheritance.ts` resolves each
from the appropriate containing geography, and writing a value here would store a
placeholder indistinguishable from research:

| Field | Resolves from |
|---|---|
| `SalesTax` | the municipality (Los Angeles, 9.75%) |
| `CostOfLiving` / `col_index` / RPP | the metro (BEA publishes RPP per MSA) |
| `CrimeRating`, `TCI` | a wider reporting jurisdiction — rendered `context_only`, never bare |
| `2024 Election`, `CityPolitics` | the municipality — `context_only`, and see Gap G2 |
| `Gas` | the state |

### 5. Deliberately absent — no defensible neighborhood source

| Field | Why |
|---|---|
| `AvgHomeValue` | Zillow does publish a Canoga Park **neighborhood** ZHVI region (~$700,812 seen), but the page returned HTTP 403 and **no as-of month could be established**, and this repo requires a vintage. ACS ZCTA 91303 gives $683,000 (±$52,293, B25077, ACS 2020–2024) but that is a *median of owner-reported value* over the wrong boundary — not interchangeable with a ZHVI. Citywide LA ($921,200) must not be substituted. |
| `median_rent` | Same problem. ZCTA 91303 gives $2,057/mo (±$97, B25064); the neighborhood figure is unsourced. |

Both fields are policy `none` in the inheritance registry — they are never
inherited — so the city page will correctly report them absent rather than
showing Los Angeles' numbers.

### 6. VA access — recomputed, never written

`VA`, `NearestVA` and `DistanceToVA` are deliberately **omitted from the CSV**;
the importer now rejects them for a non-city geography. They are written by
`scripts/sync-va-facilities.ts` from this row's own coordinates. Inheriting Los
Angeles' 25-mile access gate would be a false claim about a city 470 sq mi wide.

### 7. Defense employer presence — observed, not asserted

The former Rocketdyne / Aerojet Rocketdyne complex on De Soto Avenue in Canoga
Park is a rocket- and missile-propulsion manufacturing site. L3Harris acquired
Aerojet Rocketdyne in 2023; in August 2026 AE Industrial Partners took 60% of a
re-separated standalone Rocketdyne, with L3Harris retaining 40% and the missile
businesses ([SpaceNews](https://spacenews.com/rocketdyne-reemerges-as-standalone-space-company/)).
No evidence of a site closure was found.

`defense_hub` is **derived**, not researched — `scripts/recompute-defense-hub.ts`
computes it, and presence rolls up, so Canoga Park's L3Harris postings promote
both Canoga Park and Los Angeles. No value is asserted here.

---

## Gaps and follow-ups

- **G1 — LA City Planning Neighborhood Council profile.** The strongest *official*
  neighborhood-level source exists and uses ACS 2024 5-year estimates:
  `https://planning.lacity.gov/odocument/e2be251a-a348-49fd-8df3-39d3f08bb275/standard_report2022_CANOGA_PARK_mail.pdf`.
  Both it and `planning.lacity.gov/resources/demographics` return HTTP 403 to
  automated retrieval. **Opening this by hand would likely resolve the population,
  boundary and housing questions definitively** and let `census_2000` be retired.
- **G2 — Precinct-level 2024 results.** Not retrieved. This matters: the West San
  Fernando Valley is materially less Democratic than the City of Los Angeles
  overall, so inheriting the city's ~70% Harris share down to Canoga Park would
  **overstate it**. The `context_only` presentation is the mitigation, not a fix.
  LA County RR/CC publishes precinct returns and is the correct source.
- **G3 — Canoga Park ZHVI as-of date.** See §5. Resolvable from the
  `Neighborhood_zhvi_*.csv` on [Zillow Research data](https://www.zillow.com/research/data/).
- **G4 — Authoritative land area.** 4.35 sq mi is a media boundary, not an official one.

## Note on `prepare-map-coordinates.ts`

That script matches live locations against a Census place Gazetteer snapshot, and
Canoga Park is not a Census place, so it has no row to match. This is **not** an
ingest blocker here: coordinates are supplied directly in the CSV (so
`resolveCoordinates` never consults the Gazetteer), and `/map` reads
`getAllLocations`, which returns candidates only — Canoga Park is
`is_candidate=false` and never reaches the map. Revisit if it is ever promoted.
