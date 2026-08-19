# Hartford, CT Source Notes

Retrieval date: 2026-08-18.

## Geography

- Primary geography: Hartford city/place, CT, in Hartford County. The row represents the city, not the MSA.
- U.S. Census QuickFacts reports Hartford city population estimate 121,981 for July 1, 2025.
- Stored density uses the 2025 population estimate divided by the Census place land area used for the Hartford city geography: 121,981 / 17.379 square miles = 7,019 people per square mile.
- Census place GEOID: 0937000. The project pace bundle has the official Census place point at 41.765933, -72.681579.
- Pace: project classifier handles pace after import. Do not infer pace from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index reports Hartford typical home value of $203,328, data through July 31, 2026. Stored `AvgHomeValue` is `$203,328`; source note should describe this as ZHVI / typical home value, not an average sale price.
- ERI reports Hartford cost of living 1% above the U.S. average. Stored CostOfLiving index is 101.
- Connecticut Department of Revenue Services states the general sales and use tax rate is 6.35% and there are no additional local sales taxes in Connecticut. Stored SalesTax is 6.35.
- Connecticut top individual income tax is 6.99% in the legacy CSV field. State-owned income-tax facts are not written by `scripts/import-csv.ts`; keep normalized state semantics in `locations_stateinfo`.
- Gas uses AAA Hartford regular average, current average $4.0500 on 2026-08-18, rounded to `$4.05`.

## VA and Veteran Benefits

- VHA VAST one-city calculation from the official ArcGIS layer: nearest outpatient-capable site is Newington VA Clinic at 5 miles; nearest VA medical center is West Haven VA Medical Center at 36 miles.
- VA source: Newington VA Clinic, 555 Willard Avenue, Newington, CT 06111. VA Connecticut says the campus provides primary care and specialty health services including urgent care, mental health, dental, vision, and women's health services.
- Hospital source: West Haven VA Medical Center. VA Connecticut says the hospital provides primary care and specialty health services including mental health, cancer treatment, palliative and hospice care, physical therapy, and rehabilitation.
- `VA=N` in the CSV because the nearest outpatient-capable VA medical site is in Newington, not Hartford. The Hartford Vet Center is counseling/outreach and is excluded from outpatient medical access by the repo VA sync rules.
- Connecticut veterans benefits: MyArmyBenefits reports federally taxed military retired pay is not taxed by Connecticut, military disability retirement pay and VA DIC are not taxed, and SBP/RCSBP/RSFPP annuities are not subject to Connecticut income taxes. Connecticut OPM says state law provides a basic property-tax exemption for qualifying wartime veterans and additional exemptions for eligible veterans/disabled veterans. MyArmyBenefits also notes a complete property-tax exemption for veterans with a total and permanent service-connected VA disability rating, effective October 1, 2024.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station for stored annual snow field and hourly moisture: USW00014740, Hartford Bradley International Airport. It is farther than Hartford-Brainard but has complete snowfall and hourly moisture normals; Brainard's monthly file has temperature/precipitation but blank snowfall.
- Monthly normals from station USW00014740: January low 18.8 F, July high 85.2 F, annual precipitation 47.05 inches, annual snowfall 51.7 inches. Stored rounded fields: Snow 52, Rain 47, AverageLowWinter 19, AverageHighSummer 85.
- Post-import monthly weather rows use the nearest station with monthly temperature normals, USW00014752 Hartford-Brainard Field, 2.6 miles from the Census city point. This is suitable for detailed monthly temperature and precipitation; the legacy annual snow field above uses Bradley because Brainard has blank monthly snowfall normals.
- Post-import hourly moisture rows use USW00014740 Hartford Bradley International Airport, 11.9 miles from the Census city point.
- Sunny days use BestPlaces' Hartford climate summary of 189 sunny days per year because NOAA monthly normals do not include annual sunny-day counts. Current Results reports 99 sunny plus 107 partly sunny Hartford days annually, a compatible 206 days with some sun rather than the stored strict sunny-days measure.
- Summer humidity uses Current Results' Connecticut July relative-humidity table as a Hartford-area proxy: 78% morning and 68% afternoon, averaged to 73%. The monthly NOAA station product does not carry relative humidity; hourly dew-point normals are imported separately by `scripts/import-hourly-normals.ts`.
- Climate label is humid continental. With annual snowfall above 30 inches, the project categorizer classifies Hartford as `cold_snowy`.

## Politics

- Election geography: Hartford town/city returns from Connecticut Election History. This is city-level evidence, not a county proxy.
- Denominator: two-party presidential vote for trend math and stored winner percentages.
- 2016 Hartford presidential votes: Clinton 30,375; Trump 2,531. Clinton two-party share = 92.31%, rounded winner percent 92.
- 2024 Hartford presidential votes: Harris 23,418; Trump 4,884. Harris two-party share = 82.74%, rounded winner percent 83.
- Trend: Republican two-party share increased from 7.69% to 17.26%, or 9.6 pp; Democratic two-party share decreased 9.6 pp. Stored ElectionChange: `9.6 pp more Republican since 2016`.
- CityPolitics stored as `Strongly Liberal` because both elections show the Democratic candidate above 80% two-party share.
- State party/governor: Connecticut governor Ned Lamont is a Democrat. These are state-owned legacy CSV fields and are not written by `scripts/import-csv.ts`.

## Safety and Social

