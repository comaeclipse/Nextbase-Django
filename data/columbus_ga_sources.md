# Columbus, GA source notes

Retrieval date: 2026-08-07. Gap audit refresh: 2026-08-07.

## Scope and method

- The row represents the consolidated City of Columbus / Muscogee County, Georgia. Census place population and land area are city-level (Columbus city). Presidential results use Muscogee County totals; because Columbus is a consolidated city-county, that geography matches the curated place for presidential contests.
- The active importer is `scripts/import-csv.ts`, which upserts the complete row by `(City, State)`. Its `DefenseHub` input is a human-curated value for `defense_hub_manual`; the derived `defense_hub` is recomputed after linking employer locations.

## Imported values and provenance

- **Population and density:** Census QuickFacts reports the 2020 Census population for Columbus city, Georgia as 206,922. The Census ACS API was unavailable without a key in the original pipeline; QuickFacts is the primary-source fallback for the 2020 Census count (a sourcing substitution, not an unresolved value). The Census 2024 Georgia place Gazetteer reports 216.5 square miles of land area for Columbus city (GEOID 1319000). Density is `206922 / 216.5 = 955.76`, stored as `956`.
- **Housing:** Zillow's city-level, smoothed and seasonally adjusted all-homes mid-tier ZHVI CSV reports $177,244.22 for Columbus, GA at 2026-06-30. It is stored as `$177,244`; despite the legacy column name, ZHVI is a typical home value, not an average or median.
- **Taxes and cost:** Georgia DOR's July 1, 2026–September 30, 2026 general rate chart lists Muscogee (code 106) at a combined 9 percent sales tax. Georgia's current flat individual income-tax rate is 4.99 percent. Columbus State University's Butler Center report *Regional Cost of Living and Affordability: Columbus, GA in Comparative Perspective — Q1-2026* cites C2ER COLI composite **87.1** for Columbus (housing 70.9, groceries 97.2, utilities 93.9, transportation 82.4, health 85.2, miscellaneous 96.6), stored as `87` (`Low` under the product rule). Vintage: **Q1 2026**.
- **VA and benefits:** Columbus hosts at least two distinct VA outpatient sites under VA Central Alabama health care:
  - Robert S. Poydasheff VA Clinic, 6910 River Road, Columbus, GA 31904
  - Columbus Downtown VA Clinic, 2100 Comer Avenue, Plaza G, Columbus, GA 31904
  The curated outpatient fields use Poydasheff as the city-anchor facility (`Yes` / `0 miles`). These are separate facilities and must not overwrite each other. A centroid-based run of `scripts/sync-va-facilities.ts` previously selected Downtown at 6 miles; that distance concept is not used for the curated local outpatient slot. Hospital fields remain from the VAST sync: `Central Alabama VA Medical Center-Montgomery` at `80 miles`. The benefit summary follows the existing Georgia state-benefits record used for Savannah.
