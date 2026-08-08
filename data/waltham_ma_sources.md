# Waltham, MA Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), replacing an earlier unsigned/unsourced scratch pass (root-level `waltham.json`/`waltham.csv`) that never made it into a tracked archive.

---

## Geography and source choices

- Primary geography: City of Waltham, Middlesex County, Massachusetts.
- Election fields use **city-level** results from `electionstats.state.ma.us`.
- `DefenseHub = Y`: RTX (Raytheon Technologies) retained a significant corporate office in Waltham (870 Winter Street) after relocating its global headquarters to Arlington, VA; multiple sources confirm the Massachusetts workforce was not reduced by the move. BAE Systems' presence in Waltham specifically (as opposed to nearby Burlington/Boston offices) could not be independently confirmed and was **not** used to support this judgment.
- `TechHub = Y`: Waltham sits on the Route 128 tech/biotech corridor (historically nicknamed "America's Technology Highway" / "Silicon Valley of the East") and hosts Bentley University and Brandeis University.
- `TCI` left blank (proprietary crime-index methodology conflict); `CrimeRating = Moderate` reflects genuinely wide neighborhood-level variance (violent crime figures ranging from 10.5 to 30.6 per 1,000 depending on source/ZIP), not a single confident label.
- `CostOfLiving`, `LGBTQ` (municipal HRC MEI), `LGBTQ_MEI`, `SunnyDays`, `HumiditySummer` are blank — no reliable source found; documented gaps, not zeros.

## Imported values and method

### Population and density
- 2020 Decennial Census: 65,218. Density ≈ 5,118/sq mi.
- Source: BiggestUSCities.com, citing Census Bureau.

### Housing
- `AvgHomeValue`: $841,319 — Zillow ZHVI, up 1.0% YoY, data through 2026-06-30.

### Taxes
- `SalesTax`: 6.25% (Massachusetts flat statewide rate).
- `Income`: 9.0 — Massachusetts effective top marginal rate (5% flat + 4% "Fair Share" surtax), same statewide figure used for other MA cities in this dataset.

### Veterans benefits
- Massachusetts fully excludes U.S. military retirement pay from state gross income; local property-tax exemptions exist for qualifying disabled veterans.

### VA access
- No VA facility is located inside Waltham. `VA = No`; nearest is the Framingham VA Clinic, 61 Lincoln Street, Framingham, MA (part of VA Boston Healthcare System). `DistanceToVA` left blank for the VA-sync script.

### Crime
- Reported violent crime rates for Waltham range from 10.5 (one citywide figure) to 19.4–30.6 per 1,000 depending on ZIP code (02451/02452/02453), with property crime similarly split above and below the national average by neighborhood.
- `TCI` blank; `CrimeRating = Moderate` (reflects genuine within-city variance, not a single confident rating).

### Defense / tech economy
- RTX (Raytheon Technologies) corporate office, 870 Winter Street, Waltham — retained after the 2026 global-HQ move to Arlington, VA, with Massachusetts headcount explicitly preserved per company statements.
- Route 128 tech/biotech corridor; Bentley University and Brandeis University are both headquartered in Waltham.
- `DefenseHub = Y`; `TechHub = Y`.

### Climate
- NOAA 1991–2020 Normals, Boston Logan International Airport (GHCND:USW00014739) reused as the standard Greater Boston reference station (same station used for Quincy in this dataset; Waltham is roughly equidistant between Logan and Hanscom Field): January mean minimum 23.1°F (stored as 23), July mean maximum 82.1°F (stored as 82), annual snowfall 49.20 in (stored as 49), annual precipitation 43.59 in (stored as 44).
- `Climate`: Humid Continental.

### Cannabis
- Massachusetts permits adult-use recreational cannabis (21+) statewide. `Marijuana = Recreational`.

### LGBTQ
- No independently verified HRC Municipal Equality Index score for Waltham was retrieved this pass; `LGBTQ` and `LGBTQ_MEI` left blank.
- `LGBTQStatePolicyScore = 40`: MAP's 2026 Massachusetts overall policy tally (40/49, "High"), same statewide figure used for Lexington and Quincy.

### Politics and elections
- City-level results via `electionstats.state.ma.us`.
- 2016: Clinton/Kaine 17,355 (64.9%), Trump/Pence 7,592 (28.4%), 26,729 total votes. Two-party Trump share 30.42%.
- 2024: Harris/Walz 18,048, Trump/Vance 7,824, 26,955 total votes (466 blank ballots). Raw Harris ≈67%, Trump ≈29%. Two-party Trump share 30.24%.
- `rep_vote_share_change_pp = -0.18`, `dem_vote_share_change_pp = +0.18`, `ElectionChange = "0.2 pp more Democratic since 2016"`.

## Source URLs

- Waltham, MA population/density (BiggestUSCities, citing Census): https://www.biggestuscities.com/city/waltham-massachusetts
- Zillow Waltham ZHVI: https://www.zillow.com/home-values/34644/waltham-ma/
- BestPlaces/CrimeGrade Waltham crime: https://www.bestplaces.net/crime/city/massachusetts/waltham ; https://crimegrade.org/safest-places-in-waltham-ma/
- Framingham VA Clinic (VA Boston Health Care): https://marketplace.va.gov/facilities/framingham
- RTX Waltham office retained after HQ move to Arlington, VA: https://www.boston25news.com/news/local/massachusetts-based-raytheon-moving-global-headquarters-virginia/BKQYCTWFF5H23F4S473IZDTEQY/ ; https://bostonrealestatetimes.com/waltham-ma-based-raytheon-technologies-establishes-global-headquarters-office-in-northern-virginia/
- NOAA NCEI monthly normals, USW00014739 (Boston Logan): https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00014739&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USW00014739: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00014739&format=json&units=standard&includeAttributes=false
- MAP Massachusetts Equality Profile: https://mapresearch.org/equality-profiles/ma/
- 2016 Waltham city results (MA electionstats): https://electionstats.state.ma.us/elections/view/130243/filter_by_county:Middlesex
- 2024 Waltham city results (MA electionstats): https://electionstats.state.ma.us/elections/view/165300/filter_by_county:Middlesex
- AAA Massachusetts gas price average, Aug 8 2026: https://gasprices.aaa.com/?state=MA
