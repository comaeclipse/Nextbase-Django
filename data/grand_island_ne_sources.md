# Grand Island, NE Source Notes

Retrieval date: 2026-08-25.

## Geography and source choices

- Primary geography: incorporated City of Grand Island, Hall County, Nebraska.
- Population and density: Census ACS 2024 5-year city profile (via Census Reporter) reports population 52,884, land area 30.1 square miles, and population density of 1,755.9 people per square mile (stored as 1,756). Centroid coordinates: `40.9264, -98.3420`.
- Presidential election results are county-level (Hall County) because a reviewed city-boundary precinct crosswalk was not prepared for this ingest; `city_politics` is explicitly marked county-level.

## Imported values and method

- Population and density: Census Reporter ACS 2024 5-year profile for Grand Island city, NE lists population 52,884 across 30.1 square miles, yielding 1,756 people per square mile.
- Housing: Zillow Home Value Index (ZHVI) for Grand Island, NE reports a typical home value of $257,595 as of August 2026, stored as `$257,595` and parsed to `257595`.
- Cost and taxes: Grand Island sales tax is 7.5% (5.5% Nebraska state sales tax + 2.0% Grand Island city sales tax). Top marginal state individual income tax rate is 5.84%.
- VA and veterans benefits: Grand Island VA Medical Center (2201 N Broadwell Ave, Grand Island, NE) is located directly in the city, so `VA` access is `Yes` and `DistanceToVA` is `0 miles`. Nebraska fully exempts military retired pay from state income tax (LB 387, effective tax year 2022). Nebraska offers homestead property-tax exemptions for eligible disabled veterans and surviving spouses, tuition waiver programs for dependents at state colleges/universities, and operates the Central Nebraska Veterans Home directly in Grand Island.
- Elections: Hall County official 2024 results were Trump 15,566 and Harris 6,956 (two-party sum 22,522; Trump 69.11%, Harris 30.89%). Hall County 2016 results were Trump 14,408 and Clinton 6,282 (two-party sum 20,690; Trump 69.64%, Clinton 30.36%). Using two-party shares, Republican share changed by -0.5 pp (`rep_vote_share_change_pp = -0.5`) and Democratic share changed by +0.5 pp (`dem_vote_share_change_pp = 0.5`). `ElectionChange` is `Essentially unchanged since 2016`. Two-party vote share of 69% supports `County-level: Strongly Conservative`.
- Safety and Crime: Violent crime rate for Grand Island is ~367.8 per 100,000. Indexed against the FBI national violent crime rate of 359.1 per 100,000 yields `TCI` of 102 (`367.8 / 359.1 * 100`). `CrimeRating` is stored as `Moderate`.
- LGBTQ: MAP Nebraska Equality Profile 2026 lists a statewide policy score of -4 out of 49 (`Low` policy score). No separate HRC Municipal Equality Index (MEI) scorecard was located for Grand Island; `LGBTQ_MEI` is recorded as `Not Rated`.
- Weather and Climate: NOAA 1991-2020 Climate Normals for Central Nebraska Regional Airport (USW00014935 / KGRI) give annual precipitation 27.0 inches, annual snowfall 28.0 inches, January low 16.0°F, July high 88.0°F, and July relative humidity 68%. Current Results reports 225 days of sun per year (123 sunny + 102 partly sunny). Climate classification is `Humid continental four-season`.
- Retail Amenities: `HasWalmart=Y` (Walmart Supercenter #1326 is located at 2250 S Locust St, Grand Island, NE 68801). `HasCostco=N` (no Costco warehouse exists within Grand Island city limits; nearest is in Lincoln, NE).
- Economy and lifestyle: No major technology-employment cluster adequate for `TechHub` was identified (`N`). No active defense contractor or installation cluster adequate for `DefenseHub` was identified (`N`). Tags and description summarize the healthcare access (in-city VAMC & Veterans Home), low cost of living, Platte River outdoor recreation (sandhill crane migration, fishing, hunting), and conservative regional culture.
- Gas: AAA Nebraska / Grand Island regular gas average was $3.99 per gallon on 2026-08-24.

## Source URLs

- Census Reporter, Grand Island, NE profile: https://censusreporter.org/profiles/16000US3119595-grand-island-ne/
- U.S. Census Bureau QuickFacts, Grand Island city, Nebraska: https://www.census.gov/quickfacts/fact/table/grandislandcitynebraska/PST045225
- Zillow Home Value Index, Grand Island, NE: https://www.zillow.com/home-values/45484/grand-island-ne/
- Nebraska Department of Revenue sales tax rates: https://revenue.nebraska.gov/businesses/sales-and-use-tax
- Grand Island VA Medical Center (VAMC): https://www.va.gov/nebraska-western-iowa-health-care/locations/grand-island-va-medical-center/
- Nebraska Department of Veterans' Affairs (NDVA) benefits: https://veterans.nebraska.gov/benefits
- Central Nebraska Veterans Home: https://veterans.nebraska.gov/cnvh
- Official Hall County 2024 General Election Results: https://hallcountyne.gov/
- Nebraska Secretary of State 2016 General Election Results: https://sos.nebraska.gov/elections/2016-general-election-results
- FBI Crime Data Explorer & UCR summary: https://cde.ucr.cjis.gov/
- MAP Nebraska Equality Profile: https://www.lgbtmap.org/equality_maps/profile_state/NE
- NOAA NCEI 1991-2020 Climate Normals, USW00014935: https://www.ncei.noaa.gov/access/us-climate-normals/
- AAA Gas Prices Nebraska: https://gasprices.aaa.com/?state=NE
- Walmart Store Directory, Grand Island, NE: https://www.walmart.com/store/1326-grand-island-ne
