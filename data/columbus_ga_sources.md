# Columbus, GA source notes

Retrieval date: 2026-08-07.

## Scope and method

- The row represents the consolidated City of Columbus / Muscogee County, Georgia. Census place population and land area are city-level (Columbus city). Presidential results use Muscogee County totals; because Columbus is a consolidated city-county, that geography matches the curated place for presidential contests.
- The active importer is `scripts/import-csv.ts`, which upserts the complete row by `(City, State)`. Its `DefenseHub` input is a human-curated value for `defense_hub_manual`; the derived `defense_hub` is recomputed after linking employer locations.

## Imported values and provenance

- **Population and density:** Census QuickFacts reports the 2020 Census population for Columbus city, Georgia as 206,922. The Census 2024 Georgia place Gazetteer reports 216.5 square miles of land area for Columbus city (GEOID 1319000). Density is `206922 / 216.5 = 955.76`, stored as `956`.
- **Housing:** Zillow's city-level, smoothed and seasonally adjusted all-homes mid-tier ZHVI CSV reports $177,244.22 for Columbus, GA at 2026-06-30. It is stored as `$177,244`; despite the legacy column name, ZHVI is a typical home value, not an average or median.
- **Taxes and cost:** Georgia DOR's July 1, 2026–September 30, 2026 general rate chart lists Muscogee (code 106) at a combined 9 percent sales tax. Georgia's current flat individual income-tax rate is 4.99 percent. Columbus State University's Butler Center C2ER-based affordability report cites a composite cost-of-living index of 87.1 for Columbus, rounded to `87` (`Low` under the product rule). The extractable PDF text does not pin the exact C2ER survey quarter; treat the index as a documented C2ER-derived composite rather than a self-pulled quarterly download.
- **VA and benefits:** Columbus hosts multiple VA outpatient sites under VA Central Alabama health care (including Robert S. Poydasheff VA Clinic at 6910 River Road and Columbus Downtown VA Clinic). The CSV initially recorded Poydasheff as local/`0 miles`. After import, `scripts/sync-va-facilities.ts` (VHA VAST ArcGIS layer, great-circle from Census place centroid) rewrote the live row to nearest outpatient `Columbus Downtown VA Clinic` at `6 miles` (`has_va=false` under the product's 0-mile local rule) and nearest hospital `Central Alabama VA Medical Center-Montgomery` at `80 miles`. The benefit summary follows the existing Georgia state-benefits record used for Savannah.
- **Elections and politics:** Muscogee County's official Enhanced Voting results for the November 5, 2024 general election report Harris 49,413 and Trump 30,616. Dave Leip's Atlas county page for Muscogee 2016 (sourced to Georgia Secretary of State Elections Division official results) reports Clinton 39,851 and Trump 26,976. Two-party Democratic shares are 59.633 percent in 2016 and 61.744 percent in 2024: Democratic +2.11 percentage points and Republican -2.11 points. The CSV rounds these to winner percents `60` / `62`, `2.1 pp more Democratic since 2016`, Democratic +2.1 pp, and Republican -2.1 pp. The 2024 two-party Democratic share falls in the product's `Liberal` band; because Columbus/Muscogee is consolidated, the label is stored without a county-level qualifier.
- **Safety:** Left blank. Local CPD press materials describe 2024–2025 Part I declines, and secondary aggregators cite FBI UCR 2024 violent totals, but a clean primary FBI/CPD annual violent-crime count suitable for the repository TCI method was not verified in this ingest. Do not invent `tci` / `crime`.
- **Cannabis and LGBTQ:** Georgia is treated as `Medical` under the product's medical-only convention. HRC's 2025 Municipal Equality Index scorecard for Columbus, GA sums to 49/100 (also reported as 49 by the Columbus Ledger-Enquirer). MAP's current Georgia profile gives an overall state policy score of -0.75/49.
- **Climate:** NOAA 1991-2020 normals from Columbus Metropolitan Airport (USW00093842) provide 48.82 inches annual precipitation, 0.50 inches annual snowfall, January normal low 38.2 F, and July normal high 92.9 F. Rounded row values are rain 49, snow 1, low 38, high 93. Timeanddate's Columbus Metropolitan Airport climate table (CustomWeather, 1992–2021) reports July humidity 67 percent. `sun_days` remains blank because a comparable annual sunny-days measure was not located. The documented values classify as `hot_humid` under the repository rule (summer high at least 88 and humidity at least 60).
- **Gas:** AAA's Columbus (GA only) metro regular-gas average was $3.7771 on 2026-08-07, stored as `$3.78`.
- **Lifestyle and defense:** Fort Moore (formerly Fort Benning) anchors the local military economy; `DefenseHub=Y` is a researched manual classification for that installation adjacency, not a claim that the RTX employer-site feed is complete. `TechHub=N` because no source meeting the product's city-level technology-employment standard was located. Tags reflect military presence, VA/healthcare access, Chattahoochee River recreation, golf, and downtown arts/culture (including the Springer Opera House district).

## Known gaps

- `tci` / `crime`: no verified primary violent-crime annual suitable for the FBI-indexed TCI method in this pass.
- `sun_days`: no sourced annual sunny-days figure.
- C2ER COL index quarter/vintage not pinned beyond the Butler Center citation of composite 87.1.
- Direct Clarity Elections 2016 detail XML download returned HTTP 403 during retrieval; 2016 totals are taken from Dave Leip's Atlas, which cites Georgia SOS official results and links an official Muscogee summary report dated 2016-11-15.
- Census ACS API required a key and was not used; population uses QuickFacts 2020 Census count.
- Live VA distance fields come from `scripts/sync-va-facilities.ts` centroid math, not street-address locality; clinics inside city limits can still report non-zero miles and `has_va=false`.

## Source URLs

- Census QuickFacts Columbus city, Georgia: https://www.census.gov/quickfacts/fact/table/columbuscitygeorgia/POP010220
- Census 2024 Georgia place Gazetteer: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_13.txt
- Zillow Research city ZHVI download: https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv
- Georgia DOR sales-tax rate chart, effective July 1, 2026: https://dor.georgia.gov/document/document/general-rate-chart-effective-july-1-2026-through-september-30-2026pdf/download
- Georgia DOR important tax updates: https://dor.georgia.gov/taxes/important-tax-updates
- Columbus State University Butler Center COL report: https://www.columbusstate.edu/turner/butler-center/_docs/cost-of-living-index-research-report.pdf
- Robert S. Poydasheff VA Clinic: https://www.va.gov/central-alabama-health-care/locations/robert-s-poydasheff-va-clinic/
- VA Central Alabama locations: https://www.va.gov/central-alabama-health-care/locations/
- Georgia DOR retirement and military-retirement exclusions: https://dor.georgia.gov/retirement-income-exclusion
- Georgia Department of Veterans Service benefits: https://veterans.georgia.gov/disabled-veteran-homestead-tax-exemption
- Muscogee County official 2024 Enhanced Voting results: https://app.enhancedvoting.com/results/public/muscogee-county-ga/elections/2024NovGen
- Dave Leip Atlas Muscogee 2016 (cites Georgia SOS): https://uselectionatlas.org/RESULTS/statesub.php?year=2016&fips=13215&f=0&off=0&elect=0
- HRC Municipalities Columbus, GA MEI page: https://www.hrc.org/resources/municipalities/columbus-ga
- Ledger-Enquirer MEI 49 report: https://www.ledger-enquirer.com/news/politics-government/article314431115.html
- Movement Advancement Project Georgia profile: https://www.mapresearch.org/equality-profiles/ga
- NOAA annual/seasonal normals, USW00093842: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00093842&format=json&units=standard&includeAttributes=false
- NOAA monthly normals, USW00093842: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00093842&format=json&units=standard&includeAttributes=false
- Timeanddate Columbus climate humidity proxy: https://www.timeanddate.com/weather/usa/columbus-ga/climate
- AAA Georgia and Columbus metro gas prices: https://gasprices.aaa.com/?state=GA
- Fort Moore / Army installation context: https://home.army.mil/moore/
