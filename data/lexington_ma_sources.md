# Lexington, MA Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), replacing an earlier unsigned/unsourced scratch pass (root-level `lexington.json`/`lexington.csv`) that never made it into a tracked archive.

---

## Geography and source choices

- Primary geography: Town of Lexington, Middlesex County, Massachusetts.
- Election fields use **town-level** results (Massachusetts publishes town-level precinct totals via `electionstats.state.ma.us`), not a county proxy — Lexington is large enough, and the data granular enough, that a county-level qualifier isn't needed here (unlike this dataset's small-town entries).
- `DefenseHub = Y` reflects MIT Lincoln Laboratory, a Department of Defense FFRDC physically headquartered in Lexington on the Hanscom AFB perimeter — one of the strongest defense-employer cases in this dataset (not a remote posting or ancillary supplier).
- `TCI` is left blank for the usual reason (incompatible proprietary crime-index methodologies); `CrimeRating = Low` reflects strong convergent evidence.
- `CostOfLiving`, `LGBTQ` (municipal-level HRC MEI), `LGBTQ_MEI`, `SunnyDays`, and `HumiditySummer` are blank — no reliable source found for each; documented as gaps, not zeros.
- `Snow` is blank: the NOAA normals product for the nearest full station (Hanscom Field) returns an annual precipitation normal but no annual snowfall normal element — a genuine data gap in that specific station's normals product, not an oversight.

## Imported values and method

### Population and density
- 2020 Decennial Census: 34,454. Density ≈ 2,101/sq mi (consistent with World Population Review's Census-derived figure of 2,100/sq mi).
- Source: Wikipedia (Lexington, Massachusetts), citing U.S. Census Bureau.

### Housing
- `AvgHomeValue`: $1,626,351 — Zillow ZHVI, up 2.3% YoY, data through 2026-06-30.

### Taxes
- `SalesTax`: 6.25% (Massachusetts flat statewide rate; no local option).
- `Income`: 9.0 — Massachusetts' effective top marginal rate (5% flat rate plus the 4% "Fair Share" surtax on income above ~$1M), the same figure used across other MA cities in this dataset.

### Veterans benefits
- Massachusetts fully excludes U.S. military retirement pay from state gross income. Local property-tax exemptions exist for qualifying disabled veterans, expanded under the state's HERO Act.

### VA access
- No VA facility is located inside Lexington. `VA = No`; nearest is the Edith Nourse Rogers Memorial Veterans' Hospital, 200 Springs Rd, Bedford, MA (an adjacent town). `DistanceToVA` left blank for the VA-sync script to compute by great-circle distance rather than a manual estimate.

### Crime
- BestPlaces: violent crime rate 7.3 vs. national 22.7; property crime 14.5 vs. national 35.4; overall crime rate 3.39 vs. national 33.37. BestPlaces overall ranking 8/10 with an A+ crime & safety grade; safer than 86% of U.S. cities.
- `TCI` blank (methodology conflict); `CrimeRating = Low`.

### Defense / tech economy
- MIT Lincoln Laboratory: DoD FFRDC managed by MIT, located on the eastern perimeter of Hanscom Air Force Base at the Lexington/Bedford/Lincoln/Concord nexus, with its own campus/HQ address commonly given as Lexington, MA. FY2024 budget ~$1B; ~4,500 staff. Work spans air/missile defense, cybersecurity, space surveillance, and homeland protection.
- `DefenseHub = Y`; `TechHub = Y` (Route 128 tech corridor, biotech/R&D presence).

### Climate
- NOAA 1991–2020 Normals, Bedford/Hanscom Field (GHCND:USW00014702, ~3 mi from Lexington center): January mean minimum 18.2°F (stored as 18), July mean maximum 85.1°F (stored as 85), annual precipitation 42.60 in (stored as 43). Annual snowfall normal not present in this station's normals product — left blank.
- `Climate`: Humid Continental.

### Cannabis
- Massachusetts permits adult-use recreational cannabis (21+) statewide. `Marijuana = Recreational`.

### LGBTQ
- No independently verified HRC Municipal Equality Index score for Lexington specifically was retrieved this pass; `LGBTQ` and `LGBTQ_MEI` left blank rather than guessed.
- `LGBTQStatePolicyScore = 40`: MAP's 2026 Massachusetts overall policy tally (40/49, rated "High").

### Politics and elections
- Massachusetts town-level results via `electionstats.state.ma.us`.
- 2016: Clinton/Kaine 13,900 (74.7%), Trump/Pence 3,279 (17.6%), 18,591 total votes cast (also 610 Johnson/Weld, 244 Stein/Baraka, 5 write-in). Two-party Trump share 19.10%.
- 2024: Harris/Walz 14,362, Trump/Vance 3,279, 18,603 total votes cast. Two-party Trump share 18.60%.
- **Caveat:** the extraction tool returned an identical Trump/Vance vote count (3,279) for both 2016 and 2024, which is plausible for a small, consistently deep-blue town's Republican turnout but close enough to coincidental that it deserves a second look against the raw state PDF before being treated as exact.
- `rep_vote_share_change_pp = -0.50`, `dem_vote_share_change_pp = +0.50`, `ElectionChange = "0.5 pp more Democratic since 2016"`.

## Source URLs

- Lexington, MA population/density (Wikipedia, citing Census): https://en.wikipedia.org/wiki/Lexington,_Massachusetts
- Zillow Lexington ZHVI: https://www.zillow.com/home-values/19005/lexington-ma/
- BestPlaces Lexington crime: https://www.bestplaces.net/crime/city/massachusetts/lexington
- MIT Lincoln Laboratory overview: https://en.wikipedia.org/wiki/MIT_Lincoln_Laboratory
- Edith Nourse Rogers Memorial Veterans' Hospital (VA Bedford): https://www.va.gov/bedford-health-care/locations/edith-nourse-rogers-memorial-veterans-hospital/
- NOAA NCEI monthly normals, USW00014702: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00014702&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USW00014702: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00014702&format=json&units=standard&includeAttributes=false
- MAP Massachusetts Equality Profile: https://mapresearch.org/equality-profiles/ma/
- 2016 Lexington town results (MA electionstats): https://electionstats.state.ma.us/elections/view/130243/filter_by_county:Middlesex
- 2024 Lexington town results (MA electionstats): https://electionstats.state.ma.us/elections/view/165300/filter_by_county:Middlesex
- AAA Massachusetts gas price average, Aug 8 2026: https://gasprices.aaa.com/?state=MA
