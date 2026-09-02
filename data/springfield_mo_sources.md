# Springfield, MO Source Notes

Retrieval date: 2026-09-02.

## Geography

- Primary geography: Springfield city/place, MO, primarily in Greene County (with minor corporate expansion into Christian County). The row represents the incorporated city, not the Springfield MSA.
- Population and land area: U.S. Census Bureau ACS 2024 1-year estimate via Census Reporter reports Springfield city population 170,572 and land area of 83.3 square miles. The 2020 Decennial Census recorded 169,176 residents.
- Stored density is calculated from the ACS 2024 estimate divided by land area: 170,572 / 83.3 = 2,048 people per square mile.
- Census place GEOID: 2970000. Centroid coordinates: 37.194157, -93.292642.
- Pace: project classifier handles pace after import (`scripts/classify-pace.ts`). Do not infer pace from population or density cutoffs.

## Cost, Taxes, and Housing

- Zillow Home Value Index (ZHVI) reports Springfield typical home value of $246,969, data through July 31, 2026 (all homes, mid-tier, smoothed, seasonally adjusted). Stored `AvgHomeValue` is `$246,969`.
- ERI Economic Research Institute reports Springfield cost of living is 18% below the U.S. national average. Stored CostOfLiving index is 82. Standardized `col_index` will be synchronized from BEA Regional Price Parity (RPP) via `scripts/sync-col-index-from-rpp.ts` in the Apply phase.
- Sales Tax: The combined base sales tax rate in Springfield is 8.10% (Missouri state 4.225% + Greene County 1.750% + City of Springfield 2.125%). Stored `SalesTax` is 8.1.
- Missouri individual income tax top rate is 4.70% in the legacy CSV field. State-owned income tax facts are not written by `scripts/import-csv.ts`; normalized state semantics reside in `locations_stateinfo`.
- Gas uses AAA Springfield regular average of $3.769 on 2026-09-02, stored as `$3.77`.

## VA and Veteran Benefits

- VA outpatient facility: Gene Taylor Veterans' Outpatient Clinic, 1850 W Republic Rd, Springfield, MO 65807-5730 (Station ID: 564BY).
- Distance to outpatient VA: 4.1 miles from city centroid, stored as `4 miles`. `VA=Y` because the clinic is located directly within the city and within the 25-mile access radius.
- Nearest VA Medical Center: Fayetteville VA Medical Center (Station ID: 564) in Fayetteville, AR, at 91 miles.
- Services: The clinic provides primary care, mental health, specialty care, radiology, pharmacy, laboratory, and telehealth under the Veterans Health Care System of the Ozarks. A separate Springfield Vet Center provides readjustment counseling.
- Missouri veterans benefits: Missouri fully exempts military retired pay from state income tax (Mo. Rev. Stat. § 143.121). Qualifying 100% disabled veterans/POWs receive property tax relief (or the Missouri Property Tax Credit circuit-breaker), education/tuition assistance, state employment preference, specialized license plates, and hunting/fishing privileges.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station: USW00013995, Springfield, MO US (Springfield-Branson National Airport).
- Monthly normals from station USW00013995:
  - January low: 24.2 °F (stored `AverageLowWinter`: 24)
  - July high: 89.6 °F (stored `AverageHighSummer`: 90)
  - Annual precipitation: 44.71 inches (stored `Rain`: 45)
  - Annual snowfall: 13.7 inches (stored `Snow`: 14)
- Sunny days: BestPlaces and Springfield Convention & Visitors Bureau report 210 sunny days annually. Stored `SunnyDays` is 210.
- Summer humidity: Timeanddate Springfield climate profile reports July average relative humidity of 71%. Stored `HumiditySummer` is 71.
- Climate label: Humid subtropical. With AverageHighSummer 90 and HumiditySummer 71, the project categorizer derives `hot_humid`.

## Politics

- Election geography: Greene County, MO. This is a county-level political proxy and the row labels `CityPolitics` as `County-level: Conservative`.
- Denominator: two-party presidential vote for trend math and winner percentages.
- 2016 Greene County presidential votes: Trump 78,035; Clinton 42,728 (total two-party 120,763). Trump two-party share = 64.62%, stored rounded winner percent `65`.
- 2024 Greene County presidential votes: Trump 85,956; Harris 55,971 (total two-party 141,927). Trump two-party share = 60.56%, stored rounded winner percent `61`.
- Trend: Republican two-party share decreased 4.06 pp (-4.1 pp); Democratic two-party share increased 4.06 pp (+4.1 pp). Stored `ElectionChange`: `4.1 pp more Democratic since 2016`.
- State party/governor: Missouri governor Mike Kehoe is a Republican (`R`). Legacy CSV fields `StateParty` and `Governor` are stored as `R`.

## Safety and Social

