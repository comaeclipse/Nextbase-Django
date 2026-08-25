# Tallahassee, FL Source Notes

Retrieval date: 2026-08-20.

## Geography

- Primary row geography: Tallahassee city, Leon County, FL.
- Population: U.S. Census Bureau 2024 population estimate of 201,875 (2020 decennial census baseline: 196,169).
- Land Area & Density: Census QuickFacts reports 2020 land area of 100.93 square miles. Stored density uses the population estimate over that land area: 201,875 / 100.93 = 2,000.1 people per square mile, stored as 2,000.
- Coordinates: Census 2024 Gazetteer place centroid in repo pace bundle: 30.453529, -84.252272 (GEOID 1270600).
- Source URLs:
  - https://www.census.gov/quickfacts/fact/table/tallahasseecityflorida/PST045224

## Housing, Cost, Taxes, and Gas

- Zillow ZHVI: Zillow's Tallahassee ZHVI home values page reports typical home value (all homes, mid-tier smoothed) of $296,376, updated July 31, 2026. Stored as `AvgHomeValue=$296,376`.
- Cost of Living: AreaVibes reports Tallahassee cost of living index 108 (8% above national average). BEA Regional Price Parities (RPP) 2008-2024 for Tallahassee MSA (45220) reports an All Items RPP of 93.919 (~94). The database post-import derives and normalizes standard cost of living through `scripts/sync-col-index-from-rpp.ts`.
- Sales Tax: Florida state sales tax is 6.00%. Florida Department of Revenue DR-15DSS lists Leon County discretionary sales surtax at 1.50%. Stored combined sales tax is 7.50%.
- Gas Price: AAA gas prices reports the Tallahassee regular unleaded average at $3.88 on 2026-08-20. Stored as `$3.88`.
- Source URLs:
  - https://www.zillow.com/home-values/20703/tallahassee-fl/
  - https://www.areavibes.com/tallahassee-fl/cost-of-living/
  - https://floridarevenue.com/Forms_library/current/dr15dss_26.pdf
  - https://gasprices.aaa.com/?state=FL

## VA Access and Veteran Benefits

- In-city VA Outpatient Clinic: Sergeant Ernest I. "Boots" Thomas VA Clinic, 2181 East Orange Avenue, Tallahassee, FL 32311 (phone: 850-878-0191), operated by North Florida/South Georgia Veterans Health System.
- `VA=Yes`: Outpatient clinic is within the city limits and immediate urban footprint.
- Nearest VA Hospital: Lake City VA Medical Center (Lake City, FL, ~100 miles) and Malcom Randall VA Medical Center (Gainesville, FL, ~150 miles). Exact facility distances and coordinates are synchronized deterministically via `scripts/sync-va-facilities.ts`.
- Florida statewide veteran benefits follow standard Florida state policy: no state personal income tax, military retirement pay exempt from state taxes, disabled-veteran homestead/property tax exemptions, in-state tuition support for eligible GI Bill beneficiaries, employment preference, and state veterans nursing homes.
- Source URLs:
  - https://www.va.gov/north-florida-health-care/locations/sergeant-ernest-i-boots-thomas-va-clinic/
  - https://www.va.gov/find-locations/facility/vha_573GA
  - https://floridavets.org/benefits-services/

## Elections and Politics

- Election geography: Leon County presidential general election returns from the Florida Division of Elections and Leon County Supervisor of Elections (enr.electionsfl.org/LEO).
- 2016 Official Leon County Results: Hillary Clinton (DEM) 92,068 votes; Donald Trump (REP) 53,821 votes. Total two-party votes = 145,889. Clinton two-party share = 63.11% (stored as 63). Trump two-party share = 36.89%. Winner: Clinton.
- 2024 Official Leon County Results: Kamala Harris (DEM) 94,520 votes; Donald Trump (REP) 60,397 votes. Total two-party votes = 154,917. Harris two-party share = 61.01% (stored as 61). Trump two-party share = 38.99%. Winner: Harris.
- Partisan Trend:
  - `rep_vote_share_change_pp` = 38.99 - 36.89 = +2.1 pp.
  - `dem_vote_share_change_pp` = 61.01 - 63.11 = -2.1 pp.
  - `ElectionChange`: `2.1 pp more Republican since 2016`.
- City Politics Label: `County-level: Liberal`, reflecting 61.0% two-party Democratic share in 2024 and consistent Democratic governance in the state capital/university center.
- Source URLs:
  - https://enr.electionsfl.org/LEO/3706/Summary/
  - https://results.elections.myflorida.com/
  - https://www.leonvotes.gov/

