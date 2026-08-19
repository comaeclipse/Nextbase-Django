# Fort Stockton, TX Source Notes

Retrieval date: 2026-08-07.

## Geography and source choices

- Primary geography: incorporated City of Fort Stockton, Pecos County, Texas (Census place GEOID 4826808).
- Population, density, sales tax, outpatient VA access, and housing are city-level where available.
- Presidential fields use official Pecos County returns, not a city-boundary precinct aggregation. `CityPolitics` is therefore explicitly qualified as county-level.
- `LGBTQ_MEI` is stored as `Not Rated` in the CSV and remains `NULL` in the numeric database column. Fort Stockton is not an HRC-rated 2025 MEI municipality; this is not equivalent to a zero score.
- `DefenseHub=Y` is a manual curation input only. The importer writes it to `defense_hub_manual`, and `scripts/recompute-defense-hub.ts` derives the stored `defense_hub` value.

## Imported values and method

- Population and density: Census QuickFacts reports a July 1, 2025 population estimate of 8,027 and 2020 density of 1,526 people per square mile. Stored as 8,027 and 1,526.
- Housing: Zillow lists Fort Stockton's ZHVI / typical home value at $177,197, data through 2026-06-30. The model field is named `avg_home_value`, but this is Zillow's index, not an average or median.
- Cost and taxes: HomeSnacks' modeled cost-of-living index is 90 on a U.S.=100 basis. This is a weak secondary proxy, not an official price index. The Texas Comptroller July 2026 city-rate file supports an 8.25 percent combined Fort Stockton sales-tax rate. Texas has no state individual income tax.
- VA and veterans benefits: VA lists the Fort Stockton VA Clinic in town, so `VA=Yes`, `NearestVA=Fort Stockton VA Clinic`, and `DistanceToVA=0 miles`. The nearest VA medical center named in research is George H. O'Brien Jr. Department of Veterans Affairs Medical Center in Big Spring, but hospital distance is left to the repository VA facility sync rather than hand-entered.
- Elections: Texas Secretary of State 2016 Pecos County returns list Trump 2,468 and Clinton 1,554. Pecos County's official 2024 canvass lists Trump 3,042 and Harris 1,144. Two-party Republican share moved from 61.36% to 72.67%, so `rep_vote_share_change_pp = 11.31`, `dem_vote_share_change_pp = -11.31`, and `election_change = 11.3 pp more Republican since 2016`.
- Crime: FBI UCR-derived 2024 reporting shows 13 violent crimes and a violent-crime rate of 162.5 per 100,000. Indexed against a 2024 U.S. violent-crime rate of 359.0 per 100,000, the project TCI calculation is `(162.5 / 359.0) * 100 = 45.26`, rounded to `TCI=45`. Stored `CrimeRating=Low` because the violent-crime burden is less than half the U.S. rate.
- LGBTQ: MAP gives Texas an overall policy score of -6.75/49 and classifies it as Negative. MAP's Texas local-ordinance table lists municipalities with local private-employment nondiscrimination protections and does not list Fort Stockton. Stored `LGBTQ=Negative / No Local Protections Identified`, with `LGBTQStatePolicyScore=-6.75` kept separate from the city-level local-protection note.
- LGBTQ MEI: HRC's 2025 Municipal Equality Index does not rate Fort Stockton. The CSV records `LGBTQ_MEI=Not Rated`; the live numeric `lgbtq_mei_score` column remains null to avoid falsely implying an HRC score of zero.
- Climate: NWS/NOAA Fort Stockton Airport normals report annual snowfall of 1.0 inch, annual precipitation of 15.15 inches, January average minimum of 33.2 F, and July average maximum of 94.3 F. Stored as 1, 15, 33, and 94. The secondary sunny-days estimate is 263 and the secondary July relative-humidity proxy is 46. These annual fields fall in the repository's `hot_dry` climate category.
- Economy and lifestyle: `TechHub=N`. BLS maps Pecos County to the Northwestern Region of Texas nonmetropolitan area, and the reviewed labor-market evidence supports oil/gas and regional-service functions rather than a diversified technology employment hub. Proposed data-center activity is not treated as current tech-hub employment infrastructure.
- Defense hub: `DefenseHub=Y` because Nine Mile Training Center immediately south of Fort Stockton is active defense testing/training infrastructure. Air Force reporting describes the site as one of the largest private armed-forces training centers in the country, documents MQ-9 Reaper dirt-landing testing/training there, and identifies Air Force Reserve / Air Force Special Operations participation. Nine Mile also lists USAF-surveyed drop zones, an 8,000-foot USAF-surveyed paved landing zone, field landing strips, and live-fire/CAS ranges. This manual judgment is written to `defense_hub_manual=true`; `defense_hub` is derived by recompute.
- Gas: AAA Texas statewide regular-gas average was used as a statewide proxy, stored as `$3.60`; it is not Fort Stockton-specific.

