# Warren, Pennsylvania — ingestion sources

Researched 2026-08-06. The row is city-specific unless marked as a state or county proxy. Unsupported fields are deliberately blank.

| Field(s) | Value used | Source / method |
| --- | --- | --- |
| Name, county, population, density | Warren, Warren County; 9,240; 3,174/sq mi | [Census Reporter ACS 2024 5-year profile](https://censusreporter.org/profiles/16000US4281000-warren-pa/) |
| Home value | $147,729 | [Zillow Home Values, Warren PA](https://www.zillow.com/home-values/41562/warren-pa/), ZHVI through 2026-06-30 |
| Cost-of-living index | 98 | [BEA/FRED Pennsylvania 2024 regional price parity](https://fred.stlouisfed.org/series/PARPPALL): 97.572, rounded to whole-number CSV field. State-level proxy because BEA does not publish a Warren-city RPP. |
| Governor, state party | Josh Shapiro; D | [Commonwealth Governor page](https://www.pa.gov/governor/about/governor-josh-shapiro). Party is the governor's party. |
| Sales and income tax | 6.00%; 3.07% | [PA Revenue business-tax form](https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforbusinesses/documents/rev-588.pdf) (state sales tax); [PA tax rates](https://www.pa.gov/agencies/revenue/resources/tax-rates) (2026 PIT). |
| 2016/2024 politics | Warren County proxy: Trump two-party share 70.81% (2016) and 69.84% (2024), rounded 71/70; -1.0 pp Republican / +1.0 pp Democratic | 2024: [Warren County official general-election results](https://warrencountypa.gov/DocumentCenter/View/2856/2024-General-Unofficial-Results), Trump 14,273 / Harris 6,164. 2016 county totals: Trump 12,477 / Clinton 5,145, cross-checked from the county table in [2016 PA election results](https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Pennsylvania). City precinct-only equivalent was not located, so `CityPolitics` explicitly identifies the county-level proxy. |
| VA access | Yes; Warren County VA Clinic; 0 miles | [VA official clinic page](https://www.va.gov/erie-health-care/locations/warren-county-va-clinic/), 3 Farm Colony Drive, Warren. Zero indicates an in-city clinic, not a measured routing distance. |
| Veterans benefits | concise qualified benefit summary | [PA Revenue retirement-income guide](https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/papersonalincometaxguide/documents/pitguide_grosscompensation.pdf); [DMVA real-estate exemption](https://www.pa.gov/agencies/dmva/pennsylvania-veterans/pa-vetconnect/state-veterans-programs/financial-assistance/retx); [PA Veterans employment](https://www.pa.gov/agencies/employment/veterans). |
| Marijuana | Medical | [Pennsylvania Department of Health Medical Marijuana Program](https://www.pa.gov/agencies/health/programs/medical-marijuana). |
| LGBTQ policy | 6.5/23; no city MEI | [MAP Pennsylvania Equality Profile](https://mapresearch.org/equality-profiles/pa/). Warren was not found in the HRC Municipal Equality Index, so no municipal score is asserted. |
| Climate | Humid continental; 67 in snow; 44 in precipitation; Jan low 17 F; July high 82 F | [Penn State State Climatologist Warren local climatological data](https://climate.met.psu.edu/data/city_information/lcds/wrr.php), 1926-1994 period of record. Annual rain/snow calculated from the monthly table and rounded. |
| Gas price | $4.16 | [AAA Pennsylvania gas prices](https://gasprices.aaa.com/?state=PA), state regular average observed 2026-08-06; state-level, time-sensitive proxy. |
| Description and tags | river, parks, nearby forest/recreation | [City of Warren parks](https://www.cityofwarrenpa.gov/parks); [VisitPA Warren](https://www.visitpa.com/listing/warren/303/). |

## Intentional gaps

- No current, source-comparable Warren city crime index/rating was located; `TCI` and `CrimeRating` are blank.
- No defensible annual sunny-day or summer-relative-humidity figure was located; those base-row fields are blank. NOAA monthly/hourly normal imports may enrich the related detail tables without inventing those values.
- No verified active defense-employer/base presence sufficient for a curated `DefenseHub` assertion was found; it remains unset for derived-field processing.
