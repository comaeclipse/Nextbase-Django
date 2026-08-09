# Morrisville, NC Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), replacing an earlier unsigned/unsourced scratch pass (root-level `morrisville.json`/`morrisville.csv`) that never made it into a tracked archive.

---

## Geography and source choices

- Primary geography: Town of Morrisville, Wake County, North Carolina (a small portion extends into Durham County).
- **`2016Election`, `2016PresidentPercent`, `2024 Election`, `2024PresidentPercent`, `ElectionChange`, `rep_vote_share_change_pp`, and `dem_vote_share_change_pp` are now filled (2026-08-09).** NCSBE certified results, Wake County: 2016 Clinton 302,736 / Trump 196,082 (D 60.69% / R 39.31% two-party, stored `election_2016_percent = 61`); 2024 Harris 402,984 / Trump 236,735 (D 62.99% / R 37.01% two-party, stored `election_2024_percent = 63`). `rep_vote_share_change_pp = -2.30`, `dem_vote_share_change_pp = +2.30`, `election_change = "2.3 pp more Democratic since 2016"`. Deliberately did **not** build this from the NCSBE "precinct sorted" files to get a Morrisville-specific number — NCSBE adds statistical noise to those files for voter-privacy reasons, so county-level is the honest choice here, not a shortcut. `CityPolitics` remains blank pending a separate categorization pass. Sources: NC State Board of Elections, Wake County — https://er.ncsbe.gov/?contest=0&county_id=92&election_dt=11%2F08%2F2016&office=FED (2016), https://er.ncsbe.gov/?contest=0&county_id=92&election_dt=11%2F05%2F2024&office=ALL (2024); NCSBE historical-data methodology note on precinct-file noise: https://www.ncsbe.gov/results-data/election-results/historical-election-results-data
- `StateParty` and `Governor` are filled in directly as current state-level facts (not requiring county election data): North Carolina's governor, Josh Stein, is a Democrat (took office January 2025).
- `TCI` is left blank (proprietary crime-index methodology conflict, this dataset's usual convention); `CrimeRating = Low` reflects strong convergent evidence.
- `CostOfLiving`, `LGBTQ` (municipal HRC MEI), `LGBTQ_MEI`, `SunnyDays`, `HumiditySummer` are blank — no reliable source found; documented gaps.

## Imported values and method

### Population and density
- 2020 Decennial Census: 29,630. Density ≈ 3,360/sq mi.
- Source: BiggestUSCities.com, citing Census Bureau; Wake County is North Carolina's most populous county (1,129,410 in 2020).

### Housing
- `AvgHomeValue`: $481,078 — Zillow ZHVI, down 3.9% YoY, data through 2026-06-30.

### Taxes
- `SalesTax`: 7.25% combined (4.75% NC state + 2.0% Wake County + local components; Morrisville itself levies no additional city sales tax).
- `Income`: 3.99 — North Carolina's flat individual income-tax rate for tax year 2026 (down from 4.25%), with further scheduled cuts toward 3.49% through 2028 subject to revenue triggers.

### Veterans benefits
- North Carolina allows qualifying military retirees to deduct eligible U.S. military retirement pay from state taxable income; property-tax relief programs exist for qualifying disabled veterans through state/county veterans services.

### VA access
- No VA facility is located inside Morrisville. `VA = No`; nearest is the Wake County VA Clinic (Raleigh II CBOC), 3040 Hammond Business Place, Suite 105, Raleigh, NC — part of the VA Durham Health Care System, which also operates the Durham VA Medical Center (508 Fulton St, Durham) and clinics in Garner and elsewhere in Wake County. `DistanceToVA` left blank for the VA-sync script.

### Crime
- BestPlaces: violent crime rate 7.6 vs. national 22.7; property crime 28.3 vs. national 35.4. Morrisville is cited among North Carolina's safest towns (alongside Cary and Holly Springs).
- `TCI` blank; `CrimeRating = Low`.

### Defense / tech economy
- Northrop Grumman and KBR (2450 Perimeter Park Drive) both maintain a Morrisville presence delivering defense/government engineering and technology services; MACOM manufactures semiconductors for, among other markets, the defense industry, also in the Morrisville/RTP area.
- `DefenseHub = Y`; `TechHub = Y` (Morrisville sits directly adjacent to Research Triangle Park, one of the largest tech/R&D corridors in the U.S.).

### Climate
- NOAA 1991–2020 Normals, Raleigh-Durham International Airport (GHCND:USW00013722): January mean minimum 31.8°F (stored as 32), July mean maximum 90.8°F (stored as 91), annual snowfall 5.20 in (stored as 5), annual precipitation 46.07 in (stored as 46).
- `Climate`: Humid Subtropical.

### Cannabis
- North Carolina has not legalized recreational or broad medical cannabis (only limited hemp-derived/CBD provisions exist). `Marijuana = Illegal`.

### LGBTQ
- No independently verified HRC Municipal Equality Index score for Morrisville was retrieved this pass; `LGBTQ` and `LGBTQ_MEI` left blank.
- `LGBTQStatePolicyScore = 6.25`: MAP's 2026 North Carolina overall policy tally (6.25/49, rated "Low").

## Source URLs

- Morrisville, NC population/density (BiggestUSCities, Wikipedia, citing Census): https://www.biggestuscities.com/city/morrisville-north-carolina ; https://en.wikipedia.org/wiki/Morrisville,_North_Carolina
- Zillow Morrisville ZHVI: https://www.zillow.com/home-values/6050/morrisville-nc/
- BestPlaces Morrisville crime: https://www.bestplaces.net/crime/city/north_carolina/morrisville
- Northrop Grumman / KBR Morrisville presence, MACOM: https://www.governmentcontractswon.com/department/defense/morrisville_nc_north_carolina.asp
- Wake County VA Clinic (VA Durham Health Care System): https://www.va.gov/durham-health-care/locations/wake-county-va-clinic/
- North Carolina 2026 flat income tax rate: https://incometaxbystate.com/north-carolina
- Wake County sales tax rate: https://www.avalara.com/us/en/taxrates/state-rates/north-carolina/counties/wake-county.html
- NOAA NCEI monthly normals, USW00013722 (RDU): https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00013722&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USW00013722: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00013722&format=json&units=standard&includeAttributes=false
- MAP North Carolina Equality Profile: https://mapresearch.org/equality-profiles/nc/
- North Carolina governor (Josh Stein, D): general current-officeholder knowledge, not independently re-cited this pass
- NC gas price average, Aug 6 2026: https://wcti12.com/news/local/north-carolina-gas-average-climbs-to-413-as-national-prices-reach-448-aaa-says (statewide figure used: $3.76, per fiery.tools tracker citing AAA)
- **Unresolved for follow-up**: Wake County/Morrisville 2016 and 2024 presidential results — NCSBE portal (https://er.ncsbe.gov/) and Wake County elections archive (https://www.wake.gov/departments-government/board-elections/data-reports/past-election-results)
