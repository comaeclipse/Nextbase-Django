# Bowling Green, KY Source Notes

Retrieval date: 2026-08-17.

## Geography

- Primary geography: Bowling Green city/place, KY, in Warren County. The row represents the city, not the MSA.
- Population and land area: U.S. Census QuickFacts reports Bowling Green city population estimate 78,505 for July 1, 2025 and 2020 land area of 40.38 square miles.
- Stored density is calculated from the 2025 estimate divided by 2020 land area: 78,505 / 40.38 = 1,944 people per square mile. QuickFacts' 2020 Census density is 1,790.4.
- Census place GEOID: 2108902.
- Pace: project classifier handles pace after import. Do not infer pace from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index reports Bowling Green typical home value of $286,937, data through July 31, 2026. Stored `AvgHomeValue` is `$286,937`; source note should describe this as ZHVI / typical home value, not an average sale price.
- ERI reports Bowling Green cost of living 14% below the U.S. average. Stored CostOfLiving index is 86.
- Kentucky Department of Revenue states Kentucky sales and use tax is 6% and that there are no local sales and use taxes in Kentucky. Stored SalesTax is 6.
- Kentucky top individual income tax is 3.50% in the legacy CSV field. State-owned income-tax facts are not written by `scripts/import-csv.ts`; keep normalized state semantics in `locations_stateinfo`.
- Gas uses AAA Bowling Green regular average, current average $3.6836 on 2026-08-17, rounded to `$3.68`.

## VA and Veteran Benefits

- VA source: Bowling Green VA Clinic, 600 US 31 West Bypass, Fairview Plaza, Suite 12, Bowling Green, KY 42101-4905.
- The VA clinic page says the Bowling Green outpatient clinic provides primary care, mental health care, social work, telehealth, laboratory services, nutrition counseling, and related support services.
- VHA VAST one-city sync result from the official ArcGIS layer: nearest outpatient-capable site is Bowling Green VA Clinic at 1 mile; nearest VA medical center is Nashville VA Medical Center at 61 miles.
- `VA=Y` in the CSV because the official VA clinic is in Bowling Green. `distance_to_va` remains `1 miles` because the sync distance is measured from city centroid to facility coordinates, not by municipal-boundary membership.
- Full VA hospital access is separate: the row stores Nashville VA Medical Center as the nearest VA medical center at 61 miles. VA Tennessee Valley also lists Alvin C. York VA Medical Center in Murfreesboro as a main medical-center location in the system.
- Planned upgrade: on August 6, 2026, VA announced a new Bowling Green outpatient clinic lease with 41,028 net usable square feet and 300 parking spaces. VA said construction and facility preparation are expected to complete by fall 2028, with the first patient expected by spring 2029, and that the facility will provide primary care, mental health, specialty care, and ancillary services.
- Kentucky veterans benefits: the current normalized state-benefits row cites Kentucky Revenue military tax guidance and records conditional retired-pay treatment, employment preference, education/dependent tuition assistance, vehicle tags, disabled sportsman license, hunting/fishing privileges, and state veterans centers. The CSV benefit summary follows that source-backed convention.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station: USW00093808, Bowling Green Warren County Regional Airport.
- Monthly normals from station USW00093808: January low 28.3 F, July high 89.7 F, annual precipitation 50.1 inches, annual snowfall 8.5 inches. Stored rounded fields: Snow 9, Rain 50, AverageLowWinter 28, AverageHighSummer 90.
- Sunny days use Bowling Green Area Chamber / BestPlaces convention of 207 sunny days per year because NOAA monthly normals do not include annual sunny-day counts.
- Summer humidity uses Timeanddate Bowling Green July climate average humidity of 72%. The monthly NOAA station product does not carry relative humidity; hourly dew-point normals are imported separately by `scripts/import-hourly-normals.ts`.
- Climate label is humid subtropical. With AverageHighSummer 90 and HumiditySummer 72, the project categorizer classifies Bowling Green as `hot_humid`.

## Politics

- Election geography: Warren County, KY. This is a county-level political proxy and the row labels `CityPolitics` accordingly.
- Denominator: two-party presidential vote for trend math and stored winner percentages.
- 2016 Warren County presidential votes: Trump 28,673; Clinton 16,966. Trump two-party share = 62.83%, rounded winner percent 63.
- 2024 Warren County presidential votes: Trump 34,862; Harris 21,065. Trump two-party share = 62.34%, rounded winner percent 62.
- Trend: Republican two-party share decreased 0.5 pp; Democratic two-party share increased 0.5 pp. Stored ElectionChange: `0.5 pp more Democratic since 2016`.
- State party/governor: Kentucky governor Andy Beshear is a Democrat. These are state-owned legacy CSV fields and are not written by `scripts/import-csv.ts`.

