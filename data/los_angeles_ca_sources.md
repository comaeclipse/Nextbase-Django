# Los Angeles, CA — Data Sources & Provenance

**Retrieval Date:** 2026-08-26
**Geography:** City of Los Angeles, Los Angeles County, California (Census place GEOID 0644000)
**Geo type:** `city` · **Candidate:** **No**

---

## Why this row exists

Los Angeles is **not** being added as a retirement candidate. It is a structural
parent: Canoga Park is a neighborhood inside it, and needs a municipality to
resolve municipal-scope facts from — sales tax above all.

`IsCandidate=No`, so it is excluded from `/explore`, `/quiz`, `/map`, `/profile`,
`/weather` and `/api/locations`, and gets no Fit Score. It is held to
`REQUIRED_PARENT_CITY_CSV_COLUMNS` rather than the curated city set, because
demanding a TCI and a crime grade for a row nobody ranks would be demanding
research nobody will read.

The fields below the identity minimum are supplied specifically because
`lib/geo-inheritance.ts` resolves them **down** to contained geographies.

---

## Field Provenance & Sources

### 1. Identity & Geography

- **`Latitude` / `Longitude`:** `34.0193936, -118.4108248` — Census **internal
  point** (`INTPTLAT`/`INTPTLON`) for place GEOID 0644000, from the
  [TIGERweb REST API](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/25/query?where=GEOID%3D%270644000%27&outFields=NAME,GEOID,CENTLAT,CENTLON,INTPTLAT,INTPTLON,AREALAND,AREAWATER&returnGeometry=false&f=json).

  **A verification failure worth recording:** an automated read of the Census 2020
  Gazetteer place file returned `34.052234 / -118.243685` for Los Angeles city.
  That is **wrong** — it is the downtown / City Hall coordinate, not the Census
  internal point. Do not use it, and do not label it "Census".
- **`BoundaryGeoid`:** `0644000` (Census TIGER/Line 2020 incorporated place).
- **`County`:** Los Angeles. The city lies wholly within Los Angeles County.

### 2. Population

- **`Population`:** `3,878,718` — ACS **2024 1-year**, via
  [Census Reporter](https://censusreporter.org/profiles/16000US0644000-los-angeles-ca/).
  `PopulationVintage` = `acs_2024_1yr`.
  The ACS 2020–2024 5-year figure is 3,857,263 (±151); the 1-year is preferred
  here as the more current for a place this size.
- **`Density`:** `8,244` per sq mi. **Calculated:** 3,878,718 ÷ 470.5 sq mi land
  area (`AREALAND` 1,218,689,235 m², Census 2020).

### 3. Municipal facts that resolve down to contained geographies

- **`SalesTax`:** `9.75` — combined state/county/district rate for the City of
  Los Angeles, from the
  [CDTFA California City & County Sales & Use Tax Rates](https://www.cdtfa.ca.gov/taxes-and-fees/rates.aspx),
  rate table effective **2026-07-01**. This is the single most important value on
  this row: it is what Canoga Park inherits over `municipal_containment`.
- **`Climate`:** Mediterranean. Coastal/downtown LA is Köppen **Csb**; inland
  valleys including the San Fernando Valley are **Csa**. Canoga Park sets its own
  climate directly rather than inheriting, so the valley distinction is not lost.
  ([Climate of Los Angeles](https://en.wikipedia.org/wiki/Climate_of_Los_Angeles))
- **`Gas`:** `$5.457`/gal regular, Los Angeles city retail average, week ending
  **2026-08-24**, from the
  [EIA Weekly Retail Gasoline Prices](https://www.eia.gov/dnav/pet/pet_pri_gnd_a_epmr_pte_dpgal_w.htm)
  (California statewide the same week: $5.450). AAA gave $5.694 for the
  Los Angeles–Long Beach *metro* on 2026-08-26; the EIA city series is preferred
  as it matches this row's geography.

### 4. Elections — carried, but `context_only` by design

- **`2024 Election`:** Democratic. **`2024PresidentPercent`:** `70`.
  City of Los Angeles: Harris ≈977,000 votes, ≈70.1% of ≈1,393,097 presidential
  ballots; Trump ≈370,000 (≈26.5%). Source:
  [Crosstown LA](https://xtown.la/2024/12/16/a-city-country-divide-more-than-70-percent-of-los-angeles-voters-picked-kamala-harris-for-president/),
  analyzing LA County RR/CC data, reported 2024-12-16.
  **Confidence: medium** — this is an analysis of official data, not the official
  return itself. The certified *county* figure is Harris 64.83% / Trump 31.91%
  ([LA County RR/CC](https://results.lavote.gov/text-results/4324), certified
  2024-12-02); it is not used here because it describes the county, not the city.

  These fields are `presentation: "context_only"` in the inheritance registry, so
  a contained geography renders them only with a source label. That matters: the
  West San Fernando Valley is materially less Democratic than the city overall, so
  the label is doing real work rather than decorating.

### 5. Deliberately absent

- **`LGBTQ_MEI`:** **not supplied.** Los Angeles appears in HRC's California
  scorecard listing for 2024, 2023, 2022 and 2021 but **not 2025**, so the most
  recent scorecard is MEI 2024 at
  `https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-24-Scorecards/2024-MEI-Los-Angeles-California.pdf`.
  That PDF downloaded but could not be text-extracted, and HRC's HTML pages do not
  display numeric scores. A search summarizer asserted "Los Angeles received 100 on
  MEI 2025", but that is **unattributable to any openable source and LA is not in
  HRC's 2025 California listing at all**, so no value is recorded.
  Consequence: Canoga Park's MEI resolves to `absent`, which is correct — better a
  visible hole than a plausible invention.
- **`CrimeRating`, `TCI`, `AvgHomeValue`, `median_rent`, `HasWalmart`, `HasCostco`,
  `VA`/`NearestVA`/`DistanceToVA`, `TechHub`, `DefenseHub`:** not researched. This
  row is not ranked, so these are not required. VA fields in particular are written
  by `scripts/sync-va-facilities.ts` from coordinates, never by hand.

---

## Follow-up

- Resolve the HRC MEI 2024 score by opening the scorecard PDF, then set
  `lgbtq_mei_score` on this row — Canoga Park picks it up by inheritance with no
  further work, since HRC scores per municipality.