- **Elections and politics:** Muscogee County's official Enhanced Voting results for the November 5, 2024 general election report Harris 49,413 and Trump 30,616. For 2016, legacy Clarity detail XML returned HTTP 403 during the first ingest; the election remains accessible through the Georgia SOS current historical-results / Enhanced Voting portal covering elections from July 2012 onward. Until a Muscogee-filtered pull from that portal is completed, 2016 totals remain Clinton 39,851 and Trump 26,976 as reported by Dave Leip's Atlas (citing Georgia SOS official results and linking an official Muscogee summary dated 2016-11-15). Two-party Democratic shares are 59.633 percent in 2016 and 61.744 percent in 2024: Democratic +2.11 percentage points and Republican -2.11 points. The CSV rounds these to winner percents `60` / `62`, `2.1 pp more Democratic since 2016`, Democratic +2.1 pp, and Republican -2.1 pp. The 2024 two-party Democratic share falls in the product's `Liberal` band; because Columbus/Muscogee is consolidated, the label is stored without a county-level qualifier.
- **Safety:** WTVM reporting of Columbus Police Department Part I figures for January 1–December 2, 2024 (used as the year-over-year baseline in CPD's Dec 2025 release) gives murder 32, rape 33, robbery 173, and aggravated assault 727 — **965** violent Part I offenses under the traditional four-category definition. CPD also publishes the same Part I categories in Weekly Compliancy Reports. Rate using the 2020 Census city population 206,922 as an explicit denominator vintage: `965 / 206922 × 100000 = 466.4` per 100,000. Indexed to the FBI 2024 national violent-crime rate of 359.1 per 100,000: `466.4 / 359.1 × 100 = 129.9`, stored as TCI `130` with descriptive rating `Moderate`. Denominator vintage is 2020 Census, not a 2024 population estimate.
- **Cannabis and LGBTQ:** Georgia is treated as `Medical` under the product's medical-only convention. HRC's 2025 Municipal Equality Index scorecard for Columbus, GA sums to 49/100 (also reported as 49 by the Columbus Ledger-Enquirer). MAP's current Georgia profile gives an overall state policy score of -0.75/49.
- **Climate:** NOAA 1991-2020 normals from Columbus Metropolitan Airport (USW00093842) provide 48.82 inches annual precipitation, 0.50 inches annual snowfall, January normal low 38.2 F, and July normal high 92.9 F. Rounded row values are rain 49, snow 1, low 38, high 93. Timeanddate's Columbus Metropolitan Airport climate table (CustomWeather, 1992–2021) reports July humidity 67 percent. `sun_days` is stored as `214` from a Georgia city climate comparison (Augusta CEO, 2024); this is a **derived/secondary** sunny-days figure, not an official NOAA Climate Normal (NOAA publishes percent-of-possible sunshine / sunshine hours series, not a standardized Columbus "sunny days per year" normal). The documented temp/humidity values classify as `hot_humid` under the repository rule (summer high at least 88 and humidity at least 60).
- **Gas:** AAA's Columbus (GA only) metro regular-gas average was $3.7771 on 2026-08-07, stored as `$3.78`.
- **Lifestyle and defense:** Fort Moore (formerly Fort Benning) anchors the local military economy; `DefenseHub=Y` remains a researched manual classification. Separately, Pratt & Whitney (RTX) operates major physical sites in Columbus — Columbus Engine Center (8987 Macon Road) and Columbus Forge (8801 Macon Road) — confirmed by RTX's February 2026 $200M expansion announcement and Georgia economic-development materials. Matching `defense_employer_locations` rows are hand-sourced under employer slug `pratt-whitney` (posting counts intentionally blank; physical site attested by company/state sources, not an ATS snapshot). The earlier `link_backfill: 0` finding was a **false negative** from an incomplete employer-site table, not evidence of no RTX presence. `TechHub=N` because no source meeting the product's city-level technology-employment standard was located. Tags reflect military presence, VA/healthcare access, Chattahoochee River recreation, golf, and downtown arts/culture.

## Known gaps / caveats

- `sun_days=214` is secondary/derived, not NOAA-primary. Prefer `sunshine_pct` / `annual_sunshine_hours` if the schema is later extended.
- 2016 Muscogee totals are still pending a direct county-filtered pull from the Georgia SOS Enhanced Voting historical portal; current stored votes match Leip/SOS-cited figures and should be replaced only after that pull.
- Violent-crime period is CPD Jan 1–Dec 2, 2024 as reported in the Dec 2025 WTVM/CPD release, not an independently downloaded full-calendar FBI Table 8 file.
- Future blind re-runs of `scripts/sync-va-facilities.ts` may again prefer Downtown by centroid distance; restore curated Poydasheff outpatient fields afterward, or teach the sync to preserve a manual outpatient override.

## Source URLs

- Census QuickFacts Columbus city, Georgia: https://www.census.gov/quickfacts/fact/table/columbuscitygeorgia/POP010220
- Census 2024 Georgia place Gazetteer: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_13.txt
- Zillow Research city ZHVI download: https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv
- Georgia DOR sales-tax rate chart, effective July 1, 2026: https://dor.georgia.gov/document/document/general-rate-chart-effective-july-1-2026-through-september-30-2026pdf/download
- Georgia DOR important tax updates: https://dor.georgia.gov/taxes/important-tax-updates
- Columbus State University Butler Center COL report (Q1-2026): https://www.columbusstate.edu/turner/butler-center/_docs/cost-of-living-index-research-report.pdf
- Robert S. Poydasheff VA Clinic: https://www.va.gov/central-alabama-health-care/locations/robert-s-poydasheff-va-clinic/
- Columbus Downtown VA Clinic: https://www.va.gov/central-alabama-health-care/locations/columbus-downtown-va-clinic/
- VA Central Alabama locations: https://www.va.gov/central-alabama-health-care/locations/
- Georgia DOR retirement and military-retirement exclusions: https://dor.georgia.gov/retirement-income-exclusion
- Georgia Department of Veterans Service benefits: https://veterans.georgia.gov/disabled-veteran-homestead-tax-exemption
- Muscogee County official 2024 Enhanced Voting results: https://app.enhancedvoting.com/results/public/muscogee-county-ga/elections/2024NovGen
- Georgia SOS election results portal: https://sos.ga.gov/page/georgia-election-results
- Georgia Enhanced Voting 2016 General Election: https://app.enhancedvoting.com/results/public/Georgia/elections/2016NovGen
- Dave Leip Atlas Muscogee 2016 (cites Georgia SOS): https://uselectionatlas.org/RESULTS/statesub.php?year=2016&fips=13215&f=0&off=0&elect=0
- WTVM CPD Part I crime comparison (2024 baseline counts): https://www.wtvm.com/2025/12/04/columbus-police-report-decrease-part-1-crimes-2025/
- Columbus Police Weekly Compliancy Reports: https://columbusga.gov/police/Reports/Weekly-Compliancy-Reports
- FBI 2024 UCR national summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- HRC Municipalities Columbus, GA MEI page: https://www.hrc.org/resources/municipalities/columbus-ga
- Ledger-Enquirer MEI 49 report: https://www.ledger-enquirer.com/news/politics-government/article314431115.html
- Movement Advancement Project Georgia profile: https://www.mapresearch.org/equality-profiles/ga
- NOAA annual/seasonal normals, USW00093842: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00093842&format=json&units=standard&includeAttributes=false
- NOAA monthly normals, USW00093842: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00093842&format=json&units=standard&includeAttributes=false
- Timeanddate Columbus climate humidity proxy: https://www.timeanddate.com/weather/usa/columbus-ga/climate
- Augusta CEO Georgia cities summer weather comparison (sunny days): https://augustaceo.com/news/2024/07/best-and-worst-georgia-cities-summer-weather/
- AAA Georgia and Columbus metro gas prices: https://gasprices.aaa.com/?state=GA
- Fort Moore / Army installation context: https://home.army.mil/moore/
- RTX Pratt & Whitney Columbus $200M expansion (2026-02-24): https://www.rtx.com/news/news-center/2026/02/24/rtxs-pratt-whitney-broadens-manufacturing-capabilities-with-200-million-inves
- Georgia.org Pratt & Whitney Columbus expansion release: https://georgia.org/press-releases/2026/rtxs-pratt-whitney-announces-new-200m-columbus-expansion-cuts-ribbon-prior-expansion
- Pratt & Whitney Columbus Engine Center page: https://www.rtx.com/en/prattwhitney/services/enginewise/maintenance/mro-map/2023/09/06/pw-columbus-engine-center