## Safety and Social

- TCI method: OpenCrime / PlainCrime expose FBI UCR 2024 city/agency-level violent-crime rates for Bowling Green, KY. The FBI API path was rate-limited during retrieval, so this is a secondary mirror of FBI UCR rather than a direct live API pull.
- OpenCrime reports Bowling Green's 2024 violent-crime rate at 224.5 per 100,000 and national average at 359.1 per 100,000; PlainCrime reports the same rounded city rate as 225 per 100,000 and labels the source FBI UCR 2024.
- TCI = 224.5 / 359.1 * 100 = 62.5, stored as 63. CrimeRating stored as Low.
- This `TCI` field is a violent-crime index, not a total/property-crime index. OpenCrime reports Bowling Green's 2024 property-crime rate at 2,928.9 per 100,000, with 2,270 property offenses led by 1,800 larceny-thefts, 264 burglaries, and 206 motor-vehicle thefts. PlainCrime similarly frames property offenses as the lead category.
- Offense mix nuance: the 2024 FBI UCR mirror shows low murder count (1) and low aggravated assault relative to many city profiles, but reported rape is a material outlier in the local offense mix at 69 reports / 89.0 per 100,000. Treat this as reported-crime context rather than a direct individual-risk probability.
- Trend nuance: OpenCrime's 2020-2024 table shows violent-crime count declining from 247 to 174 and property-crime count declining from 3,195 to 2,270. Bowling Green Police Department's 2025 operational statistics, reported by WBKO, show many property and sexual-violence categories lower than 2024 FBI counts, but those BGPD year-end figures are not the same finalized UCR dataset and should not overwrite the 2024 UCR-based `TCI`.
- 2025 BGPD / WBKO operational figures: 4,195 arrests, 3 murders, 48 rapes, 24 robberies, 113 assaults, 214 burglaries/breaking-and-entering, 1,739 larcenies, 157 stolen cars, 500 shoplifting cases, 162 thefts from vehicles, and 56 stolen guns. WBKO reports the top shoplifting locations as Walmart on Morgantown Road, Walmart on Walton Avenue, Liquor Barn on Scottsville Road, Menards, and Target.
- Marijuana status: Medical, using existing Kentucky row convention and Kentucky's state medical cannabis program status.
- LGBTQ: HRC 2025 Bowling Green, Kentucky MEI scorecard final score is 31. MAP Kentucky Equality Profile 2026 reports overall policy score 5.75/49, Low. Stored LGBTQ rating and LGBTQ_MEI are both `31`.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N. Source review found Bowling Green is a manufacturing, university, health-care, logistics, and automotive economy rather than a broad software/technology employment hub. South Central Kentucky economic-development employer lists emphasize Houchens, Dart, Logan Aluminum, Bowling Green Metalforming, GM Corvette Assembly, Henkel, Akebono, Kobe Aluminum, Franklin Precision, Country Oven Bakery, and Trace Die Cast.
- DefenseHub=N. South Western Kentucky markets the region for aerospace/defense partly because of access to Fort Campbell, but no city-level defense installation or contractor footprint strong enough for this row was verified. `DefenseHub=N` writes a reviewed manual false, and `scripts/recompute-defense-hub.ts` owns the derived `defense_hub` column.
- HasWalmart=Y. Walmart's official store page lists Walmart Supercenter #5236 at 1201 Morgantown Road, Bowling Green, KY 42101. Walmart also lists Supercenter #299 at 150 Walton Ave, Bowling Green, KY 42104.
- HasCostco=N. Costco's warehouse locator and Kentucky warehouse pages show Kentucky warehouses but no Bowling Green warehouse page; Costco's new-locations page did not list Bowling Green as of retrieval.
- Tags and description: WKU/college-town culture, GM Corvette plant and National Corvette Museum, Lost River Cave trails/boat tour, Mammoth Cave / Barren River Lake regional recreation, local VA clinic, and lower-than-average costs.

## Source URLs