- TCI methodology: Sourced via FBI Crime Data Explorer (CDE) agency data for Springfield Police Department (ORI: `MO0390300`), using the project's standard formula in `lib/crime-index.ts`.
- FBI CDE 2023 reporting (newest national reference year with 12 months reported):
  - Covered population: 170,521
  - Months reported: 12
  - Violent crime count: 2,013 (rate: 1,180.50 per 100,000)
  - Property crime count: 7,092 (rate: 4,159.02 per 100,000)
- National baseline (2023 FBI UCR reference): violent rate 363.8 per 100k, property rate 1916.7 per 100k.
- Indices: `violentIndex` = 100 * (1180.50 / 363.8) = 324.49; `propertyIndex` = 100 * (4159.02 / 1916.7) = 216.99.
- Composite TCI: round(0.5 * 324.49 + 0.5 * 216.99) = 271. Stored `TCI` is 271.
- Crime label: `High` (TCI >= 150).
- Marijuana status: `Recreational` (Missouri voters passed Amendment 3 in November 2022; adult-use sales opened February 2023).
- LGBTQ: Human Rights Campaign (HRC) Municipal Equality Index (MEI) 2024 Springfield, MO scorecard awarded a total score of 61 (59 base points + 2 flex points). MAP Missouri Equality Profile rates Missouri overall policy score at 1.25 / 42.5 (Low/Negative). Stored `LGBTQ` and `LGBTQ_MEI` are `61`.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N. While Springfield supports tech initiatives such as the Jordan Valley Innovation Center and Springfield Tech Council, the economy is primarily driven by healthcare (CoxHealth, Mercy), retail headquarters (Bass Pro Shops, O'Reilly Auto Parts), education (Missouri State University), and advanced manufacturing. It does not meet the criteria for a primary national tech hub.
- DefenseHub=N. Springfield has aerospace component manufacturing (e.g. Positronic Industries) but no major military base or large defense contractor footprint warranting a defense hub designation.
- HasWalmart=Y. Multiple Walmart Supercenters operate within Springfield municipal boundaries, including Supercenter #86 (2825 N Kansas Expy), Supercenter #138 (3315 S Campbell Ave), and Supercenter #3343 (2021 E Independence St).
- HasCostco=Y. Costco Wholesale warehouse #1461 operates at 279 N. Eastgate Ave, Springfield, MO 65802.
- Tags: `["Healthcare", "College Town", "Outdoors", "Culture", "Affordable"]`.
- Description: "Springfield is Missouri's third-largest city and the economic and cultural hub of the Ozarks. Anchored by major regional health systems (CoxHealth and Mercy) and Missouri State University, it is celebrated as the birthplace of Route 66 and the headquarters of Bass Pro Shops with its Wonders of Wildlife Aquarium. The city offers an affordable cost of living, an on-site VA outpatient clinic, and exceptional outdoor recreation across the Ozark plateau."

## Source URLs

- Census Reporter Springfield profile: https://censusreporter.org/profiles/16000US2970000-springfield-mo/
- Zillow Springfield ZHVI: https://www.zillow.com/home-values/40348/springfield-mo/
- ERI Springfield Cost of Living: https://www.erieri.com/cost-of-living/united-states/missouri/springfield
- Missouri Department of Revenue Sales Tax: https://dor.mo.gov/
- City of Springfield Sales Tax breakdown: https://www.springfieldmo.gov/
- AAA Springfield gas prices: https://gasprices.aaa.com/
- Gene Taylor VA Outpatient Clinic: https://www.va.gov/find-locations/facility/vha_564BY
- VHA Facilities FeatureServer (ArcGIS): https://services1.arcgis.com/smmmD7AGkh7eJR2a/arcgis/rest/services/Veterans_Health_Administration_(VHA)_Facilities/FeatureServer/0
- Missouri military tax exemption: https://dor.mo.gov/faq/taxation/individual/pension.html
- NOAA/NCEI monthly normals station USW00013995: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00013995.csv
- BestPlaces Springfield climate: https://www.bestplaces.net/climate/city/missouri/springfield
- Timeanddate Springfield climate: https://www.timeanddate.com/weather/@4409896/climate
- Wikipedia 2016 presidential election in Missouri by county: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Missouri
- Wikipedia 2024 presidential election in Missouri by county: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Missouri
- FBI Crime Data Explorer Agency API: https://cde.ucr.cjis.gov/LATEST/summarized/agency/MO0390300/
- HRC 2024 Springfield MEI Scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-24-Scorecards/MEI-2024-Springfield-Missouri.pdf
- MAP Missouri Equality Profile: https://www.lgbtmap.org/equality_maps/profile_state/MO
- Springfield Area Chamber of Commerce: https://www.springfieldchamber.com/
- Costco Springfield warehouse: https://www.costco.com/warehouse-locations/springfield-mo-1461.html
- Walmart Springfield store locator: https://www.walmart.com/store/86-springfield-mo
