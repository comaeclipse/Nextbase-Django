# Goleta, CA Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), at the user's request, replacing an earlier unsigned/unsourced scratch pass (root-level `goleta.csv`, `add-signal.js`, `update-desc.js`) that had already partially landed in `city-profile-stack/data/location-profile-signals.json` and `data/location-map-coordinates.json` without a paper trail.

---

## Geography and source choices

- Primary geography: incorporated City of Goleta, Santa Barbara County, California.
- The VA clinic serving Goleta (4440 Calle Real) carries a Santa Barbara address and is not inside Goleta's incorporated limits, so `VA` is stored as `No` with `NearestVA` pointing to it. `DistanceToVA` is left blank for `sync-va-facilities.ts` to compute by great-circle distance rather than a manual estimate.
- `DefenseHub` is set to `Y` (`defense_hub_manual = true`) on the strength of RTX's active electronic-warfare engineering/manufacturing site physically located in Goleta (see Defense section). This is a genuine physical facility, not a remote-worker job posting.
- `TCI` is left blank. Crime-index sources disagree on methodology and scale (CrimeGrade neighborhood letter grades vs. BestPlaces per-1,000 rates vs. NeighborhoodScout percentile rank); per this repo's existing rule ("do not mix proprietary crime index values"), no single numeric TCI is asserted. `CrimeRating = Low` is a qualitative judgment supported by convergent evidence across all three sources (violent crime well below national average, most neighborhoods A-range).
- `CostOfLiving`, `LGBTQ`, `LGBTQ_MEI`, `SunnyDays`, `HumiditySummer` are blank — no cost-of-living index, no HRC Municipal Equality Index rating (Goleta is not HRC-rated), and no NOAA-sourced sun/humidity figures were found. These are gaps, not zeros.

## Imported values and method

### Population and density
- 2020 Decennial Census population: 32,773 (city has since declined slightly per intercensal estimates).
- Density: ~4,093 people per sq mi, derived from the 2020 population and Goleta's land area.
- Source: U.S. Census Bureau via World Population Review's Goleta profile (aggregates Census QuickFacts figures).

### Housing
- `AvgHomeValue`: $1,365,841 — Zillow ZHVI (typical home value, mid-tier SFR+condo), data through 2026-06-30, down 0.9% YoY.

### Taxes
- `SalesTax`: 8.75% combined (6% CA state + 0.25% Santa Barbara County + 1% Goleta city + 1.5% special district).
- `Income`: 13.3 — California's top marginal state income-tax rate (statewide figure, same as used for other CA cities in this dataset, e.g. Irvine).

### Veterans benefits
- California partially excludes qualifying military retirement/SBP income (up to $20,000, subject to federal AGI limits, tax years 2025–2029) and offers a disabled-veteran property-tax exemption plus CalVet programs. Same statewide policy text used for Irvine, reused here because it is a state-level (not city-level) benefit.

### VA access
- Santa Barbara VA Clinic (VA Greater Los Angeles Healthcare System CBOC), 4440 Calle Real, Santa Barbara, CA 93110. Addressed to Santa Barbara, not Goleta; `VA = No`.

### Crime
- CrimeGrade.org: overall city grade B-, but 3 of 4 named neighborhoods (Goleta North, Gaviota Coast, Goleta South) grade in the A range.
- Comparative per-capita figures (BestPlaces-style): violent crime 13.4 vs. national 22.7; property crime 23.8 vs. national 35.4 — both meaningfully below the national baseline.
- `TCI` left blank (see rationale above); `CrimeRating = Low`.

### Defense / tech economy
- RTX (Raytheon) operates an active electronic-warfare engineering and manufacturing facility in Goleta, across from Santa Barbara Airport's control tower, employing several hundred people. Confirmed via a 2026 $80M U.S. Navy ADVEW (Advanced Electronic Warfare) prototyping contract explicitly sited at Goleta, plus multiple current RTX Goleta job postings (Senior/Principal Systems Engineer — Electronic Warfare).
- `DefenseHub = Y`; `TechHub = Y` given the RTX cluster plus UC Santa Barbara's engineering/research base.

