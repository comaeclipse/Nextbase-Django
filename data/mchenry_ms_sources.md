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

**Correction (2026-08-09):** the original `2016PresidentPercent = 63` value above could not be reconciled with certified Stone County presidential returns and has been **replaced**. Stone County's official 2016 two-party result was Trump 5,990 / Clinton unclear from the original note's own math (5,990 vs. the certified two-party share below don't reconcile at 63%) — recomputed from the same-methodology two-party share used everywhere else in this dataset, Stone County's 2016 two-party result was Trump 77.13%, now stored as `election_2016_percent = 77`. The prior 63% is presumed to have been a raw share of all votes cast (including third-party/write-in) rather than strict two-party share, or a transcription error; it is not recoverable which, and is superseded rather than reconciled.

2024 Stone County total was independently confirmed by directly reading the Stone County official recapitulation PDF page-by-page (it doesn't extract as text — image-based scan — but is readable): Harris 1,620 / Trump 6,214 (D 20.68% / R 79.32% two-party) countywide.

**Superseded by precinct-level figure (2026-08-09):** the countywide number above was initially used as the stored value, then replaced with a **combined McHenry-precinct** figure once 2016 precinct-level data was located. Stone County has two McHenry-named precincts in both years, and the mapping between them across the two elections is not fully certain:

- 2016 (Mississippi SoS via OpenElections precinct dataset, `20161108__ms__general__precinct.csv`): McHenry Library (Clinton 25 / Trump 333) + McHenry Fire Station (Clinton 91 / Trump 415) = combined Clinton 116 / Trump 748 (D 13.43% / R 86.57% two-party).
- 2024 (Stone County official recapitulation PDF, same source as above): McHenry Library (Harris 28 / Trump 374) + McHenry Community Center (Harris 178 / Trump 599) = combined Harris 206 / Trump 973 (D 17.47% / R 82.53% two-party).
- "McHenry Library" kept its exact name across both years (suggesting boundary continuity); "McHenry Fire Station" doesn't appear in the 2024 precinct list at all, replaced by "McHenry Community Center" — plausibly the same polling place renamed (small rural counties frequently convert/rename polling locations), but this is **not independently confirmed** against a precinct-boundary map. The combined-precinct approach was chosen specifically to avoid betting on that unverified 1:1 name correspondence: it captures everyone voting at a McHenry-area polling place in both years, rather than asserting a specific single-precinct match.
- Combined result: `election_2016_percent = 87` (Trump, two-party), `election_2024_percent = 83` (Trump, two-party), `rep_vote_share_change_pp = -4.05`, `dem_vote_share_change_pp = +4.05`, `election_change = "4.0 pp more Democratic since 2016"`. This **overwrites** the previously-stored countywide-derived values (77 / 79 / +2.19 / -2.19 / "2.2 pp more Republican") — note the combined-precinct trend actually points the **opposite direction** from the countywide trend (Democratic-trending at the McHenry precincts specifically vs. Republican-trending countywide), which is a real, sourced finding, not an error — small-precinct vote-share swings on a low raw-vote base can and do diverge from the county as a whole.
- For reference, "McHenry Library" alone (excluding Fire Station/Community Center entirely) would show an essentially flat trend (93.02% R in 2016 vs. 93.03% R in 2024) — all three interpretations (countywide, McHenry Library only, both McHenry precincts combined) were computed and disclosed; combined-precincts was the deliberate choice, not the only defensible one.

Sources: Mississippi Secretary of State, Stone County Official 2024 Recapitulation, https://sos.ms.gov/elections/electionresults/2024General/County%20Results/Stone.pdf ; OpenElections Mississippi 2016 precinct-level results, https://raw.githubusercontent.com/openelections/openelections-data-ms/master/2016/20161108__ms__general__precinct.csv

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
