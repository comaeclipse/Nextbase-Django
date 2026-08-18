# Fort Collins, CO Source Notes

Retrieved August 7, 2026. The row is for incorporated Fort Collins in Larimer County. Presidential fields use countywide official returns because a citywide presidential result was not used for this import.

## Field choices

- Geography: Census QuickFacts reports a July 1, 2025 population estimate of 171,500. The 2020 Census density is 2,968.1 people per square mile, stored as 2,968. Census place coordinates are used by the importer and map crosswalk.
- Housing and costs: Zillow reports a Fort Collins ZHVI typical home value of $569,102 through June 30, 2026. CostOfLivingData's 2023-ACS-vintage index is 158 (United States = 100); this is a documented third-party proxy, not an official price index. Fort Collins' combined sales-tax rate is 8.05% and Colorado's individual income-tax rate is 4.4%.
- Veteran access: VA lists the Fort Collins VA Clinic at 2509 Research Boulevard and its primary-care services. The CSV's one-mile clinic distance is a provisional centroid estimate; the post-import VHA VAST synchronization is authoritative for both outpatient and medical-center distances. Cheyenne VA Medical Center is the regional VA medical center.
- Veteran benefits: Colorado's published military and veteran benefits include military-retired-pay tax subtractions and a disabled-veteran/surviving-spouse property-tax exemption. The concise field preserves those categories without asserting individual eligibility.
- Politics: official Larimer County 2016 results were Clinton 93,113 and Trump 83,430; 2024 results were Harris 115,818 and Trump 77,108. Two-party Democratic share increased from 52.74% to 60.03% (+7.28 percentage points). The city-politics label retains the county geography qualifier.
- Climate: NOAA/NCEI 1991-2020 normals for Fort Collins station USC00053005 give 15.88 inches of annual precipitation, 51.4 inches of annual snowfall, an 18.3 F January normal low, and an 87.4 F July normal high. The product values are rounded to 16, 51, 18, and 87. Visit Fort Collins reports about 300 sunny days annually. The `humidity_summer` value is 45%, calculated from the June-August mean temperature and dew point in NOAA hourly normals for USW00024018 using the standard Magnus relative-humidity formula. That hourly station is 43.8 miles away, so the value is a regional summer proxy rather than a city-site reading.
- Crime and gas: `tci`, `crime`, and `gas_price` are intentionally blank pending a like-for-like current source; no unsourced index or transient price was substituted.
- Policy and inclusion: Colorado permits adult-use cannabis. HRC's 2025 Municipal Equality Index scorecard gives Fort Collins 100/100; MAP's 2026 Colorado policy profile is 45.5/49.
- Hubs and amenities: Colorado State University and Fort Collins' economic-development materials support `tech_hub=Y`. No defense-hub claim was sourced, so `DefenseHub` is left blank rather than inferred. City trail and cultural resources support the tags.

## Sources

- Census QuickFacts: https://www.census.gov/quickfacts/fact/table/fortcollinscitycolorado/POP060210
- Zillow Fort Collins home values: https://www.zillow.com/home-values/761873/fort-collins-co/
- Cost-of-living proxy: https://costoflivingdata.com/cost-of-living/co/fort-collins/
- City of Fort Collins 2025-26 adopted budget (sales-tax comparison): https://www.fcgov.com/citymanager/files/2025-26-adopted-budget-web-version.pdf
- Colorado individual income-tax guide: https://tax.colorado.gov/individual-income-tax-guide
- Fort Collins VA Clinic: https://www.va.gov/cheyenne-health-care/locations/fort-collins-va-clinic/
- Cheyenne VA Medical Center: https://www.va.gov/cheyenne-health-care/locations/cheyenne-va-medical-center/
- Colorado military and veterans benefits: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Colorado
- Larimer County 2016 official results: https://www.larimer.gov/sites/default/files/uploads/2017/2016_election_summary_report.pdf
- Larimer County 2024 official results: https://electionstats.larimer.gov/contest/4267
- NOAA/NCEI monthly normals, Fort Collins station USC00053005: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USC00053005&startDate=2020-01-01&endDate=2020-12-31&format=json&units=standard
- NOAA/NCEI hourly normals, station USW00024018: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-hourly-1991-2020&stations=USW00024018&startDate=2020-01-01&endDate=2020-12-31&format=json&units=standard
- Visit Fort Collins weather overview: https://www.visitftcollins.com/maps-info/weather/
- Colorado marijuana laws: https://cannabis.colorado.gov/legal-marijuana-use/laws-and-regulations
- HRC 2025 Municipal Equality Index: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Fort-Collins-Colorado.pdf
- MAP Colorado Equality Profile: https://mapresearch.org/equality-profiles/co/
- Fort Collins Economic Health: https://www.fcgov.com/economic-health/
- Fort Collins trails: https://www.fcgov.com/parks/trails
- Fort Collins cultural services: https://www.fcgov.com/culturalservices/