## Source URLs

- Census QuickFacts, Fort Stockton: https://www.census.gov/quickfacts/fact/table/fortstocktoncitytexas/AGE295224
- Zillow Fort Stockton ZHVI: https://www.zillow.com/home-values/52078/fort-stockton-tx/
- Texas Comptroller July 2026 city sales/use-tax rates: https://comptroller.texas.gov/taxes/sales/docs/city-rates.pdf
- Texas Comptroller, Texas has no individual income tax: https://comptroller.texas.gov/economy/fiscal-notes/archive/2016/february/starting.php
- HomeSnacks cost of living proxy: https://www.homesnacks.com/tx/fort-stockton-cost-of-living/
- AAA Texas gas prices: https://gasprices.aaa.com/?state=TX
- Fort Stockton VA Clinic: https://www.va.gov/west-texas-health-care/locations/fort-stockton-va-clinic/
- George H. O'Brien Jr. Department of Veterans Affairs Medical Center: https://www.va.gov/west-texas-health-care/locations/george-h-obrien-jr-department-of-veterans-affairs-medical-center/
- Texas Veterans Commission, Hazlewood Act: https://tvc.texas.gov/education/hazlewood/
- Texas Veterans Commission, property tax exemptions: https://tvc.texas.gov/financial-assistance/property-tax-exemptions/
- NWS/NOAA Fort Stockton Airport climate normals: https://www.weather.gov/maf/cli_maf_wban_ftstocktonairport
- BestPlaces Fort Stockton climate: https://www.bestplaces.net/climate/city/texas/fort_stockton
- Timeanddate Fort Stockton climate proxy: https://www.timeanddate.com/weather/@5521746/climate
- Texas Secretary of State 2016 presidential results: https://elections.sos.state.tx.us/elchist319_race62.htm
- Pecos County 2024 official results: https://www.co.pecos.tx.us/wp-content/uploads/2024/11/Official-Results-20241105.pdf
- MAP Texas Equality Profile: https://mapresearch.org/equality-profiles/tx/
- HRC Municipal Equality Index 2025: https://www.hrc.org/resources/municipal-equality-index
- HomeSnacks Fort Stockton crime summary using FBI data: https://www.homesnacks.com/tx/fort-stockton-crime/
- FBI Crime Data Explorer: https://cde.ucr.cjis.gov/
- BLS Texas county links to metropolitan and nonmetropolitan areas: https://www.bls.gov/OES/current/tx_counties.htm
- BLS OEWS metropolitan and nonmetropolitan area estimates: https://www.bls.gov/oes/current/oessrcma.htm
- Nine Mile Training Center capabilities: https://www.9mtc.com/train
- U.S. Air Force MQ-9 dirt landing article: https://www.af.mil/News/Article-Display/Article/3433556/mq-9-reaper-completes-first-mission-using-dirt-landing-zone/
- Air Force Reserve MQ-9 dirt landing feature: https://www.afrc.af.mil/News/Features/Display/Article/3481312/reserve-active-duty-team-up-for-first-mq-9-dirt-landing/
- Fort Stockton Economic Development: https://www.pbrpc.org/departments/regional-services/economic-development/member-economic-development-corporations/p/item/21026/fort-stockton-economic-development
- Visit Fort Stockton: https://visitfortstockton.com/
