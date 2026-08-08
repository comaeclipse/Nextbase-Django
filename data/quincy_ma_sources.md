# Quincy, MA Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), replacing an earlier unsigned/unsourced scratch pass (root-level `quincy.json`/`quincy.csv`) that never made it into a tracked archive.

---

## Geography and source choices

- Primary geography: City of Quincy, Norfolk County, Massachusetts (Norfolk County's largest city).
- Election fields use **city-level** results from `electionstats.state.ma.us`, not a county proxy.
- `DefenseHub = Y`: General Dynamics Mission Systems operates an active Quincy office/facility (Bluefin Robotics autonomous underwater vehicles) on the site of the former Fore River Shipyard — a current, physical defense-industry presence, not historical-only. The shipyard itself closed in 1986; this is not counted toward the judgment, only the present-day GD Mission Systems operation is.
- `TechHub = N`: the GD Mission Systems presence is captured by `DefenseHub`; no separate diversified tech-employment base was independently confirmed.
- `TCI` left blank (proprietary crime-index methodology conflict, consistent with this dataset's convention); `CrimeRating = Moderate` reflects BestPlaces figures running somewhat above the national baseline on both violent and property crime.
- `CostOfLiving`, `LGBTQ` (municipal HRC MEI), `LGBTQ_MEI`, and `SunnyDays`/`HumiditySummer` are blank — no reliable source found; documented gaps, not zeros.

## Imported values and method

### Population and density
- 2020 Decennial Census: 101,606 (Quincy is Norfolk County's largest city; county total 725,981).
- Density ≈ 5,568/sq mi.
- Source: BiggestUSCities.com and HomeTownLocator, both citing Census Bureau figures.

### Housing
- `AvgHomeValue`: $621,968 — Zillow ZHVI (citywide), up 1.2% YoY.

### Taxes
- `SalesTax`: 6.25% (Massachusetts flat statewide rate).
- `Income`: 9.0 — Massachusetts effective top marginal rate (5% flat + 4% "Fair Share" surtax), same statewide figure used for other MA cities in this dataset.

### Veterans benefits
- Massachusetts fully excludes U.S. military retirement pay from state gross income; local property-tax exemptions exist for qualifying disabled veterans/service members.

### VA access
- Quincy VA Clinic, 110 West Squantum Street, Quincy, MA 02169 — centrally located inside city limits, serves South Shore/Norfolk County veterans (primary care only; no urgent care, mental health, or pharmacy on-site). Parent facility: VA Boston HCS (Jamaica Plain). `VA = Yes`, `DistanceToVA = 0 miles`.

### Crime
- BestPlaces: violent crime rate 25.9 per 1,000 vs. national 22.7 (citywide estimate; individual ZIPs range 28.8–37); property crime 41.9 vs. national 35.4 in the highest ZIP, closer to parity (33–34.4) in others. BestPlaces notes Quincy lacks direct FBI crime-statistics reporting, so these are modeled/alternative-source figures.
- `TCI` blank; `CrimeRating = Moderate`.

### Defense / economy
- General Dynamics Mission Systems' Quincy office designs/tests unmanned underwater vehicles (Bluefin Robotics product line) on the former Fore River Shipyard site; active job postings confirmed as of 2026. `DefenseHub = Y`.

### Climate
- NOAA 1991–2020 Normals, Boston Logan International Airport (GHCND:USW00014739, the standard reference station for the Greater Boston/South Shore area): January mean minimum 23.1°F (stored as 23), July mean maximum 82.1°F (stored as 82), annual snowfall 49.20 in (stored as 49), annual precipitation 43.59 in (stored as 44).
- `Climate`: Humid Continental.

### Cannabis
- Massachusetts permits adult-use recreational cannabis (21+) statewide. `Marijuana = Recreational`.

### LGBTQ
- No independently verified HRC Municipal Equality Index score for Quincy was retrieved this pass; `LGBTQ` and `LGBTQ_MEI` left blank.
- `LGBTQStatePolicyScore = 40`: MAP's 2026 Massachusetts overall policy tally (40/49, "High"), same statewide figure used for Lexington.

### Politics and elections
- City-level results via `electionstats.state.ma.us`.
- 2016: Clinton/Kaine 25,477 (60.4%), Trump/Pence 13,321 (31.6%), 42,192 total votes (1,371 blank ballots). Two-party Trump share 34.34%.
- 2024: Harris/Walz 25,651 (60.2%), Trump/Vance 15,210 (35.7%), 42,625 total votes. Two-party Trump share 37.22%.
- `rep_vote_share_change_pp = 2.88`, `dem_vote_share_change_pp = -2.88`, `ElectionChange = "2.9 pp more Republican since 2016"` — a notably larger rightward shift than Lexington's, consistent with Quincy's more working- and middle-class, ethnically diverse population (it has one of the largest Asian-American populations of any Massachusetts city), which nationally trended more Republican in 2024 than college-educated inner suburbs.

## Source URLs

- Quincy, MA population/density (BiggestUSCities, HomeTownLocator, citing Census): https://www.biggestuscities.com/city/quincy-massachusetts ; https://massachusetts.hometownlocator.com/ma/norfolk/quincy.cfm
- Zillow Quincy ZHVI: https://www.zillow.com/home-values/6665/quincy-ma/
- BestPlaces Quincy crime: https://www.bestplaces.net/crime/city/massachusetts/quincy
- Quincy VA Clinic (VA Boston Health Care): https://www.va.gov/boston-health-care/locations/quincy-va-clinic/
- General Dynamics Mission Systems, Quincy office: https://gdmissionsystems.com/about-us/major-locations/quincy
- Fore River Shipyard background: https://en.wikipedia.org/wiki/Fore_River_Shipyard
- NOAA NCEI monthly normals, USW00014739 (Boston Logan): https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00014739&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USW00014739: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00014739&format=json&units=standard&includeAttributes=false
- MAP Massachusetts Equality Profile: https://mapresearch.org/equality-profiles/ma/
- 2016 Quincy city results (MA electionstats): https://electionstats.state.ma.us/elections/view/130243/filter_by_county:Norfolk
- 2024 Quincy city results (MA electionstats): https://electionstats.state.ma.us/elections/view/165300/filter_by_county:Norfolk
- AAA Massachusetts gas price average, Aug 8 2026: https://gasprices.aaa.com/?state=MA
