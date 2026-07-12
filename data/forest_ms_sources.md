# Forest, MS Source Notes

- Retrieval guide: `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` was reviewed for the active TS/Neon import path, source priority, one-city scoped `climate_category` update guidance, and the current defense-employer workflow.
- Current DB baseline before import: Forest, MS was not present in `locations_location`. Baseline coverage was 81 locations, 50 `locations_stateinfo` rows, 60 missing tags, 60 missing TCI, 51 missing descriptions, 54 missing VA-access fields, and 58 missing election trend fields. A matching `defense_employer_locations` row already existed for Raytheon in Forest, MS with 9 onsite postings, 2 hybrid postings, and `location_id = NULL`.
- Geography and demographics: Census Reporter reports Forest, MS at 5,357 population, 13.1 square miles, and 409.6 people per square mile from ACS 2024 5-year data. Density is rounded to 410.
- Current state-party convention: the row follows the existing product convention of using current governor party for `state_party` and `governor`; Mississippi's official governor site identifies Tate Reeves as governor, and current public office references identify him as Republican, so both fields are `R`.
- Elections: Mississippi Secretary of State official result pages were used for the 2024 statewide recap CSV and 2016 statewide recap PDF. Forest city-level precinct aggregation was not available in a clean, verified form, so Scott County totals are used and the political label is explicitly county-level. 2016 Scott County was Trump 6,122 and Clinton 4,268, giving Trump 58.92 percent of the two-party vote, stored as 59. 2024 Scott County was Trump 6,098 and Harris 3,729, giving Trump 62.05 percent, stored as 62. Republican two-party share increased 3.13 percentage points, so `rep_vote_share_change_pp = 3.1` and `dem_vote_share_change_pp = -3.1`. The 2024 Republican share is in the 55-64.9 percent band, so `city_politics` is `County-level: Conservative`.
- Taxes: Mississippi Department of Revenue lists the regular retail sales tax rate as 7 percent. Tax Foundation's 2026 Mississippi profile lists a flat 4.00 percent individual income tax rate on income above $10,000.
- Cost and housing: BestPlaces reports Forest's cost-of-living score as 71.5, rounded to `CostOfLiving=72`. Zillow's Forest ZHVI page reports a typical home value of $127,178, updated May 31, 2026.
- VA access and veteran benefits: VA Jackson lists G.V. (Sonny) Montgomery VA Medical Center at 1500 East Woodrow Wilson Avenue in Jackson. A public VA-services distance listing for postal code 39074 places it about 41.22 miles from Forest, stored as `41 miles`. Mississippi Veterans Affairs documents disabled-veteran ad valorem tax relief; the existing state benefits file and state benefit sources document military retired-pay tax exemption, employment, education, vehicle-tag, hunting, and fishing benefits.
- Crime: AreaVibes and Niche both support a Forest violent-crime proxy of about 707 per 100,000 residents. Using the repo's open TCI method against the FBI 2024 national violent-crime rate of 359.1 per 100,000 gives 707 / 359.1 * 100 = 196.9, rounded to 197. The public label is `High`.
- Cannabis: Mississippi has a medical cannabis program, but recreational marijuana remains illegal; matching existing app conventions for medical-only states, the row stores `Medical`.
- LGBTQ: MAP's Mississippi Equality Profile reports Sexual Orientation Policy Score -1/23, Gender Identity Policy Score -7.5/26, and Overall Score -8.5/49. No current HRC Municipal Equality Index score for Forest was found, so `LGBTQ_MEI` is intentionally blank rather than inferred.
- Economy and defense hub: RTX Careers says Raytheon's Forest facility has more than 445,000 square feet of manufacturing space and more than 1,000 employees supporting radar, jammer, and RF technology products. Mississippi Development Authority reports a $50 million expansion supporting critical military programs at the Forest facility. Per the current defense-hub logic, the CSV `DefenseHub` column is intentionally blank so `defense_hub_manual` remains `NULL`; `defense_hub` should be derived by employer presence after running the employer-location linker and `scripts/recompute-defense-hub.ts`. The matching live employer row is `raytheon`, Forest, MS, with 9 onsite and 2 hybrid postings, which is above the current threshold of 1 onsite+hybrid opening.
- Climate: BestPlaces reports Forest gets 59 inches of rain, 0 inches of snow, and 220 sunny days per year. WeatherSpark reports July as the hottest month with an average high of 90 F and January as the coldest month with an average low of 37 F. Timeanddate regional climate data for central Mississippi reports July humidity in the mid-70s; 75 percent is stored as the summer-humidity proxy. The display climate is `Humid subtropical`; the app `climate_category` should be `hot_humid` because summer high is at least 85 F and summer humidity is at least 60 percent.
- Gas: AAA Fuel Prices reported Mississippi regular gasoline at $3.448 on July 11, 2026, rounded to `$3.45`.

## URLs

- Census Reporter Forest profile: https://censusreporter.org/profiles/16000US2825340-forest-ms/
- Mississippi Governor official site: https://governorreeves.ms.gov/
- Ballotpedia Tate Reeves party cross-check: https://ballotpedia.org/Tate_Reeves
- Mississippi SOS 2024 results page: https://www.sos.ms.gov/elections-voting/election-results/2024/2024-general-election-results
- Mississippi SOS 2024 statewide recap CSV: https://www.sos.ms.gov/elections/electionresults/2024ElectionRecapSheets.csv
- Mississippi SOS 2016 results page: https://www.sos.ms.gov/elections-voting/election-results/2016/2016-general-election
- Mississippi SOS 2016 statewide recap PDF: http://www.sos.ms.gov/elections/electionresults/2016%20GE%20Statewide%20Recap%20Report.pdf
- Mississippi sales tax rates: https://www.dor.ms.gov/business/sales-use-tax/sales-tax-rates
- Tax Foundation Mississippi profile: https://taxfoundation.org/location/mississippi/
- BestPlaces Forest cost of living: https://www.bestplaces.net/cost_of_living/city/mississippi/forest
- Zillow Forest home values: https://www.zillow.com/home-values/38557/forest-ms/
- VA Jackson locations: https://www.va.gov/jackson-health-care/locations/
- G.V. Sonny Montgomery VA Medical Center: https://www.va.gov/jackson-health-care/locations/gv-sonny-montgomery-department-of-veterans-affairs-medical-center/
- Mississippi veteran benefits: https://www.msva.ms.gov/state-benefits
- Forest crime cross-check: https://www.areavibes.com/forest-ms/crime/
- Forest Niche crime-rate components: https://www.niche.com/places-to-live/forest-scott-ms/crime-safety/
- FBI 2024 national crime summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Mississippi medical cannabis program: https://www.mmcp.ms.gov/
- MAP Mississippi Equality Profile: https://mapresearch.org/equality-profiles/ms/
- RTX Careers Forest location: https://careers.rtx.com/global/en/raytheon-forest-ms-location
- Mississippi Development Authority Raytheon expansion: https://mississippi.org/news/rtx-expands-high-tech-manufacturing-footprint-in-mississippi/
- National Forests in Mississippi: https://www.fs.usda.gov/r08/mississippi
- Scott County local attractions: https://www.scottcountyms.gov/local-attractions
- BestPlaces Forest climate: https://www.bestplaces.net/climate/city/mississippi/forest
- WeatherSpark Forest climate: https://weatherspark.com/y/12483/Average-Weather-in-Forest-Mississippi-United-States-Year-Round
- Timeanddate central Mississippi humidity proxy: https://www.timeanddate.com/weather/%404443468/climate
- AAA Mississippi gas prices: https://gasprices.aaa.com/?state=MS