- Census QuickFacts Bowling Green: https://www.census.gov/quickfacts/fact/table/bowlinggreencitykentucky/PST045225
- Zillow Bowling Green ZHVI: https://www.zillow.com/home-values/17133/bowling-green-ky/
- ERI Bowling Green cost of living: https://www.erieri.com/cost-of-living/united-states/kentucky/bowling-green
- Kentucky sales and use tax: https://revenue.ky.gov/Business/Sales-Use-Tax/Pages/default.aspx
- AAA Bowling Green gas prices: https://gasprices.aaa.com/?state=KY
- Bowling Green VA Clinic: https://www.va.gov/tennessee-valley-health-care/locations/bowling-green-va-clinic/
- VA Tennessee Valley locations: https://www.va.gov/tennessee-valley-health-care/locations/
- VA Bowling Green outpatient clinic lease announcement: https://www.va.gov/tennessee-valley-health-care/news-releases/va-signs-lease-for-new-outpatient-clinic-in-bowling-green-kentucky-to-expand-veterans-access-to-health/
- VA Tennessee Valley construction update mentioning Bowling Green clinic: https://www.va.gov/tennessee-valley-health-care/stories/va-breaks-ground-on-new-multi-specialty-cookeville-clinic/
- Kentucky military tax guidance: https://revenue.ky.gov/Individual/Pages/Military-Tax-Issues.aspx
- NOAA/NCEI monthly normals station CSV: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00093808.csv
- National Weather Service Bowling Green climate page: https://www.weather.gov/lmk/clibwg
- Bowling Green Area Chamber climate summary: https://www.bgchamber.com/livehere
- Timeanddate Bowling Green climate: https://www.timeanddate.com/weather/usa/bowling-green/climate
- Kentucky 2016 election source: https://elect.ky.gov/results/2010-2019/Pages/2016primaryandgeneralelectionresults.aspx
- Kentucky 2024 Warren County official recap PDF: https://elect.ky.gov/results/2020-2029/2024ElectionReports/GeneralRecaps/Warren.pdf
- 2016 county results cross-check: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Kentucky
- 2024 county results cross-check: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Kentucky
- OpenCrime Bowling Green KY FBI UCR mirror: https://www.opencrime.us/cities/bowling-green-kentucky
- PlainCrime Bowling Green KY FBI UCR mirror: https://plaincrime.com/city/bowling-green-ky
- FBI 2024 national crime release: https://www.fbi.gov/news/press-releases/fbi-releases-2024-reported-crimes-in-the-nation-statistics
- Bowling Green Police Department 2025 statistics, via WBKO: https://www.wbko.com/2026/01/13/bowling-green-police-department-shares-2025-city-crime-statistics/
- Bowling Green Police Department current monthly statistics page: https://www.bgky.org/police/statistics
- HRC 2025 Bowling Green scorecard PDF: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Bowling-Green-Kentucky.pdf
- MAP Kentucky Equality Profile: https://mapresearch.org/equality-profiles/ky/
- South Central Kentucky largest employers: https://www.southcentralky.com/existing-industries/largest-employers/
- South Western Kentucky aerospace/defense region note: https://southwesternky.com/top-industries/aerospace-defense/
- Walmart Bowling Green Morgantown Road Supercenter: https://www.walmart.com/store/5236-bowling-green-ky
- Walmart Bowling Green Walton Ave Supercenter: https://www.walmart.com/store/299-bowling-green-ky
- Costco warehouse locator: https://www.costco.com/w/-/locations/
- Costco new locations: https://www.costco.com/f/-/new-locations/
- Lost River Cave trails and activities: https://www.lostrivercave.org/trails-activities/
- Barren River Lake State Resort Park: https://parks.ky.gov/explore/barren-river-lake-state-resort-park-7781
- Kentucky Tourism caves/lakes/corvettes region: https://www.kentuckytourism.com/trip-planning/cities-and-regions/caves-lakes-and-corvettes-region

## Known Limitations

- City-level crime data is sourced from FBI UCR mirrors because the live FBI CDE API returned rate-limit/forbidden errors during retrieval. The notes preserve the exact rate, denominator, and mirror sources.
- `HasCostco=N` means no official in-city warehouse page or new-location listing was found as of 2026-08-17; it should be rechecked if Costco announces a Bowling Green warehouse.
- VA fields were verified with a one-city VHA ArcGIS nearest-facility update rather than the global `scripts/sync-va-facilities.ts` rewrite, because that script has no city selector.
