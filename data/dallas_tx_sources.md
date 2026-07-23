# Dallas, TX Source Notes

Research date: 2026-07-23

## Stored row

- CSV: `data/dallas_tx.csv`
- City/county convention: Dallas is stored as Dallas County for county-level election and political context. Dallas city extends into small parts of Collin, Denton, Kaufman, and Rockwall counties, but the schema has a single `county` field and existing city rows use the primary county.
- `DefenseHub` is intentionally blank in the CSV. The live database already has a Dallas Raytheon employer-location record with one onsite posting, so the derived `defense_hub` value should be recomputed from linked employer data rather than manually curated.

## Sources and field mapping

- Population and density: U.S. Census QuickFacts, Dallas city, Texas. 2025 population estimate 1,329,491; 2020 land area 339.58 sq mi; stored density is 1,329,491 / 339.58 = 3,915 people per sq mi. https://www.census.gov/quickfacts/fact/table/dallascitytexas/PST045225
- Home value: Zillow Home Values, Dallas, TX, updated 2026-06-30, average home value/ZHVI $311,326. https://www.zillow.com/home-values/38128/dallas-tx/
- Cost of living: Apartments.com Cost of Living Calculator, Dallas, TX, reports Dallas is 1.5% lower than the national average; stored integer COL index is 99. https://www.apartments.com/cost-of-living/dallas-tx/
- Sales tax: Avalara Dallas, Texas sales tax page reports 2026 combined sales tax rate of 8.25%. https://www.avalara.com/us/en/taxrates/state-rates/texas/cities/dallas.html
- Income tax: Texas has no state individual income tax; stored `Income` is 0.00.
- VA access: VA North Texas Health Care, Dallas VA Medical Center, 4500 South Lancaster Road, Dallas, TX 75216. Stored distance is an approximate city-center distance. https://www.va.gov/north-texas-health-care/locations/dallas-va-medical-center/
- Veteran benefits: Texas Veterans Commission and Texas Comptroller disabled-veteran property-tax exemption guidance. https://tvc.texas.gov/news/property-tax-exemptions-available-veterans-disability-rating/ and https://comptroller.texas.gov/taxes/property-tax/exemptions/disabledvet-faq.php
- Governor/state party: Texas Governor Greg Abbott; stored as Republican. https://gov.texas.gov/governor-abbott
- Elections: Dallas County 2016 two-party presidential share calculated from Clinton 461,080 and Trump 262,945, giving Clinton 63.7%. 2024 Dallas County table reports Harris 511,118 and Trump 322,569, giving Harris 61.3%. Stored percent values are rounded to whole numbers. Official Dallas County 2024 Clarity exports were not retrievable by this run because the page/PDF path required browser scripting or returned empty content, so the 2024 value uses the published county table that cites official returns. https://www.wsj.com/election/2016/general/state/texas and https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Texas
- Crime/TCI: OpenCrime Dallas 2024 violent crime rate is 658.2 per 100,000; stored TCI is 658.2 / 359.1 * 100 = 183. Dallas Police official dashboards and news releases were used as trend cross-checks, but this run did not retrieve a direct official normalized export suitable for TCI. https://www.opencrime.us/is-it-safe/dallas and https://www.dallaspolice.net/resources/Pages/Crime-reports.aspx
- Marijuana: Texas Compassionate Use Program allows limited medical cannabis; recreational marijuana remains unavailable. https://www.dps.texas.gov/section/compassionate-use-program
- LGBTQ: HRC 2025 Dallas MEI scorecard final score 93; MAP Texas equality profile overall tally -6.75. https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Dallas-Texas.pdf and https://mapresearch.org/equality-profiles/tx/
- Tech hub: Dallas Regional Chamber / Dallas EDC material identifies Dallas-Fort Worth as a major technology and engineering labor market and lists technology, AI, semiconductors, data centers, fintech, life sciences, aviation/defense/aerospace as target industries. https://www.dallaschamber.org/blog/drc-expands-focus-on-life-science-and-biotech-industry-recruitment-launches-economic-development-campaign-to-bring-new-companies-to-dallas-fort-worth/ and https://www.dallasedc.com/about-edc/faq/
- Weather: NWS Fort Worth DFW normals for summer high and winter low; BestPlaces for annual rain, snow, and sunny days; Current Results for July average humidity. https://www.weather.gov/fwd/dfw_records_normals, https://www.bestplaces.net/climate/city/tx/dallas, and https://www.currentresults.com/Weather/Texas/Places/dallas-weather-in-july.php
- Gas: AAA Texas regular gas average checked on 2026-07-23; Dallas metro-specific AAA value was not found, so the stored gas value is the statewide Texas average. https://gasprices.aaa.com/?state=TX
- Amenities/tags: Visit Dallas arts/culture material and Dallas Parks golf resources support arts, culture, and golf tags. https://www.visitdallas.com/things-to-do/arts-culture/ and https://www.dallasparks.org/216/Golf

## Known limitations / unavailable facts

- City-only presidential returns were not found in a clean reusable source during this run; the row uses Dallas County political results and labels the city politics field `County-level: Liberal`.
- Direct official FBI/Dallas normalized violent-crime export was not retrieved; TCI uses OpenCrime's FBI-based per-100k rate and keeps Dallas Police official crime resources as corroborating context.
- Dallas-specific AAA metro gas pricing was not found; the stored gas price is the Texas statewide AAA average as of the research date.
- Climate inputs come from multiple sources because no single official source returned every field required by the existing CSV schema.
