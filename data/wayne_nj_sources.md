# Wayne, NJ Source Notes

Retrieval date: 2026-08-31.

## Geography and source choices

- Primary geography: incorporated Wayne Township, Passaic County, New Jersey.
- Population is township-level from Census data (2020 Census count 54,838; ACS 5-year estimates ~53,756 - 54,096).
- Land area is 23.72 square miles (Census Gazetteer), yielding a density of ~2,312 people per square mile.
- Presidential election fields use official Wayne Township municipal returns for 2016 and 2024 presidential cycles.
- NOAA weather data reflects 1991-2020 normals for Passaic County / Northern New Jersey regional reporting stations (Little Falls / Essex Fells).

## Imported values and method

- **Population and density**: 2020 U.S. Census population count of 54,838. Divided by 23.72 sq mi land area yields ~2,312 residents/sq mi.
- **Housing**: Zillow Home Value Index (ZHVI) for Wayne, NJ as of mid-2026 reports a typical home value of $767,142. Model field `avg_home_value` uses this ZHVI figure.
- **Cost and taxes**: New Jersey state general sales tax rate is 6.625%. Top marginal state individual income tax rate is 10.75%. `col_index` / `cost_of_living` will be derived post-ingest via BEA Regional Price Parities (`sync-col-index-from-rpp.ts`).
- **VA and veterans benefits**: Local outpatient care is provided by the Paterson VA Clinic at 111 Paterson St, Paterson, NJ (~6 miles from Wayne). Military retired pay is exempt from New Jersey state income tax; NJ provides a $250 annual property tax deduction for veterans (100% disabled veterans receive full property tax exemption).
- **Elections**: Municipal presidential election returns for Wayne Township:
  - 2016: Trump 14,803 votes, Clinton 11,853 votes (55.53% Republican two-party share, stored as 56%).
  - 2024: Trump 15,711 votes, Harris 11,414 votes (57.92% Republican two-party share, stored as 58%).
  - Partisan shift: Republican two-party share moved +2.39 pp (`rep_vote_share_change_pp = 2.4`, `dem_vote_share_change_pp = -2.4`, `election_change = "2.4 pp more Republican since 2016"`).
  - `CityPolitics`: Classified as `Conservative` based on 55-64.9% Republican vote share.
- **Safety and policy**: TCI score of 42 based on violent crime rate indexed to U.S. baseline (`Low` crime rating). Adult-use recreational cannabis is legal under New Jersey state law. MAP New Jersey Equality Profile 2026 policy score is 42.5/49 (`High` rating), stored as 95.
- **Weather and Climate**: NOAA 1991-2020 normals report annual precipitation of 48.8 inches (stored as 49), annual snowfall of 25.8 inches (stored as 26), 205 sunny days, January average low of 21.4°F (stored as 21), July average high of 85.2°F (stored as 85), and July humidity of 64%. Climate classified as `Humid continental`.
- **Gas**: AAA New Jersey regular gasoline average was $3.25/gal at retrieval time.
- **Economic Hubs**: `TechHub` is marked `Y` due to major corporate, healthcare, and higher education presences (William Paterson University, St. Joseph's Health, corporate technology campuses). `DefenseHub` is marked `Y` (`defense_hub_manual = true`) due to the major BAE Systems Information and Electronic Systems Integration Inc. facility (Communications, Navigation & Identification business unit) located at Totowa Rd in Wayne, NJ.
- **Retail Access**: `HasCostco` is `Y` (Costco Wholesale located at 149 State Route 23, Wayne, NJ 07470). `HasWalmart` is `N`.

## Source URLs

- Census QuickFacts, Wayne township, Passaic County, NJ: https://www.census.gov/quickfacts/waynetownshippassaiccountynewjersey
- Census 2024 Gazetteer Places: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Zillow Home Value Index, Wayne, NJ: https://www.zillow.com/home-values/Wayne-NJ/
- New Jersey Division of Taxation sales tax guide: https://www.nj.gov/treasury/taxation/salestax.shtml
- Paterson VA Clinic: https://www.va.gov/nj-health-care/locations/paterson-va-clinic/
- New Jersey Military and Veterans Tax Information: https://www.nj.gov/treasury/taxation/military/taxinformation.shtml
- Passaic County Clerk Election Archives: https://www.passaiccountynj.org/government/departments/county_clerk/elections/
- FBI Crime Data Explorer 2024 / AreaVibes Wayne NJ: https://cde.ucr.cjis.gov/
- MAP New Jersey Equality Profile: https://www.lgbtmap.org/equality-profiles/NJ
- NOAA 1991-2020 Climate Normals: https://www.ncei.noaa.gov/access/us-climate-normals/
- AAA New Jersey Gas Prices: https://gasprices.aaa.com/?state=NJ
- BAE Systems Wayne facility directory: https://www.baesystems.com/en-us/our-company/about-us/bae-systems-inc/inc-locations
