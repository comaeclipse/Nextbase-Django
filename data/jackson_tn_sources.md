# Jackson, TN Source Notes

Retrieval date: 2026-09-02.

## Geography

- Primary geography: Jackson city, TN, Madison County. The row represents the incorporated city of Jackson.
- Population and land area: U.S. Census Bureau QuickFacts / 2020 Decennial Census reports Jackson city 2020 population 68,205 and land area of 58.44 square miles (stored `Population` `"68,205"`).
- Density: Calculated from 2020 Census population divided by land area: 68,205 / 58.44 = 1,167 people per square mile (stored `Density` `1167`).
- Coordinates: Sourced centroid / airport reference at latitude 35.65417, longitude -88.835335 (Census place GEOID `4737640`).
- Pace: project classifier handles pace post-import. Do not infer pace from population or density cutoffs.

## Cost, Taxes, and Housing

- Zillow Home Value Index (ZHVI): Typical home value for Jackson, TN is $227,021 as of July 31, 2026 (all homes, mid-tier, smoothed, seasonally adjusted). Stored `AvgHomeValue` is `"$227,021"`.
- Sales Tax: Tennessee state sales tax rate is 7.00%, and Madison County local option sales tax rate is 2.75% (combined 9.75%). Stored `SalesTax` is `9.75`.
- Income Tax: Tennessee has no state individual income tax (Hall Income Tax fully phased out and repealed as of January 1, 2021). Military retirement pay is 100% exempt from state income tax. Stored `Income` is `0.00`.
- Cost of Living (RPP): BEA Regional Price Parities (MARPP 2024) reports All Items RPP of 85.522 for the Jackson, TN Metropolitan Statistical Area (CBSA `27180`). Stored `CostOfLiving` is `86`. Standardized post-import via `sync-col-index-from-rpp.ts`.
- Gas Price: AAA regular average gas price for Jackson market / Tennessee is $3.76 per gallon as of early September 2026. Stored `Gas` is `"$3.76"`.

## VA and Veteran Benefits

- VA Outpatient Facility: Jackson VA Clinic, 180 Old Hickory Boulevard, Suite L, Jackson, TN 38305-2500 (part of the Memphis VA Health Care System). Stored `NearestVA` is `Jackson VA Clinic`, `DistanceToVA` is `3 miles`, `VA=Y`.
- VA Medical Center (Hospital): Memphis VA Medical Center (1030 Jefferson Ave, Memphis, TN 38104), approximately 85 miles west.
- Tennessee Veterans Benefits summary: Tennessee has no state individual income tax (exempting military retired pay), and provides property-tax relief for disabled veterans, county motor-vehicle tax relief, veteran license plates, state park privileges, and lifetime hunting/fishing licenses.

## Climate

- Station: NOAA / NCEI 1991–2020 Climate Normals station USW00003811 / Jackson McKellar-Sipes Regional Airport (KMKN) & Jackson Experiment Station.
- Monthly/annual normals:
  - January mean daily minimum: 27.2°F (stored `AverageLowWinter`: `27`).
  - July mean daily maximum: 90.6°F (stored `AverageHighSummer`: `91`).
  - Annual precipitation: 53.93 inches (stored `Rain`: `54`).
  - Annual snowfall: ~4 inches (stored `Snow`: `4`).
  - Sunny days: 207 days per year (stored `SunnyDays`: `207`).
  - Summer relative humidity: ~72% (stored `HumiditySummer`: `72`).
  - Climate classification: `Humid subtropical` (Cfa).

## Politics

- Election geography: Madison County, TN.
- Denominator: Two-party presidential vote for trend calculation and winner percentages.
- 2016 Madison County presidential election certified results: Donald J. Trump 19,776; Hillary Clinton 12,308. Total two-party votes = 32,084. Trump share = 61.64% (stored winner `Trump`, winner percentage `62`).
- 2024 Madison County presidential election certified results: Donald J. Trump 23,385; Kamala D. Harris 16,115. Total two-party votes = 39,500. Trump share = 59.20% (stored winner `Trump`, winner percentage `59`).
- Trend derivation: Republican two-party vote share decreased by 2.44 pp (61.64% to 59.20%); Democratic two-party vote share increased by 2.44 pp (38.36% to 40.80%). Stored `rep_vote_share_change_pp`: `-2.4`, `dem_vote_share_change_pp`: `2.4`, `ElectionChange`: `2.4 pp more Democratic since 2016`.
- State party / Governor: Tennessee Governor Bill Lee is a Republican (`R`). Legacy CSV fields `StateParty=R`, `Governor=R`.
- `CityPolitics`: `County-level: Conservative`.