- TCI method: violent-crime-rate proxy indexed to the 2024 FBI national violent-crime rate of 359.1 per 100,000, matching recent repo ingests.
- PlainCrime, an FBI UCR/NIBRS mirror, reports Hartford 2024 violent-crime rate 515.8 per 100,000 and property-crime rate 2,845.5 per 100,000, from Hartford Police Department's FBI UCR submission. AreaVibes reports the same rounded violent rate as 516 per 100,000 and 617 violent crimes.
- TCI = 515.8 / 359.1 * 100 = 143.6, stored as 144. CrimeRating stored as High.
- Marijuana status: Recreational, using existing Connecticut row convention.
- LGBTQ: HRC's 2025 Municipal Equality Index scorecard for Hartford reports final score 85/100. Stored LGBTQ rating and LGBTQ_MEI are both 85.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N. Hartford has finance/insurance depth but was not classified as a broad software/technology employment hub for this row.
- DefenseHub=Y. The repo's RTX careers snapshot includes Pratt & Whitney Hartford, CT with 1 onsite and 1 hybrid posting on 2026-07-10, and Pratt & Whitney's official headquarters is nearby in East Hartford. `DefenseHub=Y` writes a reviewed manual true, and `scripts/recompute-defense-hub.ts` owns the derived `defense_hub` column.
- Insurance/financial-services context: MetroHartford Alliance identifies Hartford as a financial-services powerhouse generating over $10.7 billion in GDP and more than 16,300 financial-services jobs.
- HasWalmart=Y. Walmart's official store directory lists 1 Walmart store in Hartford, CT: Hartford Supercenter, 495 Flatbush Avenue, Hartford, CT 06106.
- HasCostco=N. Costco's Connecticut warehouse directory lists Brookfield, E Lyme, Enfield, Milford, New Britain, Norwalk CT, South Windsor, and Waterbury, but no Hartford warehouse. New Britain is the closest official page found, not an in-city Hartford warehouse.
- Tags and description: Wadsworth Atheneum / arts and culture, Connecticut River / Riverfront Recapture context, hospitals and VA access, insurance/finance economy, and RTX/Pratt & Whitney aerospace-defense footprint.

## Source URLs

- Census QuickFacts Hartford: https://www.census.gov/quickfacts/fact/table/hartfordcityconnecticut/PST045225
- Census Gazetteer files source for coordinates: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Zillow Hartford ZHVI: https://www.zillow.com/home-values/5071/hartford-ct/
- ERI Hartford cost of living: https://www.erieri.com/cost-of-living/united-states/connecticut/hartford
- Connecticut DRS sales and use tax: https://portal.ct.gov/drs/sales-tax/tax-information
- Tax Foundation Connecticut tax overview: https://taxfoundation.org/location/connecticut/
- AAA Connecticut gas prices: https://gasprices.aaa.com/?state=CT
- VA Connecticut locations: https://www.va.gov/connecticut-health-care/locations/
- Newington VA Clinic: https://www.va.gov/connecticut-health-care/locations/newington-va-clinic/
- West Haven VA Medical Center: https://www.va.gov/connecticut-health-care/locations/west-haven-va-medical-center/
- MyArmyBenefits Connecticut military and veterans benefits: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Connecticut
- Connecticut OPM additional veterans tax relief: https://portal.ct.gov/opm/igpp/grants/tax-relief-grants/additional-veterans-tax-relief-program
- NOAA/NCEI monthly normals station CSV: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00014740.csv
- NOAA/NCEI hourly normals station CSV: https://www.ncei.noaa.gov/data/normals-hourly/1991-2020/access/USW00014740.csv
- BestPlaces Hartford climate: https://www.bestplaces.net/climate/city/connecticut/hartford
- Current Results Connecticut sunshine: https://www.currentresults.com/Weather/Connecticut/sunshine-by-month.php
- Current Results Connecticut humidity: https://www.currentresults.com/Weather/Connecticut/humidity-by-month.php
- Connecticut Election History 2024 President: https://electionhistory.ct.gov/
- Connecticut Election History 2016 President: https://electionhistory.ct.gov/contest/4636
- PlainCrime Hartford FBI UCR mirror: https://plaincrime.com/city/hartford-ct
- AreaVibes Hartford crime cross-check: https://www.areavibes.com/hartford-ct/crime/
- HRC 2025 Hartford MEI scorecard PDF: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Hartford-Connecticut.pdf
- Walmart Hartford store directory: https://www.walmart.com/store-directory/ct/hartford
- Walmart Hartford Supercenter: https://www.walmart.com/store/5095-hartford-ct
- Costco Connecticut warehouses: https://www.costco.com/sitemaps/warehouses-by-state/CT
- Costco New Britain warehouse: https://www.costco.com/w/-/ct/new-britain/1196
- RTX Careers: https://careers.rtx.com/global/en
- Pratt & Whitney contact page: https://www.rtx.com/en/prattwhitney/our-company/about/contacts
- Pratt & Whitney overview: https://www.rtx.com/en/prattwhitney
- MetroHartford Alliance insurance and financial services: https://www.metrohartford.com/insurance-financial-services
- Wadsworth Atheneum: https://www.thewadsworth.org/
- Wadsworth Atheneum about page: https://www.thewadsworth.org/about/

## Known Limitations

- City-level crime data is sourced from FBI UCR mirrors because they expose exact 2024 city rates and offense counts in a reusable format; the source note preserves the rate, denominator, and cross-check.
- Annual sunny days and summer relative humidity are secondary climate measures because NOAA monthly normals do not publish those legacy fields.
- The one-city VHA ArcGIS calculation was applied after import, and structural features were re-derived after the VA and defense fields were finalized.
