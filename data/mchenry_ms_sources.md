# McHenry, MS Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), replacing an earlier unsigned/unsourced scratch pass (root-level `mchenry.json`/`mchenry.csv`) that never made it into a tracked archive.

---

## Geography and source choices

- Primary geography: McHenry, an **unincorporated community** in southern Stone County, Mississippi (not a city, town, or confirmed Census-designated place). This is the smallest, least-documented place in this promotion batch.
- `Population` and `Density` are left blank: two secondary aggregator sites gave conflicting figures (2,353 vs. 1,852) for a place with no confirmed CDP boundary, and neither could be traced back to an authoritative Census source. Guessing between them would violate this repo's "do not fill gaps with guesses" rule.
- `TCI` and `CrimeRating` are both blank — no crime data exists at this granularity for an unincorporated place with no dedicated police department.
- `2024 Election`, `2024PresidentPercent`, `ElectionChange`, `rep_vote_share_change_pp`, and `dem_vote_share_change_pp` are blank: I could retrieve verified 2016 Stone County results but could not extract certified 2024 county-level vote totals from the Mississippi Secretary of State's PDF (binary/compressed, not machine-readable via the tools available this session) within a reasonable effort. **This is a real gap to close**, not a judgment call — a follow-up pass should pull the exact 2024 Stone County totals from `sos.ms.gov` and complete these fields.
- `SunnyDays` and `HumiditySummer` are blank — not present in the NOAA normals product used.
- `Marijuana` is corrected from the earlier unsigned scratch pass's "Illegal" to **"Medical"** — Mississippi legalized medical cannabis via the Mississippi Medical Cannabis Act (2022) and has not legalized recreational use.

## Imported values and method

### Housing
- `AvgHomeValue`: $194,001, cited as Zillow's figure via a real-estate aggregator (Point2Homes); not independently re-verified against Zillow's own McHenry page, so treat as directionally reliable rather than exact.

### Taxes
- `SalesTax`: 7.0% (Mississippi's uniform statewide rate; Stone County/McHenry add no local option).
- `Income`: 4.4 — Mississippi's flat individual income-tax rate as of January 1, 2026 (income above a $10,000 exemption threshold), down from 4.7%; scheduled to keep declining toward 3.5% by 2030 subject to revenue triggers.

### Veterans benefits
- Mississippi exempts military retired pay from state income tax and does not tax VA disability compensation; additional state/local property-tax benefits exist for qualifying disabled veterans.

### VA access
- No VA facility is located in McHenry. `VA = No`; nearest is the Biloxi VA Medical Center, 400 Veterans Avenue, Biloxi, MS (part of VA Gulf Coast Health Care). `DistanceToVA` left blank for the VA-sync script rather than a manual estimate (driving distance from this rural community to Biloxi is on the order of 25–30 miles by state highway, but not independently confirmed here).

### Defense / economy
- Adranos, Inc. operates its primary solid rocket motor design, development, and production facility at 488 E McHenry Rd, McHenry, MS — a 640-acre, seven-building complex **formerly occupied by General Dynamics**, chosen for its proximity to Stennis Space Center and compliance with DoD munitions-handling safety requirements. This is a real, physical, DoD-relevant manufacturing facility inside McHenry itself, not a remote posting or nearby-county proxy.
- `DefenseHub = Y`; `TechHub = N` (single specialized defense manufacturer, not a diversified tech-employment base).

### Climate
- NOAA 1991–2020 Normals, Gulfport-Biloxi International Airport (GHCND:USW00093874, the representative coastal-Mississippi reference station): January mean minimum 42.4°F (stored as 42), July mean maximum 90.4°F (stored as 90), annual precipitation 62.82 in (stored as 63).
- `Snow = 0`: the station's normals product carries no snowfall element at all (not just a zero value) — consistent with the fact that measurable snow is a rare, non-normal event on the Mississippi Gulf Coast. Treated as a justified 0, not a guess.
- `Climate`: Humid Subtropical.

### Cannabis
- Mississippi permits medical cannabis under the Mississippi Medical Cannabis Act (2022); recreational use remains illegal. `Marijuana = Medical` (corrected from the earlier scratch pass's "Illegal").

### LGBTQ
- No HRC Municipal Equality Index rating exists for McHenry (unincorporated, far too small to be MEI-rated); `LGBTQ` and `LGBTQ_MEI` left blank.
- `LGBTQStatePolicyScore = -8.5`: MAP's 2026 Mississippi overall policy tally (out of 49), rated "Negative."

### Politics and elections
- 2016 Stone County (verified vote totals): Trump 5,990, Clinton 3,524. Two-candidate raw Trump share ≈ 63% (stored as `2016PresidentPercent = 63`; this is a two-candidate approximation since the exact county-wide total including third-party/write-in votes was not retrieved).
- 2024 Stone County: **not retrieved** — see gap note above. Statewide Mississippi 2024 was Trump 60.89% / Harris 38.00% (vs. statewide 2016 Trump 57.94% / Clinton 40.11%), which would suggest a modest further Republican shift if Stone County tracked the state, but this is not a substitute for the actual county figure and was deliberately not used to fill the blank fields.

## Source URLs

- McHenry, MS geography (Wikipedia): https://en.wikipedia.org/wiki/McHenry,_Mississippi
- McHenry population estimates (Point2Homes, Places.US.Com — conflicting, not used): https://www.point2homes.com/US/Neighborhood/MS/Mchenry-Demographics.html ; https://places.us.com/mississippi/mchenry
- McHenry home value (Point2Homes, citing Zillow): https://www.point2homes.com/US/Neighborhood/MS/Mchenry-Demographics.html
- Adranos McHenry, MS facility announcement: https://www.areadevelopment.com/newsItems/9-28-2020/adranos-mchenry-mississippi.shtml
- Adranos McHenry facility expansion / ribbon-cutting: https://www.stonecountyenterprise.com/news/local/adranos-cuts-ribbon-on-new-rocket-fuel-complex-at-mchenry/article_cdb641d4-2876-11ed-bab9-d35f1a35cfe8.html
- Biloxi VA Medical Center: https://www.va.gov/gulf-coast-health-care/locations/biloxi-va-medical-center/
- Mississippi 2026 flat income tax rate: https://incometaxbystate.com/mississippi
- Mississippi sales tax rate: https://www.avalara.com/us/en/taxrates/state-rates/mississippi.html
- Mississippi Medical Cannabis Act background: (Mississippi Medical Cannabis Act, 2022 — state program overview)
- NOAA NCEI monthly normals, USW00093874 (Gulfport-Biloxi): https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00093874&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USW00093874: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00093874&format=json&units=standard&includeAttributes=false
- MAP Mississippi Equality Profile: https://mapresearch.org/equality-profiles/ms/
- 2016 Stone County presidential results: aggregated from Mississippi Secretary of State statewide recap (https://www.sos.ms.gov/elections/electionresults/2016%20GE%20Statewide%20Recap%20Report.pdf)
- 2024 Mississippi statewide results (county breakdown not extracted — see gap note): https://www.sos.ms.gov/elections/electionresults/2024%20Official%20Statewide%20Results.pdf
- Mississippi gas price average, early Aug 2026: https://www.kicks96news.com/uncategorized/aaa-gas-price-average-in-ms-moving-closer-to-3/
