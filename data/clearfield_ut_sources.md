# Clearfield, UT Source Notes

Retrieval date: 2026-08-29.

- **Identity**: City of Clearfield, Davis County, UT. 2020 Census population: 31,909; ACS 2023 estimate: 33,523. Land area: 7.97 sq mi. Population density: 4,200/sq mi.
  - Source: U.S. Census Bureau QuickFacts, https://www.census.gov/quickfacts/fact/table/clearfieldcityutah/PST045223
- **Housing**: Zillow August 2026 ZHVI typical home value: $428,325 (`$428k`).
  - Source: Zillow Research / Clearfield UT Home Values, https://www.zillow.com/clearfield-ut/home-values/
- **Elections**: Davis County official presidential returns:
  - 2016: Trump 61,289 votes, Clinton 28,776 votes, McMullin 39,735 votes. Two-party total: 90,065. Trump 2-party share: 68.05%; Clinton 2-party share: 31.95%. Stored candidate % of total: Trump 44%, Clinton 21%.
  - 2024: Trump 101,293 votes (60.81%), Harris 59,895 votes (35.96%). Two-party total: 161,188. Trump 2-party share: 62.84%; Harris 2-party share: 37.16%. Stored candidate % of total: Trump 61%, Harris 36%.
  - Deltas: `rep_vote_share_change_pp = -5.2` (62.84% - 68.05%), `dem_vote_share_change_pp = +5.2` (37.16% - 31.95%). `election_change = "5.2 pp more Democratic since 2016"`. `city_politics = "County-level: Conservative"`.
  - Source: Davis County Clerk / Elections Division & Utah Lieutenant Governor Elections Office.
- **Taxes & Cost of Living**: Combined state (4.85%) + Davis County (1.80%) + Clearfield city (0.10%) + special district (0.50%) sales tax = 7.25%. Utah state flat income tax: 4.5%. Gas price: $4.33/gal (Ogden-Clearfield metro average). `col_index` / `cost_of_living` derived from BEA Regional Price Parities post-ingest.
  - Source: Utah State Tax Commission, https://tax.utah.gov/ / AAA Gas Prices Utah.
- **Healthcare & VA**: Ogden VA Clinic in Ogden, UT (~9 miles north). Nearest VA Hospital: George E. Wahlen Department of Veterans Affairs Medical Center in Salt Lake City, UT (~28 miles south).
  - Source: U.S. Department of Veterans Affairs Facilities Directory / VHA VAST.
- **Safety**: FBI UCR / NIBRS 2024 violent crime rate: ~3.2 per 1,000 residents vs US average ~4.0 per 1,000. Indexed TCI = 72 (`CrimeRating = Low`).
  - Source: FBI Crime Data Explorer (CDE), https://cde.ucr.cjis.gov/ / Clearfield Police Department Annual Briefings.
- **LGBTQ**: MAP Utah Equality Profile score: 9/100 (state policy rating).
  - Source: Movement Advancement Project, https://mapresearch.org/equality-profiles/ut/
- **Weather**: NOAA 1991-2020 Normals (Hill Air Force Base / Ogden station): Snowfall 34 in, Rain 20 in, Sunny days 226, Winter low 21°F, Summer high 91°F, July humidity 38%. Climate: Semiarid / Four Season.
  - Source: NOAA NCEI Climate Normals.
- **Retail & Tech**: TechHub: Y (Falcon Hill Aerospace Research Park / aerospace tech ecosystem). HasWalmart: Y (565 W 1700 S, Clearfield, UT). HasCostco: Y (1818 S 300 W, Syracuse/Ogden/Layton area).

## defense_hub_manual (retrieved 2026-08-29)

Determination: **TRUE** (`DefenseHub = Y`)

Clearfield is directly adjacent to Hill Air Force Base (the second largest Air Force base by population and major depot/maintenance center in the DoD) and hosts the Freeport Center industrial park along with Northrop Grumman Innovation Systems (formerly Orbital ATK / Propulsion Systems), BAE Systems, Kiowa Power, and numerous aerospace and defense contractors in the Falcon Hill Aerospace Research Park. It is one of the premier defense and aerospace hubs in Utah and the Intermountain West.

Sources:
- Hill Air Force Base Economic Impact Report / Davis County Economic Development.
- Falcon Hill Aerospace Research Park: https://falconhillpark.com/
- Northrop Grumman Clearfield / Roy / Hill AFB operations.
