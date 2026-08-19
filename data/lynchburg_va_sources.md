# Lynchburg, VA Source Notes

Retrieval date: 2026-08-18.

## Geography

- Primary geography: Lynchburg city/place, VA. Lynchburg is an independent city, so the row stores `County=Lynchburg City`.
- Census QuickFacts reports a July 1, 2025 population estimate of 81,347 and 2020 land area of 48.98 square miles.
- Stored density is calculated from the 2025 estimate divided by 2020 land area: 81,347 / 48.98 = 1,661 people per square mile.
- Census place GEOID: 5147672. The repo pace bundle has the official Census place centroid at 37.399016, -79.195458.
- Pace: project classifier handles pace after import. Do not infer pace from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index reports Lynchburg typical home value of $267,078, data through July 31, 2026. Stored `AvgHomeValue` is `$267,078`; source note should describe this as ZHVI / typical home value, not an average sale price.
- ERI reports Lynchburg cost of living 6% below the U.S. average. Stored `CostOfLiving` index is 94.
- Virginia Tax says retail sales and use tax rates vary by locality; Tax Foundation and regional Lynchburg economic-development material identify Virginia's standard combined state/local sales tax as 5.3%, including the mandatory 1% local component. Stored `SalesTax` is 5.3.
- Virginia top individual income tax is 5.75% in the legacy CSV field. State-owned income-tax facts are not written by `scripts/import-csv.ts`; keep normalized state semantics in `locations_stateinfo`.
- Gas uses Stacker's AAA-sourced Lynchburg metro regular average, current as of August 17, 2026: $3.82.

## VA and Veteran Benefits

- Official VA source: Private First Class Desmond T. Doss VA Clinic, 1600 Lakeside Drive, Lynchburg, VA 24501-3116.
- The VA clinic page lists Lynchburg outpatient clinic services including primary care, mental health care, laboratory/pathology, pharmacy, nutrition/food counseling, care coordination, and related care.
- `VA=Y` in the CSV because the official VA clinic is in Lynchburg. The stored CSV distance is a one-city placeholder until `scripts/sync-va-facilities.ts` writes the official ArcGIS nearest outpatient and VA medical-center distances.
- Virginia veterans benefits summary follows the current normalized Virginia state-info row: property-tax exemption for disabled veterans, disabled-veteran vehicle tax/sales exemptions in certain cases, education/tuition assistance, employment assistance, veteran plates, hunting/fishing privileges, state park disability passport, and military retirement subtraction.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station for monthly temperature and precipitation: USC00445117, Lynchburg #2, selected by `scripts/import-weather-monthly.ts` at 2.4 miles from the Census city point.
- Monthly normals from station USC00445117: January normal low 24.5 F, July normal high 85.3 F, annual precipitation 43.61 inches, annual snowfall 12.4 inches. Stored rounded fields: Snow 12, Rain 44, AverageLowWinter 25, AverageHighSummer 85.
- NOAA/NCEI hourly moisture normals station: USW00013733, Lynchburg Regional Airport, selected by `scripts/import-hourly-normals.ts` at 5.4 miles from the Census city point.
- Sunny days use BestPlaces' 218 sunny days per year because NOAA monthly normals do not include annual sunny-day counts.
- Summer humidity uses Timeanddate Lynchburg July climate average humidity of 71%. The monthly NOAA station product does not carry relative humidity; hourly dew-point normals are imported separately by `scripts/import-hourly-normals.ts`.
- Climate label is humid subtropical. With snow below the cold-snowy threshold and summer high below the hot-humid threshold, the project categorizer classifies Lynchburg as `mild_coastal`.

## Politics

- Election geography: Lynchburg independent city, VA. This is exact city/locality geography, not a county proxy.
- Denominator: two-party presidential vote for trend math and stored winner percentages.
- 2016 Lynchburg City presidential votes from Virginia historical election contest 80871: Clinton 14,792; Trump 17,982. Trump two-party share = 54.87%, rounded winner percent 55.
- 2024 Lynchburg City presidential votes from Virginia historical election contest 161256: Harris 16,664; Trump 19,574. Trump two-party share = 54.02%, rounded winner percent 54.
- Trend: Republican two-party share decreased 0.9 pp; Democratic two-party share increased 0.9 pp. Stored ElectionChange: `0.9 pp more Democratic since 2016`.
- CityPolitics stored as `Moderately Conservative` under the project thresholds because the 2024 two-party Republican share is 54.0%.
- State party/governor: Virginia governor Abigail Spanberger is a Democrat in the current normalized state-info row. These are state-owned legacy CSV fields and are not written by `scripts/import-csv.ts`.

## Safety and Social