## Safety and Social

- Total Crime Index (TCI): Computed from FBI Crime Data Explorer (CDE) 2023 agency data for Jackson Police Department (ORI `TN0570100`) via `scripts/compute-tci.ts` and `lib/crime-index.ts`.
  - 2023 Covered Population: 68,470 (12 of 12 months reported).
  - 2023 Violent Offenses: 759 (violent rate = 1,108.5 per 100k; violent index = 305 relative to FBI 2023 national rate of 363.8).
  - 2023 Property Offenses: 2,335 (property rate = 3,410.3 per 100k; property index = 178 relative to FBI 2023 national rate of 1,916.7).
  - Formula: TCI = round(0.5 × 304.7 + 0.5 × 177.9) = 241. Stored `TCI` is `241`.
- CrimeRating: `High` (derived from TCI ≥ 150 per project threshold in `lib/crime-index.ts`).
- Marijuana Status: `Illegal` under Tennessee state statute.
- LGBTQ: Jackson is not rated in the Human Rights Campaign (HRC) Municipal Equality Index (MEI). Stored `LGBTQ`: `Not Rated / No Local MEI Score Verified`, `LGBTQ_MEI`: `Not Rated`. MAP Tennessee Equality Profile 2026 score: -1.50/49 (Low); stored `LGBTQStatePolicyScore`: `-1.50`, `LGBTQSource`: `Not rated in HRC MEI; MAP Tennessee Equality Profile 2026 score -1.50/49 (Low)`.

## Economic Hubs, Amenities, and Lifestyle

- TechHub: `N`. Jackson's economy is centered on healthcare, education, logistics/distribution, manufacturing, and regional commerce.
- DefenseHub: `N`. Reviewed negative judgment (`defense_hub_manual=false`). No major military installations or defense prime production facilities in city; live linking recomputes in Apply phase.
- HasWalmart: `Y`. Active Walmart Supercenters include Store #335 (2196 Emporium Dr, Jackson, TN 38305) and Store #1072 (2171 S Highland Ave, Jackson, TN 38301).
- HasCostco: `N`. No Costco warehouse located in Jackson (nearest warehouses in Memphis and Brentwood).
- Tags: `["Low Taxes","Healthcare","College Town","Culture","Parks","Affordable"]`.
- Description: Jackson is a historic regional hub in West Tennessee situated along Interstate 40 between Memphis and Nashville. Known as the birthplace of rockabilly music and home to Casey Jones Village, Jackson offers low living costs, zero state individual income tax, local outpatient VA care, and extensive regional medical facilities anchored by West Tennessee Healthcare. Higher education institutions like Union University and Lane College add vibrant college-town culture, alongside nature trails at Cypress Grove Nature Park and a conservative county political baseline.

## Source URLs

- U.S. Census Bureau QuickFacts Jackson city, TN: https://www.census.gov/quickfacts/fact/table/jacksoncitytennessee/PST045225
- Zillow Home Value Index Jackson, TN: https://www.zillow.com/home-values/jackson-tn/
- Tennessee Department of Revenue Sales and Use Tax: https://www.tn.gov/revenue/taxes/sales-and-use-tax.html
- Bureau of Economic Analysis (BEA) Regional Price Parities (MARPP 2024): https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
- AAA Gas Prices Tennessee: https://gasprices.aaa.com/?state=TN
- Jackson VA Clinic (Memphis VA Health Care System): https://www.va.gov/memphis-health-care/locations/jackson-va-clinic/
- Memphis VA Medical Center: https://www.va.gov/memphis-health-care/locations/memphis-va-medical-center/
- Tennessee Department of Veterans Services / State Benefits: https://www.tn.gov/veteran.html
- NOAA / NCEI 1991–2020 U.S. Climate Normals: https://www.ncei.noaa.gov/access/us-climate-normals/
- FBI Crime Data Explorer Agency Data (Jackson Police Department, ORI TN0570100): https://cde.ucr.cjis.gov/
- Madison County Tennessee Election Commission 2016 Certified Results: https://madisoncountytn.gov/150/Election-Commission
- Madison County Tennessee Election Commission 2024 Certified Results: https://madisoncountytn.gov/150/Election-Commission
- Movement Advancement Project (MAP) Tennessee Equality Profile: https://mapresearch.org/equality-profiles/tn/
- Walmart Store Locator: https://www.walmart.com/store/335-jackson-tn
- Costco Wholesale Warehouse Locations: https://www.costco.com/warehouse-locations
