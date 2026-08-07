# Oklahoma City, Oklahoma — ingestion sources

Researched 2026-08-06. The location represents Oklahoma City proper except where noted. Unsupported fields are deliberately blank.

| Field(s) | Value used | Source / method |
| --- | --- | --- |
| Name, county, population, density | Oklahoma City, Oklahoma County; 713,014; 1,176/sq mi | [Census Reporter ACS 2024 one-year profile](https://censusreporter.org/profiles/16000US4055000-oklahoma-city-ok/). Oklahoma City spans multiple counties; the city is principally in Oklahoma County, which is used for the election proxy. |
| Home value | $209,490 | [Zillow Home Values, Oklahoma City](https://www.zillow.com/home-values/33225/okc-ok/), ZHVI through 2026-06-30. |
| Cost-of-living index | 91 | [BEA/FRED Oklahoma City MSA 2024 regional price parity](https://fred.stlouisfed.org/series/RPPALL36420): 91.0. Metro-level RPP proxy, not a city-proper index. |
| Governor, state party | Kevin Stitt; R | [Oklahoma Governor's office](https://oklahoma.gov/governor/about.html). Party is the governor's party. |
| Sales and income tax | 8.625%; 4.50% | [OKC FY2026 adopted budget](https://www.okc.gov/files/assets/city/v/1/finance/documents/budget/fy26/fy26-adopted-budget.pdf) (corporate-city-limits sales rate); [Oklahoma Tax Commission 2025 legislative update](https://oklahoma.gov/content/dam/ok/en/tax/documents/resources/publications/legislation/2025LegislativeUpdate.pdf) (2026 top individual rate). |
| 2016/2024 politics | Oklahoma County proxy: Trump 51.69% vs Clinton 41.17% in 2016; Trump 143,618 vs Harris 138,769 in 2024. Two-party Trump share 55.66% -> 50.85%, stored 56/51 and -4.8/+4.8 pp. | [Official Oklahoma State Election Board 2016 results](https://oklahoma.gov/elections/elections-results/election-results/2016-election-results/2016-november-general-election.html) and [official 2024 results page](https://oklahoma.gov/elections/elections-results/election-results/2024-election-results/november-general-election.html), whose downloadable exports provide county/precinct data; the 2024 county total is cross-checked by [Civic Result Maps](https://civicresultmaps.org/?state=OK). City precinct aggregation was not performed, so `CityPolitics` explicitly identifies the county-level proxy. |
| VA access | Yes; Oklahoma City VA Medical Center; 0 miles | [VA official medical-center page](https://www.va.gov/oklahoma-city-health-care/locations/oklahoma-city-va-medical-center/), 921 NE 13th Street. Zero indicates an in-city facility, not a measured route. |
| Veterans benefits | concise qualified benefit summary | [Oklahoma Department of Veterans Affairs benefits](https://www.oklahoma.gov/veterans/benefits.html) and [Oklahoma Tax Commission exemptions](https://oklahoma.gov/tax/individuals/exemptions.html). |
| Marijuana | Medical | [Oklahoma Medical Marijuana Authority patient licenses](https://www.oklahoma.gov/omma/patients-caregivers/patient-licenses.html). No recreational status is asserted. |
| LGBTQ | HRC MEI 75/100; MAP state policy 1.5/23 | [HRC 2025 Oklahoma City scorecard](https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Oklahoma-City-Oklahoma.pdf); [MAP Oklahoma Equality Profile](https://mapresearch.org/equality-profiles/OK/). |
| Climate | Humid subtropical; 9 in snow; 36 in precipitation; Jan low 26 F; July high 93 F | [Oklahoma Mesonet/Climatological Survey Oklahoma City Rogers station summary](https://content.mesonet.org/ocs/county_climate/Products/coop_summaries/OK6661_stnsum.html). Values are rounded station normals; precipitation source table gives 35.63 in and snowfall 8.6 in. |
| Gas price | $3.55 | [AAA Oklahoma City metro prices](https://gasprices.aaa.com/?state=OK), regular average $3.5506 observed 2026-08-06. Time-sensitive. |
| Description/tags | trails, river/canal, recreation | [City of OKC trails](https://www.okc.gov/visitors/trails) and [Bricktown Canal](https://www.okc.gov/government/maps-3/maps-history/original-maps/bricktown-canal). |
| Defense-employer linkage | Derived after import; no manual defense assertion | Existing source-backed files [`data/l3harris_job_locations.csv`](./l3harris_job_locations.csv) and [`data/rtx_pratt-whitney_job_locations.csv`](./rtx_pratt-whitney_job_locations.csv) contain Oklahoma City physical-site records. The live linkage/recompute workflow is the authority for the resulting flag. |

## Intentional gaps

- No comparable, source-verified Total Crime Index/rating was identified; `TCI` and `CrimeRating` are blank. Oklahoma SIBRS and the OKCPD annual report provide raw data but not the product's normalized cross-city index.
- No defensible annual sunny-day or July relative-humidity value was located; base-row `SunnyDays` and `HumiditySummer` are blank. NOAA detail-table imports preserve station-based normal data separately.
- `TechHub` is left unknown rather than asserting a broad hub classification without a dedicated source.