- Lynchburg Police Department's public crime table reports 2024 violent-crime counts of 9 homicides, 89 forcible sex offenses, 30 robberies, and 176 aggravated assaults, for 301 total violent crimes.
- TCI method: 301 violent crimes / Census 2025 population 81,347 * 100,000 = 370.0 per 100,000. FBI's 2024 national violent-crime baseline used in this repo is 359.1 per 100,000. TCI = 370.0 / 359.1 * 100 = 103.0, stored as 103.
- CrimeRating stored as Moderate because the city violent-crime rate is close to the national baseline.
- Marijuana status: Recreational, using the current normalized Virginia state-info row.
- LGBTQ: HRC's 2025 Municipal Equality Index resource was checked and no Lynchburg scorecard URL was found or retrievable under the 2025 scorecard pattern. Stored `LGBTQ` and `LGBTQ_MEI` as `Not Rated`, which the repo completion rule permits. MAP Virginia Equality Profile 2026 reports overall policy score 25/49, Medium.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=Y and DefenseHub=Y are based on Lynchburg's source-backed nuclear technology and defense manufacturing concentration, not on a broad consumer-software labor market.
- BWXT's official site describes nuclear systems for the U.S. Navy submarine and aircraft-carrier fleet; the Lynchburg Regional Business Alliance says BWX Technologies is headquartered in Lynchburg, employs more than 2,100 people, and is a manufacturing and engineering innovator in the defense sector.
- Framatome's official Lynchburg page lists operational excellence for nuclear products and services at 3315 Old Forest Road, Lynchburg.
- The live `defense_employer_locations` table also has an L3Harris Lynchburg, VA row from the active L3Harris careers-site city facet, source retrieved 2026-07-16, with one onsite posting and eight total facet postings. `scripts/recompute-defense-hub.ts` included this linked employer-presence evidence when deriving `defense_hub=true`.
- `DefenseHub=Y` writes a reviewed manual true; `defense_hub` itself is still owned by `scripts/recompute-defense-hub.ts`.
- HasWalmart=Y. Walmart's official store directory lists three Lynchburg stores, including Supercenter #1350 at 3900 Wards Road and Supercenter #4697 at 3227 Old Forest Road.
- HasCostco=N. Costco's warehouse locator was checked for Lynchburg and no official in-city warehouse page was found as of retrieval.
- Tags and description: James River / Blue Ridge foothills access, Blackwater Creek trail network, Liberty University and University of Lynchburg, local healthcare/VA access, nuclear technology/defense employment, and lower-than-average costs.

## Source URLs

- Census QuickFacts Lynchburg: https://www.census.gov/quickfacts/fact/table/lynchburgcityvirginia/PST045225
- Zillow Lynchburg ZHVI: https://www.zillow.com/home-values/46348/lynchburg-va/
- ERI Lynchburg cost of living: https://www.erieri.com/cost-of-living/united-states/virginia/lynchburg
- Virginia Tax retail sales and use tax: https://www.tax.virginia.gov/retail-sales-and-use-tax
- Tax Foundation Virginia tax profile: https://taxfoundation.org/location/virginia/
- Yes Lynchburg Region taxes and incentives: https://yeslynchburgregion.org/site-selection/taxes-incentives/
- Stacker / AAA Lynchburg gas prices: https://stacker.com/stories/virginia/lynchburg/how-gas-prices-have-changed-lynchburg-last-week
- Lynchburg VA Clinic: https://www.va.gov/salem-health-care/locations/private-first-class-desmond-t-doss-va-clinic/
- Virginia military benefits FAQ: https://www.tax.virginia.gov/military-benefits-faq
- NOAA/NCEI monthly normals station CSV: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USC00445117.csv
- NOAA/NCEI hourly normals station CSV: https://www.ncei.noaa.gov/data/normals-hourly/1991-2020/access/USW00013733.csv
- Timeanddate Lynchburg climate: https://www.timeanddate.com/weather/usa/lynchburg/climate
- BestPlaces Lynchburg climate: https://www.bestplaces.net/climate/city/virginia/lynchburg
- Virginia historical election 2016 contest: https://historical.elections.virginia.gov/contest/80871
- Virginia historical election 2024 contest: https://historical.elections.virginia.gov/contest/161256
- Virginia historical election 2016 CSV: https://va2.elstats.civera.com/api/download_contest/80871_table.csv?split_party=false
- Virginia historical election 2024 CSV: https://va2.elstats.civera.com/api/download_contest/161256_table.csv?split_party=false
- Lynchburg Police crime table: https://www.lynchburgvapolice.gov/crime/
- FBI 2024 national crime release: https://www.fbi.gov/news/press-releases/fbi-releases-2024-reported-crimes-in-the-nation-statistics
- HRC Municipal Equality Index 2025: https://www.hrc.org/resources/municipal-equality-index
- MAP Virginia Equality Profile: https://mapresearch.org/equality-profiles/va/
- BWXT official site: https://www.bwxt.com/
- BWXT careers: https://www.bwxt.com/careers/
- Yes Lynchburg Region major employers: https://yeslynchburgregion.org/why-lyh-region/major-employers/
- Framatome Lynchburg: https://www.framatome.com/en/implantations/lynchburg/
- L3Harris careers search: https://careers.l3harris.com/en/search_jobs
- Walmart Lynchburg store directory: https://www.walmart.com/store-directory/va/lynchburg
- Walmart Lynchburg Wards Road Supercenter: https://www.walmart.com/store/1350-lynchburg-va
- Walmart Lynchburg Old Forest Road Supercenter: https://www.walmart.com/store/4697-lynchburg-va
- Costco warehouse locator: https://www.costco.com/w/-/locations/
- Blackwater Creek Trail: https://www.lynchburgparksandrec.com/trails/blackwater-creek-trail/
- Lynchburg tourism outdoor recreation: https://www.lynchburgvirginia.org/things-to-do/outdoor-recreation/

## Known Limitations

- `LGBTQ_MEI=Not Rated` because no HRC Lynchburg scorecard was located in the 2025 MEI resource or by the expected HRC scorecard URL pattern. This is an intentional not-rated value, not a numeric municipal inclusion score.
- `HasCostco=N` means no official in-city warehouse page or locator result was found as of 2026-08-18; it should be rechecked if Costco announces a Lynchburg warehouse.
- `TechHub=Y` is a nuclear technology / advanced-manufacturing classification and should not be read as a broad software startup-market claim.