## Safety, Cannabis, and LGBTQ

- Crime & Safety: FDLE and local crime reporting indicate Tallahassee has higher property and violent crime rates than suburban Florida peers. AreaVibes / OpenCrime violent crime rate is estimated at 773.4 per 100,000 residents. Stored `TCI=215` uses 773.4 / FBI 2024 national baseline 359.1 per 100,000 * 100 = 215.39.
- Crime Rating: `High` (consistent with peer central city scores such as Orlando).
- Cannabis: Florida state law allows medical cannabis (`Medical`).
- LGBTQ: Human Rights Campaign (HRC) Municipal Equality Index (MEI) 2024 rates Tallahassee at 96/100 (All-Star City). Stored `LGBTQ=96`, `LGBTQ_MEI=96`. MAP Florida Equality Profile overall policy score is -5.50.
- Source URLs:
  - https://www.areavibes.com/tallahassee-fl/crime/
  - https://www.talgov.com/police
  - https://www.fdle.state.fl.us/FSAC/UCR-Reports.aspx
  - https://www.hrc.org/resources/municipal-equality-index
  - https://mapresearch.org/equality-profiles/fl/

## Climate and Weather

- Station: NOAA 1991-2020 Climate Normals Station `USW00093805` (Tallahassee Regional Airport, 30.3975, -84.3289, elevation 19.2 m).
- Temperature Normals:
  - January Normal Minimum (`AverageLowWinter`): 40.5 °F -> stored as 41.
  - July Normal Maximum (`AverageHighSummer`): 92.1 °F -> stored as 92.
- Precipitation & Snow:
  - Annual Precipitation Normal: sum of monthly normals = 58.81 inches -> stored as 59.
  - Annual Snow: 0 inches. Measurable snow is exceptionally rare in Tallahassee.
- Sunshine & Humidity:
  - Sunny Days: BestPlaces / US Climate Data reports 233 sunny days per year.
  - July Humidity: Timeanddate July average relative humidity is 74%.
- Climate Category: `Humid subtropical` (hot/humid summer pattern with summer high >= 88 °F and July humidity >= 60%).
- Source URLs:
  - https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00093805.csv
  - https://www.weather.gov/tae/climate
  - https://www.timeanddate.com/weather/usa/tallahassee/climate
  - https://www.bestplaces.net/climate/city/florida/tallahassee

## Amenities, Tech, Defense, and Tags

- `HasWalmart=Y`: Tallahassee has multiple Walmart Supercenters, including Store #1408 (4400 W Tennessee St), Store #1078 (3535 Apalachee Pkwy), Store #3301 (5526 Thomasville Rd), and Store #4521 (4021 Lagniappe Way).
- `HasCostco=Y`: Costco Wholesale Warehouse #1027 is located at 4067 Lagniappe Way, Tallahassee, FL 32317.
- `TechHub=N`: Tallahassee hosts significant university research at the National High Magnetic Field Laboratory (MagLab) and Innovation Park, but the local economy is primarily driven by state government, education, and regional healthcare rather than a large commercial private-sector technology cluster.
- `DefenseHub=Y`: Stored in `defense_hub_manual`. Tallahassee hosts an active L3Harris defense facility (`defense_employer_locations` ID 311) with active onsite job postings, as well as Florida Department of Military Affairs / State Capitol defense coordination presence. Linking backfill and recompute confirm hub status.
- Tags: `["Healthcare","Arts","Culture","Low Taxes","Retail","Military"]`, representing in-city VA outpatient and regional medical centers, university museums and state historical sites, Florida zero personal income tax, in-city Walmart and Costco retail, and L3Harris/military footprint.
- Source URLs:
  - https://www.walmart.com/store/1408-tallahassee-fl
  - https://www.costco.com/warehouse-locations/tallahassee-fl-1027.html
  - https://nationalmaglab.org/
  - https://innovationparktlh.com/

## Known Limitations and Audit Notes

- Election data uses Leon County returns because the city of Tallahassee forms the predominant population center of the county (~70% of county population).
- Cost of living is initialized at 108 from AreaVibes and will be synchronized with BEA RPP via `scripts/sync-col-index-from-rpp.ts`.
- VA clinic distances are initialized from local address references and will be updated with exact great-circle distance by `scripts/sync-va-facilities.ts`.
