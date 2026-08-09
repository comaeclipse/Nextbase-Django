# North Kingstown, RI Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), replacing an earlier unsigned/unsourced scratch pass (root-level `north_kingstown.json`/`north_kingstown.csv`) that never made it into a tracked archive.

---

## Geography and source choices

- Primary geography: Town of North Kingstown, Washington County, Rhode Island (58.3 sq mi total, of which 14.7 sq mi is water — Narragansett Bay — which is why density is low relative to population).
- **`2016Election`, `2016PresidentPercent`, `2024 Election`, `2024PresidentPercent`, `ElectionChange`, `rep_vote_share_change_pp`, and `dem_vote_share_change_pp` are now filled (2026-08-09)**, at **Washington County** level (per this file's original reasoning: the statewide split would be materially misleading since Washington County leans notably more Republican than Rhode Island overall). MIT Election Data and Science Lab county series: 2016 D 33,741 / R 27,230 (D 55.34% / R 44.66% two-party, stored `election_2016_percent = 55`); 2024 D 42,589 / R 31,247 (D 57.68% / R 42.32% two-party, stored `election_2024_percent = 58`). `rep_vote_share_change_pp = -2.34`, `dem_vote_share_change_pp = +2.34`, `election_change = "2.3 pp more Democratic since 2016"`. Cross-checked against North Kingstown **town-level** returns (RI Board of Elections: 2016 Clinton 7,793/Trump 6,147; 2024 Harris 10,145/Trump 6,673) — the town runs somewhat more Democratic than the county but not so far off as to violate this dataset's county-default convention, so county-level was kept as the stored value. `CityPolitics` remains blank pending a separate categorization pass. Sources: MIT Election Data and Science Lab county series, https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi%3A10.7910%2FDVN%2FVOQCHQ ; RI Board of Elections town-level cross-check, https://www.ri.gov/election/results/2016/general_election/north_kingstown/ and https://www.ri.gov/election/results/2024/general_election/north_kingstown/
- `StateParty`/`Governor` are filled directly as current state-level facts: Rhode Island's governor, Dan McKee, is a Democrat.
- `TCI` left blank (proprietary crime-index methodology convention); `CrimeRating = Low` reflects strong convergent evidence (North Kingstown is cited among the top 100 safest cities in the U.S.).
- `CostOfLiving`, `LGBTQ` (municipal HRC MEI), `LGBTQ_MEI`, `SunnyDays`, `HumiditySummer` are blank — no reliable source found; documented gaps.
- `TechHub = N`: no diversified tech-employment base was independently confirmed beyond the Electric Boat defense presence (already captured by `DefenseHub`).

## Imported values and method

### Population and density
- 2020 Decennial Census: 27,732. Land area 43.6 sq mi (of 58.3 sq mi total, the rest being Narragansett Bay water) → density ≈ 636/sq mi.
- Source: World Population Review / Census Bureau QuickFacts.

### Housing
- `AvgHomeValue`: $558,314 — Zillow ZHVI, up 7.1% YoY.

### Taxes
- `SalesTax`: 7.0% (Rhode Island's flat statewide rate; no city/county sales taxes are permitted anywhere in RI).
- `Income`: 5.99 — Rhode Island's top marginal individual income-tax rate (graduated 3.75%–5.99%).

### Veterans benefits
- Rhode Island fully exempts military retirement pay from state income tax; local property-tax exemptions exist for qualifying veterans/surviving spouses, varying by city or town.

### VA access
- No VA facility is located inside North Kingstown. `VA = No`; nearest is the Providence VA Medical Center, 830 Chalkstone Avenue, Providence, RI. `DistanceToVA` left blank for the VA-sync script.

### Crime
- BestPlaces: violent crime rate 8.9 vs. national 22.7; property crime rate 23.6 vs. national 35.4; zero reported robberies. North Kingstown is cited as ranking among the top 100 safest cities in the U.S.
- `TCI` blank; `CrimeRating = Low`.

### Defense / economy
- General Dynamics Electric Boat operates its Quonset Point facility in North Kingstown: a 400-acre site on Narragansett Bay responsible for submarine steel processing, hull fabrication, and module assembly/outfitting for Virginia- and Columbia-class submarines, employing 7,000+ workers (with active 2026 hiring for 3,200+ additional positions at this site alone). Completed hull modules ship by barge to Electric Boat's Groton, CT shipyard or to Newport News Shipbuilding for final assembly.
- `DefenseHub = Y` — one of the strongest, best-documented cases in this entire promotion batch.

### Climate
- NOAA 1991–2020 Normals, T.F. Green International Airport, Providence/Warwick, RI (GHCND:USW00014765) used as the standard regional reference station (no distinct climate-normals product was found for the small Quonset State Airport station itself): January mean minimum 22.1°F (stored as 22), July mean maximum 83.6°F (stored as 84), annual snowfall 36.60 in (stored as 37), annual precipitation 47.54 in (stored as 48).
- `Climate`: Humid Continental.

### Cannabis
- Rhode Island legalized adult-use recreational cannabis via the Rhode Island Cannabis Act (2022). `Marijuana = Recreational`.

### LGBTQ
- No independently verified HRC Municipal Equality Index score for North Kingstown was retrieved this pass; `LGBTQ` and `LGBTQ_MEI` left blank.
- `LGBTQStatePolicyScore = 38`: MAP's 2026 Rhode Island overall policy tally (38/49, rated "High"). Rhode Island is also cited among states earning an "A" grade for LGBTQ+ safety in 2026 rankings.

## Source URLs

- North Kingstown, RI population/density/geography (World Population Review, Census QuickFacts, Wikipedia): https://worldpopulationreview.com/us-cities/rhode-island/north-kingstown ; https://www.census.gov/quickfacts/northkingstowntownwashingtoncountyrhodeisland
- Zillow North Kingstown ZHVI: https://www.zillow.com/home-values/19671/north-kingstown-ri/
- BestPlaces North Kingstown crime: https://www.bestplaces.net/crime/city/rhode_island/north_kingstown
- Electric Boat Quonset Point facility overview: https://www.workboat.com/behind-the-gates-at-electric-boat-s-quonset-operations ; https://www.gdeb.com/qp/
- Providence VA Medical Center: https://www.va.gov/providence-health-care/locations/providence-va-medical-center/
- Rhode Island top income tax rate 2026: https://ustax.tools/tax-by-state/rhode-island/
- Rhode Island sales tax (flat, no local): general 2026 tax-rate aggregator consensus (Avalara, TaxCloud, others)
- NOAA NCEI monthly normals, USW00014765 (T.F. Green): https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00014765&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USW00014765: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00014765&format=json&units=standard&includeAttributes=false
- MAP Rhode Island Equality Profile: https://mapresearch.org/equality-profiles/ri/
- Rhode Island 2024 statewide presidential results (Washington County not extracted — see gap note): https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Rhode_Island
- Rhode Island gas price average, early Aug 2026: https://thenewportbuzz.com/gas-prices-national-average-4-06-rhode-island-4-02-august-2026/62049
- **Unresolved for follow-up**: Washington County/North Kingstown 2016 and 2024 presidential results — RI Secretary of State elections division (https://vote.sos.ri.gov/)