### Climate
- NOAA 1991–2020 Normals, Santa Barbara Municipal Airport (USW00023190): annual precipitation 17.25 in (stored as 17), January mean minimum 41.3°F (stored as 41), July mean maximum 73.3°F (stored as 73). No measurable annual snowfall normal is reported for this station (`Snow = 0`).
- `SunnyDays` and `HumiditySummer` are blank: NOAA's monthly/annual normals product for this station does not carry sun-percent or humidity elements (same known limitation documented for other cities in this dataset — see `lib/climate.ts` comments).
- `Climate`: Mediterranean.

### Cannabis
- California permits adult-use recreational cannabis (21+) statewide. `Marijuana = Recreational`.

### LGBTQ
- No HRC Municipal Equality Index rating exists for Goleta (city too small to be MEI-rated); `LGBTQ` and `LGBTQ_MEI` left blank.
- `LGBTQStatePolicyScore = 45`: California's MAP state policy tally, reused from the same figure already sourced for Irvine (a statewide score, not city-specific).

### Politics and elections
- County-level returns used throughout; `CityPolitics` explicitly qualified as `County-level: Liberal`.
- 2016 Santa Barbara County (certified CA SOS Statement of Vote): Clinton 107,142, Trump 56,365, plus 3,719 (Stein), 6,748 (Johnson), 693 (La Riva) — total 174,667. Raw Clinton share 61.3% (stored as 61). Two-party Trump share 34.47%.
- 2024 Santa Barbara County: reported by the Santa Barbara Independent as Harris 64%, Trump 33% (raw shares; the county has not published a machine-readable certified vote-total table I could independently re-derive at time of writing). Two-party Trump share computed from these rounded figures ≈ 34.0%.
- `rep_vote_share_change_pp ≈ -0.45`, `dem_vote_share_change_pp ≈ +0.45`, `ElectionChange = "0.5 pp more Democratic since 2016"`. **Caveat:** because the 2024 input is rounded (not exact certified vote counts), this change figure is an approximation and should be replaced with exact SBC Clerk-Recorder totals if greater precision is needed later.

## Source URLs

- Census population via World Population Review: https://worldpopulationreview.com/us-cities/california/goleta
- Zillow Goleta ZHVI: https://www.zillow.com/home-values/97136/goleta-ca-93118/
- Goleta sales tax rate (Avalara): https://www.avalara.com/us/en/taxrates/state-rates/california/cities/goleta.html
- Santa Barbara VA Clinic (VA Greater Los Angeles Healthcare System): https://www.losangeles.va.gov/locations/directions-SB.asp
- CrimeGrade Goleta: https://crimegrade.org/safest-places-in-goleta-ca/
- BestPlaces Goleta crime: https://www.bestplaces.net/crime/city/california/goleta
- RTX Goleta careers/location page: https://careers.rtx.com/global/en/raytheon-goleta-ca-location
- RTX $80M Navy ADVEW award (Goleta-sited): https://www.designdevelopmenttoday.com/industries/military/news/22882227/rtx-awarded-80m-to-prototype-advanced-electronic-warfare-for-the-super-hornet
- NOAA NCEI monthly normals, USW00023190: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00023190&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USW00023190: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00023190&format=json&units=standard&includeAttributes=false
- MAP California Equality Profile: https://mapresearch.org/equality-profiles/ca/
- California cannabis law (DCC): https://cannabis.ca.gov/
- Santa Barbara Independent, 2024 general election results: https://www.independent.com/2024/11/05/santa-barbara-votes-2024-general-election-results/
- 2016 CA Statement of Vote (Santa Barbara County presidential results): https://elections.cdn.sos.ca.gov/sov/2016-general/sov/17-presidential-formatted.pdf
- AAA California gas price average, Aug 2026: https://contracosta.news/2026/08/07/lower-crude-oil-prices-driving-down-california-average/
