# Bangor, ME Source Notes

- Retrieval workflow: `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` was reviewed. This is a city/place record for Bangor, not the Bangor MSA. The CSV uses the active TypeScript/Neon importer and does not include a `pace:*` tag.
- Geography and demographics: Census Reporter’s ACS 2024 five-year Bangor profile reports 31,938 people, 34.3 square miles, and 932.2 people per square mile; population is stored with commas and density is rounded to 932.
- State government and taxes: Maine Governor Janet Mills is the current governor; the existing product convention stores her party as `D` in both `StateParty` and `Governor`. Maine Revenue Services documents a 5.5% general sales tax and individual-income tax rates from 5.8% to 7.15%; the top marginal rate is stored. The veterans-benefits summary is supported by Maine Revenue Services’ military-pension exemption and the Maine veterans resource guide.
- Cost and housing: the 2024 BEA Regional Price Parities all-items value for the Bangor MSA is 96.508 (FRED series `RPPALL12620`), rounded to 97. This is a metro-level cost proxy paired with a city-level record and is documented as such. Zillow reports Bangor’s typical home value (ZHVI) as $295,453, updated June 30, 2026.
- Elections and local politics: Maine Secretary of State’s official town files were parsed using the Democratic and Republican presidential votes only, consistently across years. Bangor cast 8,155 Clinton and 6,001 Trump votes in 2016 (57.61% Democratic two-party share); in 2024 it cast 9,332 Harris and 6,212 Trump votes (60.04% Democratic). Republican share therefore fell 2.42 percentage points and Democratic share rose 2.42 points, stored as `-2.4` and `2.4`; the 2024 city-level Democratic share supports `Liberal` under the project’s 55–64.9% threshold.
- VA and veterans: the official Bangor VA Clinic page identifies an outpatient clinic at 35 State Hospital Drive in Bangor, so `VA=Yes` and distance is `0 miles`. The Maine income-tax FAQ says military retirement-plan and survivor benefits are fully exempt from Maine income tax; the state resource guide covers the broader benefits summary.
- Crime: the Maine State Police 2024 NIBRS report’s Bangor PD overview uses a 31,598 population estimate and lists 5 murders, 2 kidnappings, 7 rapes, 23 aggravated assaults, and 16 robberies. This is 53 violent offenses, or 167.7 per 100,000. Applying the repository’s transparent crime index method against the FBI 2024 national violent-crime rate of 359.1 per 100,000 gives 46.7, rounded to `TCI=47`; the public label is `Moderate`. NIBRS offense categories are not a perfect bridge to legacy summary-UCR categories, so this should be treated as a documented 2024 proxy rather than a direct historical comparison.
- Cannabis and LGBTQ: Maine’s Office of Cannabis Policy operates an adult-use program, so cannabis is stored as `Recreational`. HRC’s 2025 Bangor MEI scorecard reports 78/100. MAP’s current Maine Equality Profile reports 44.5/49, stored as the state-policy score.
- Defense, economy, and tags: the official 101st Air Refueling Wing site identifies Bangor Air National Guard Base as its home, so the curated `DefenseHub=Y` is a military-installation determination. No evidence was found for a broad technology-hub classification, so `TechHub=N`. Bangor’s official Waterfront page documents the riverwalk and Maine Savings Amphitheater; tags are limited to the existing filter vocabulary.
- Climate and gas: NOAA/NCEI’s Bangor 2023 Local Climatological Data narrative reports rainfall just over 40 inches and snowfall about 66 inches, while Current Results’ long-term Bangor snowfall table reports 74.6 inches; the row rounds the latter to 75. Timeanddate (Bangor International Airport, 1992–2021 observations) reports 40.79 inches annual precipitation, January low 9 F, July high 80 F, and July humidity 70%; rain is stored as 41. Bangor’s Community Connector electrification plan uses 177 annual sunny days in its solar sizing analysis, so `SunnyDays=177` is a city-document planning estimate rather than a NOAA standardized annual normal. AAA’s Bangor metro regular average was $4.1256 on August 6, 2026, stored as `$4.13`.
- Detailed weather layers: 12 monthly 1991–2020 NCEI normals were imported from Bangor International Airport (`USW00014606`), 2.6 miles from the city coordinate. The closest station with NCEI hourly moisture normals was `USW00014605`, 60.8 miles away; its 288 month-hour dew-point/heat-index rows were imported with that distance preserved in each row. Those moisture values are usable regional-air-mass context but should not be presented as station-local Bangor measurements.

## URLs

- Census Reporter Bangor profile: https://censusreporter.org/profiles/97000US2302820-bangor-me/
- Maine Governor Janet Mills: https://www.maine.gov/governor/mills/about
- Maine sales/use tax rates: https://www.maine.gov/revenue/taxes/sales-use-service-provider-tax/rates-due-dates
- Maine individual income tax: https://www1.maine.gov/revenue/taxes/income-estate-tax/individual-income-tax-1040me
- Maine income-tax FAQ (military retirement exemption): https://www11.maine.gov/revenue/faq/individual-income-tax
- Maine veterans resource guide: https://www.maine.gov/veterans/sites/maine.gov.veterans/files/Resourceguide.pdf
- BEA Regional Price Parities, Bangor MSA (FRED): https://fred.stlouisfed.org/series/RPPALL12620
- Zillow Bangor home values: https://www.zillow.com/home-values/165846/bangor-me/
- Maine SOS 2024 results and President by County/Town workbook: https://www.maine.gov/sos/elections-voting/election-results-data/election-results-2024
- Maine SOS 2024 president workbook: https://www.maine.gov/sos/sites/maine.gov.sos/files/inline-files/President%20and%20Vice%20President%20FINAL-Corrected%2020241205.xlsx
- Maine SOS 2016 president workbook: https://www.maine.gov/sos/sites/maine.gov.sos/files/content/assets/president.xlsx
- Bangor VA Clinic: https://www.va.gov/maine-health-care/locations/bangor-va-clinic/
- Maine State Police Crime in Maine 2024: https://www.maine.gov/dps/msp/about/maine-crime/2024
- FBI 2024 reported-crime release: https://www.fbi.gov/news/press-releases/fbi-releases-2024-reported-crimes-in-the-nation-statistics
- Maine Office of Cannabis Policy adult-use program: https://www.maine.gov/dafs/ocp/adult-use
- HRC 2025 Bangor MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Bangor-Maine.pdf
- MAP Maine Equality Profile: https://mapresearch.org/equality-profiles/me/
- 101st Air Refueling Wing: https://www.101arw.ang.af.mil/
- City of Bangor Waterfront: https://www.bangormaine.gov/715/Waterfront
- NOAA/NCEI Bangor LCD annual summary: https://www.ncei.noaa.gov/pub/access/cebrequests/2023lcdannual/01202313BGR.pdf
- Current Results Bangor snowfall: https://www.currentresults.com/Weather/Maine/annual-snowfall.php
- Timeanddate Bangor climate: https://www.timeanddate.com/weather/usa/bangor/climate
- City of Bangor Community Connector electrification plan: https://bangormaine.gov/DocumentCenter/View/535/CC---Electrification-Plan-2023-PDF
- AAA Maine gas prices: https://gasprices.aaa.com/?state=ME
