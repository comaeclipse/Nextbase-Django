# Savannah, GA source notes

Retrieval date: 2026-07-16.

## Scope and method

- The row represents the incorporated City of Savannah in Chatham County. Population and density are city-level. Presidential results are Chatham County totals because a defensible city-boundary/precinct aggregation was not available in this ingest; `city_politics` is explicitly qualified accordingly.
- The active importer is `scripts/import-csv.ts`, which upserts the complete row by `(City, State)`. Its `DefenseHub` input is a human-curated value for `defense_hub_manual`; the derived `defense_hub` is recomputed after linking employer locations.

## Imported values and provenance

- **Population and density:** Census QuickFacts reports the 2020 Census population as 147,780. The Census 2024 Gazetteer reports 109.443 square miles of land area. This produces 1,350.3 people per square mile, stored as `1350`.
- **Housing:** Zillow's city-level, smoothed and seasonally adjusted all-homes mid-tier ZHVI CSV reports $326,616.28 for Savannah at 2026-06-30. It is stored as `$326,616`; despite the legacy column name, ZHVI is a typical home value, not an average or median.
- **Taxes and cost:** Georgia DOR's July 2026 rate chart lists Chatham County at 7 percent sales tax. Georgia's current flat individual income-tax rate is 4.99 percent. The Savannah Economic Development Authority reports a C2ER Q1 2026 cost-of-living index of 90.9, rounded to 91 (`Low` under the product rule).
- **VA and benefits:** The Savannah VA Clinic at 1170 Shawnee Street offers outpatient primary and specialty care, so city access is stored as `Yes` and `0 miles`. The benefit summary follows the existing Georgia state-benefits record, cross-checked against Georgia DOR and Georgia Department of Veterans Service pages.
- **Elections and politics:** Chatham County's official 2016 summary reports Clinton 62,290 and Trump 45,688. Its official 2024 summary reports Harris 82,758 and Trump 57,336. Two-party Democratic shares are 57.696 percent in 2016 and 59.076 percent in 2024: Democratic +1.38 percentage points and Republican -1.38 points. The CSV rounds these to `1.4 pp more Democratic since 2016`, Democratic +1.4 pp, and Republican -1.4 pp. The 2024 two-party Democratic share falls in the product's `Liberal` band.
- **Safety:** Savannah Police's 2024 annual report gives 984 total violent Part I crimes. Dividing by the 2020 city population gives 665.9 violent crimes per 100,000. The repository's transparent TCI method divides that by the FBI's 2024 national violent-crime rate of 359.1 per 100,000 and multiplies by 100: 185.4, stored as `185`. `High` is the descriptive rating; the report notes its figures are preliminary and UCR-based.
- **Cannabis and LGBTQ:** Georgia is treated as `Medical` under the product's medical-only convention. HRC's 2025 Municipal Equality Index scorecard gives Savannah 80/100, stored in both the display and numeric MEI fields. MAP's current Georgia profile gives an overall state policy score of -0.75/49.
- **Climate:** NOAA 1991-2020 normals from Savannah/Hilton Head International Airport (USW00003822) provide 48.12 inches annual precipitation, 0.00 inches annual snowfall, January normal low 40.0 F, and July normal high 92.3 F. SEDA reports 224 annual sunny days. Timeanddate's nearby Hunter Army Airfield series reports 77 percent July humidity. Rounded row values are rain 48, snow 0, low 40, high 92, humidity 77; the climate category is `hot_humid` under the repository rule.
- **Gas:** AAA's Savannah metro regular-gas average was $3.856 on 2026-07-16, stored as `$3.86`.
- **Lifestyle, healthcare, and defense:** SEDA documents Savannah's historic district, art galleries, squares, dining, festivals, beach access, two major medical centers, and regional advanced healthcare role. The `DefenseHub=Y` value is a researched manual classification based on the city-hosted Hunter Army Airfield; it is not a claim that an employer-site feed is complete. `TechHub=N` because no source meeting the product's city-level technology-employment standard was located.

## Source URLs

- Census QuickFacts: https://www.census.gov/quickfacts/fact/table/savannahcitygeorgia/POP060220
- Census 2024 Georgia place Gazetteer: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_13.txt
- Zillow Research city ZHVI download: https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv
- Georgia DOR sales-tax rate chart, effective July 1, 2026: https://dor.georgia.gov/document/document/general-rate-chart-effective-july-1-2026-through-september-30-2026pdf/download
- Georgia DOR important tax updates: https://dor.georgia.gov/taxes/important-tax-updates
- Savannah Economic Development Authority quality of life / C2ER: https://seda.org/resources-and-data/data-center/quality-of-life/
- Savannah VA Clinic: https://www.va.gov/charleston-health-care/locations/savannah-va-clinic/
- Georgia DOR retirement and military-retirement exclusions: https://dor.georgia.gov/retirement-income-exclusion
- Georgia Department of Veterans Service benefits: https://veterans.georgia.gov/disabled-veteran-homestead-tax-exemption
- Chatham County 2016 official election summary: https://cccdn.blob.core.windows.net/cdn/Files/Elections/Election%20Archive/2016/November%208/summary.pdf
- Chatham County 2024 official election summary: https://cdn.chathamcountyga.gov/Files/Elections/Election%20Archive/2024/November%2005%2C%202024%20SummaryRPT.pdf
- Savannah Police 2024 annual crime report: https://savannahpd.org/wp-content/uploads/2025/02/SPD-2024-FINAL-Crime-Stats-2.pdf
- FBI 2024 UCR national summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- HRC 2025 Savannah MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Savannah-Georgia.pdf
- Movement Advancement Project Georgia profile: https://mapresearch.org/equality-profiles/ga
- NOAA annual/seasonal normals, USW00003822: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00003822&format=json&units=standard&includeAttributes=false
- NOAA monthly normals, USW00003822: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00003822&format=json&units=standard&includeAttributes=false
- Savannah climate humidity proxy: https://www.timeanddate.com/weather/usa/savannah/climate
- AAA Georgia and Savannah metro gas prices: https://gasprices.aaa.com/?state=GA
- Hunter Army Airfield: https://home.army.mil/stewart/about/Garrison/Hunter-Army-Airfield
