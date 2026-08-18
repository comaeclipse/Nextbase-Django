# Crestview, FL Source Notes

Retrieval date: 2026-08-16.

## Geography

- Primary row geography: Crestview city, Okaloosa County, FL.
- Population: U.S. Census QuickFacts reports Crestview city July 1, 2025 population estimate of 31,193.
- Density: QuickFacts reports 2020 land area of 16.58 square miles. Stored density uses the current population estimate over that land area: 31,193 / 16.58 = 1,881.4 people per square mile, stored as 1,881.
- Coordinates: Census 2024 Gazetteer place centroid in the repo pace bundle: 30.747932, -86.579275.
- Source URLs:
  - https://www.census.gov/quickfacts/fact/table/crestviewcityflorida/PST045225

## Housing, Cost, Taxes, and Gas

- Zillow's Crestview ZHVI page reports an average/typical home value of $291,516, updated June 30, 2026. Stored as `AvgHomeValue=$291,516`.
- AreaVibes reports Crestview cost of living index 102, 2% above the U.S. average. Stored as `CostOfLiving=102`.
- Florida Department of Revenue 2026 discretionary surtax guidance lists Okaloosa County surtax at 1%. With Florida's 6% state sales tax, stored combined sales tax is 7.00%.
- AAA reports the Crestview-Fort Walton Beach metro regular unleaded average at $3.6446 on 2026-08-16. Stored as `$3.64`.
- Source URLs:
  - https://www.zillow.com/home-values/24265/crestview-fl/
  - https://www.areavibes.com/crestview-fl/cost-of-living/
  - https://floridarevenue.com/Forms_library/current/dr15dss_26.pdf
  - https://gasprices.aaa.com/?state=FL

## VA Access and Veteran Benefits

- CSV seed uses Eglin Air Force Base VA Clinic, 100 Veterans Way, Eglin Air Force Base, FL, as the nearest VA health clinic and marks `VA=No` because no in-city VA health clinic was found on VA.gov.
- Florida statewide veteran benefits follow the existing Florida row convention: no state personal income tax, disabled-veteran homestead/property tax exemptions, in-state tuition support for eligible GI Bill users, employment preference, and state veterans homes.
- Source URLs:
  - https://www.va.gov/gulf-coast-health-care/locations/eglin-air-force-base-va-clinic/
  - https://www.va.gov/gulf-coast-health-care/locations/
  - https://floridavets.org/benefits-services/housing/
  - https://floridavets.org/wp-content/uploads/2012/08/FDVA-Benefits-Guide.pdf

## Elections and Politics

- Election geography: Okaloosa County presidential returns, not Crestview city precincts. A reviewed city-boundary presidential precinct crosswalk was not retrieved.
- 2016 official Okaloosa results: Trump/Pence 71,893; Clinton/Kaine 23,780. Trump two-party share = 71,893 / (71,893 + 23,780) = 75.14%, stored as 75.
- 2024 official Okaloosa results: Trump/Vance 80,309; Harris/Walz 32,074. Trump two-party share = 80,309 / (80,309 + 32,074) = 71.46%, stored as 71.
- `rep_vote_share_change_pp` = 71.46 - 75.14 = -3.7. `dem_vote_share_change_pp` = +3.7. Stored election change: `3.7 pp more Democratic since 2016`.
- City politics label: `County-level: Strongly Conservative`, based on 71.5% two-party Republican share in 2024.
- Source URLs:
  - https://enr.electionsfl.org/OKA/1628/Summary
  - https://enr.electionsfl.org/OKA/3706/Summary/

## Safety, Cannabis, and LGBTQ

- AreaVibes reports 64 violent crimes in Crestview, equivalent to 214 per 100,000 residents. Stored `TCI=60` uses 214 / FBI 2024 national violent-crime baseline 359.1 per 100,000 * 100 = 59.6.
- Crime label: `Moderate`, because the city-level violent-crime rate is below the national baseline but not as low as the dataset's low-crime examples.
- Florida cannabis status is stored as `Medical`.
- Crestview was not found as a rated municipality in HRC Municipal Equality Index 2025. Stored `LGBTQ=Not Rated / No Local MEI Score Verified` and `LGBTQ_MEI=Not Rated`; the state policy score uses the existing Florida convention of MAP overall policy score `-5.50`.
- Source URLs:
  - https://www.areavibes.com/crestview-fl/crime/
  - https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
  - https://knowthefactsmmj.com/
  - https://www.hrc.org/resources/municipal-equality-index
  - https://www.hrc.org/resources/mei-state/florida
  - https://mapresearch.org/equality-profiles/fl/

## Climate and Weather

- NOAA 1991-2020 monthly normals station selection: `USW00013884` Crestview Bob Sikes AP is at 30.7797, -86.5225 and directly matches the city area. Rounded annual precipitation is 64 inches, January normal low is 39 F, and July normal high is 92 F.
- Sunshine and snow: BestPlaces reports 66 inches of rain, 0 inches of snow, and 226 sunny days per year for Crestview. The CSV stores NOAA precipitation and BestPlaces sunshine/snow.
- Humidity: Timeanddate Crestview July climate average reports 74% relative humidity.
- Climate category rule: hot/humid, because summer high is at least 88 F and July humidity is at least 60%.
- Source URLs:
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00013884.csv
  - https://www.bestplaces.net/climate/city/florida/crestview
  - https://www.timeanddate.com/weather/usa/crestview/climate

## Amenities, Tech, Defense, and Tags

- `HasWalmart=Y`: Walmart Supercenter #944 is in Crestview at 3351 S Ferdon Blvd.
- `HasCostco=N`: Costco's nearest retrieved warehouse is Pensacola, not Crestview.
- `TechHub=N`: no source-backed in-city technology cluster was found.
- `DefenseHub=Y`: Crestview is on the north side of the Eglin/Duke Field military region. Duke Field is near Crestview and Eglin is a major Air Force armament/test complex; official military/economic sources document the regional defense footprint. This is a manual/regional defense-hub judgment, not evidence of a pre-existing exact Crestview defense-employer row.
- Tags: `["Military","Healthcare","Fishing","Low Taxes","Retail","Suburban"]`, reflecting the Eglin/Duke Field region, nearby VA outpatient care, Blackwater/Emerald Coast outdoor access, Florida tax treatment, in-city Walmart retail access, and suburban growth pattern.
- Source URLs:
  - https://www.walmart.com/store/944-crestview-fl
  - https://www.costco.com/w/-/fl/pensacola/1779
  - https://www.cityofcrestview.org/QuickLinks.aspx?CID=35
  - https://www.eglin.af.mil/About-Us/Fact-Sheets/Display/Article/810637/7th-special-forces-group-a/
  - https://installations.militaryonesource.mil/in-depth-overview/eglin-afb
  - https://www.oneokaloosa.org/military-support/

## Known Limitations

- Election values are county-level approximations because no reviewed city-boundary presidential precinct crosswalk was obtained.
- `DefenseHub=Y` is a manual/regional judgment based on nearby Duke Field/Eglin military infrastructure and regional defense economy evidence; the pre-ingest DB probe found no exact Crestview defense-employer row.
- `LGBTQ_MEI=Not Rated` is intentional and sourced; it should store a null numeric MEI score.
- VA outpatient and hospital distances should be treated as provisional in the CSV seed until `scripts/sync-va-facilities.ts` runs after import.
