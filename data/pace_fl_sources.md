# Pace, FL Source Notes

Retrieval date: 2026-08-16.

## Geography

- Primary row geography: Pace CDP, Santa Rosa County, FL. Pace is unincorporated, so city-boundary municipal records are limited.
- Population and density: U.S. Census QuickFacts reports Pace CDP 2020 Census population of 24,684. Density uses the Census Gazetteer land area of 24.23 square miles: 24,684 / 24.23 = 1,018.8, stored as 1,019.
- Coordinates: Census 2024 Gazetteer place centroid in the repo pace bundle: 30.616737, -87.164733.
- Source URLs:
  - https://www.census.gov/quickfacts/fact/table/pacecdpflorida/PST045225
  - https://www.census.gov/quickfacts/fact/table/pacecdpflorida/RHI425225

## Housing, Cost, Taxes, and Gas

- Zillow Pace city ZHVI page reports a typical home value of $327,326, updated June 30, 2026. Stored as `AvgHomeValue=$327,326`.
- AreaVibes reports Pace cost of living index 104, 4% above the U.S. average. Stored as `CostOfLiving=104`.
- Florida Department of Revenue 2026 discretionary surtax guidance lists Santa Rosa County surtax at 1%. With Florida's 6% state sales tax, stored combined sales tax is 7.00%.
- Walmart's official Pace Neighborhood Market page listed regular unleaded at $3.529/gallon, prices updated 2026-08-10. Stored as `$3.52`.
- Source URLs:
  - https://www.zillow.com/home-values/53775/pace-fl/
  - https://www.areavibes.com/pace-fl/cost-of-living/
  - https://floridarevenue.com/Forms_library/current/dr15dss_26.pdf
  - https://www.walmart.com/store/2467-pace-fl

## VA Access and Veteran Benefits

- CSV seed uses Pensacola VA Clinic, 790 Veterans Way, Pensacola, FL, as the nearest outpatient-capable facility and marks `VA=No` because Pace has no in-CDP VA clinic. The post-import VA sync is authoritative for final outpatient and VA medical-center distances.
- Florida statewide veteran benefits follow the existing Florida row convention: no state personal income tax, disabled-veteran homestead/property tax exemptions, in-state tuition support for eligible GI Bill users, employment preference, and state veterans homes.
- Source URLs:
  - https://www.va.gov/gulf-coast-health-care/locations/pensacola-va-clinic/
  - https://floridavets.org/benefits-services/housing/
  - https://floridavets.org/wp-content/uploads/2012/08/FDVA-Benefits-Guide.pdf

## Elections and Politics

- Election geography: Santa Rosa County presidential returns, not Pace precincts. Pace is an unincorporated CDP and no city-boundary presidential precinct crosswalk was retrieved.
- 2016: Trump 65,339; Clinton 18,464. Trump two-party share = 65,339 / (65,339 + 18,464) = 77.97%, stored as 78.
- 2024: Trump 84,314; Harris 27,035. Trump two-party share = 84,314 / (84,314 + 27,035) = 75.72%, stored as 76.
- `rep_vote_share_change_pp` = 75.72 - 77.97 = -2.3. `dem_vote_share_change_pp` = +2.3. Stored election change: `2.3 pp more Democratic since 2016`.
- City politics label: `County-level: Strongly Conservative`, based on 75.7% two-party Republican share in 2024.
- Source URLs:
  - https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Florida
  - https://enr.electionsfl.org/SAN/3725/Summary/
  - https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Florida

## Safety, Cannabis, and LGBTQ

- Pace is not an incorporated police jurisdiction. A compatible city-level FBI extract was not available. Stored `TCI=40` uses Santa Rosa County's latest retrieved FBI/DataUSA violent-crime rate proxy of 145 per 100,000 divided by the FBI 2024 national violent-crime baseline of 359.1 per 100,000, rounded: 145 / 359.1 * 100 = 40.4.
- Crime label: `Low`, because the county-level violent-crime proxy is far below the national baseline. This is a county-level approximation, not a Pace municipal police statistic.
- Florida cannabis status is stored as `Medical`.
- Pace was not found as a rated municipality in HRC Municipal Equality Index 2025. Stored `LGBTQ=Not Rated / No Local MEI Score Verified` and `LGBTQ_MEI=Not Rated`; the state policy score uses the existing Florida convention of MAP overall policy score `-5.50`.
- Source URLs:
  - https://datausa.io/profile/geo/santa-rosa-county-fl
  - https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
  - https://knowthefactsmmj.com/
  - https://www.hrc.org/resources/municipal-equality-index
  - https://www.lgbtmap.org/equality-maps/profile_state/FL

## Climate and Weather

- NOAA 1991-2020 monthly normals station selection from the repo station inventory: `USC00086999` Pensacola 7 NNE, 6.3 miles from the Pace centroid, was the nearest station with temperature normals. Rounded annual precipitation is 68 inches, annual snow is 0, January normal low is 42 F, and July normal high is 91 F.
- Sunshine: BestPlaces Pace climate page reports 229 sunny days per year.
- Humidity: Timeanddate Pensacola July climate average reports 75% relative humidity; used as a regional proxy because NOAA monthly normals do not include relative humidity.
- Climate category rule: hot/humid, because summer high is at least 88 F and July humidity is at least 60%.
- Source URLs:
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USC00086999.csv
  - https://www.bestplaces.net/climate/city/fl/pace
  - https://www.timeanddate.com/weather/usa/pensacola/climate

## Amenities, Tech, Defense, and Tags

- `HasWalmart=Y`: Walmart Neighborhood Market #2467 is in Pace at 4239 Berryhill Rd.
- `HasCostco=N`: Costco's Florida warehouse directory and Pensacola warehouse page list the nearest warehouse in Pensacola, not Pace.
- `TechHub=N`: no source-backed in-CDP technology cluster was found.
- `DefenseHub=N`: no in-CDP defense employer row, military installation, or defense-industry hub evidence was found. The row still carries a `Military` tag because Pace is in the Pensacola/Navy regional context, but `defense_hub_manual=false` is intentionally a stricter in-city hub judgment.
- Tags: `["Fishing","Beaches","Golf","Low Taxes","Retail","Military"]`, reflecting Escambia Bay/Blackwater River and nearby Gulf Coast recreation, Florida tax treatment, official Walmart in-city retail access, and Pensacola-area military context.
- Source URLs:
  - https://www.walmart.com/store/2467-pace-fl
  - https://www.costco.com/w/-/fl/pensacola/1779
  - https://www.costco.com/sitemaps/warehouses-by-state/FL
  - https://www.visitpensacola.com/

## Known Limitations

- Election and safety values are county-level approximations because Pace is an unincorporated CDP and no reviewed city-boundary precinct or police-jurisdiction extract was obtained.
- `LGBTQ_MEI=Not Rated` is intentional and sourced; it should store a null numeric MEI score.
- VA outpatient and hospital distances should be treated as provisional in the CSV seed until `scripts/sync-va-facilities.ts` runs after import.
