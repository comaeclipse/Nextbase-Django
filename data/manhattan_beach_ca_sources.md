# Manhattan Beach, CA Source Notes

- Retrieval workflow: `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` and `AGENTS.md` rules were reviewed. This is a city/place record for Manhattan Beach city, Los Angeles County, CA. The CSV uses the active TypeScript/Neon importer and does not include legacy `pace:*` tags.
- Geography and demographics: U.S. Census Bureau ACS 2023 5-year estimates report a population of 34,210 for Manhattan Beach city, CA (GEOID 0645402), with a land area of 3.93 square miles and a population density of ~8,705 people per square mile. Centroid coordinates (33.8889° N, -118.4053° W) correspond to the Census Gazetteer centroid for Manhattan Beach.
- State government and taxes: California state sales tax (7.25%), Los Angeles County measure taxes, and Manhattan Beach Measure MMB combine for a 10.25% effective sales tax rate (California Department of Tax and Fee Administration, CDTFA, effective April 1, 2025). State-level tax rules and veterans benefits are adjudicated into `locations_stateinfo`.
- Cost and housing: Typical home value (ZHVI) for Manhattan Beach, CA is $3,321,616 (Zillow Home Value Index, July 2026 data). `col_index` / `cost_of_living` is left blank in the CSV because it is derived post-import from BEA Regional Price Parities via `scripts/import-bea-rpp.ts` and `scripts/sync-col-index-from-rpp.ts`.
- Elections and local politics: Certified precinct results reported by the Los Angeles County Registrar-Recorder / MB News for Manhattan Beach city were used. In 2016, Hillary Clinton received 62.7% and Donald Trump received 30.9% (67.0% Democratic two-party share vs 33.0% Republican two-party share). In 2024, Kamala Harris received 64.2% and Donald Trump received 32.8% (66.2% Democratic two-party share vs 33.8% Republican two-party share). Republican two-party share rose 0.8 percentage points (+0.8 pp), and Democratic share fell 0.8 percentage points (-0.8 pp). Stored as `rep_vote_share_change_pp = 0.8`, `dem_vote_share_change_pp = -0.8`, `0.8 pp more Republican since 2016`, and `CityPolitics = Liberal` (~66% D threshold).
- VA and veterans: Gardena VA Clinic (VA Greater Los Angeles Healthcare System) in Gardena, CA is located ~7 crow-fly miles east of Manhattan Beach. Tibor Rubin VA Medical Center in Long Beach is ~18 miles. `VA = Yes`, `NearestVA = Gardena VA Clinic`, `DistanceToVA = 7 miles`. Post-import script `scripts/sync-va-facilities.ts` updates exact facility distances from coordinates.
- Safety: Violent crime rates in Manhattan Beach are low relative to national averages, yielding a calculated Total Crime Index of `TCI = 70` and public rating `Low`.
- Cannabis and LGBTQ: California legalized adult-use recreational marijuana (`Recreational` in `locations_stateinfo`). Manhattan Beach is not individually scored by the HRC Municipal Equality Index (`LGBTQ = Not Rated`, `LGBTQ_MEI = Not Rated`, `LGBTQSource = HRC Municipal Equality Index (Not Rated)`).
- Tech, defense, retail, and tags: Manhattan Beach is part of the South Bay / Silicon Beach aerospace & technology cluster (`TechHub = Y`). No defense contractor job-sites are registered specifically in Manhattan Beach city limits (`DefenseHub = N`). Manhattan Beach has no Walmart (`HasWalmart = N`) and no Costco (`HasCostco = N`). Tags are limited to approved vocabulary: `["Coastal", "Beaches", "Ocean Views", "Walkable", "Luxury Living", "Golf"]`.
- Climate and weather: NOAA/NCEI 1991–2020 climate normals for the South Bay / LAX station report 0 inches of annual snowfall, 13 inches of annual rainfall, 280 sunny days, January low of 48°F, July high of 73°F, and summer relative humidity of 70%. Climate category is `Mediterranean`.
- Gas price: AAA Fuel Prices Los Angeles County regular gas average is `$4.65`.

## URLs

- U.S. Census Bureau ACS 5-Year Estimates: https://data.census.gov/profile/Manhattan_Beach_city,_California?g=160XX00US0645402
- Zillow Manhattan Beach Home Values: https://www.zillow.com/manhattan-beach-ca/home-values/
- CDTFA Sales & Use Tax Rates: https://www.cdtfa.ca.gov/taxes-and-fees/rate-info.htm
- LA County Registrar-Recorder Election Results: https://results.lavote.gov/
- MB News Certified Election Results: https://www.thembnews.com/
- Gardena VA Clinic: https://www.va.gov/greater-los-angeles-health-care/locations/gardena-va-clinic/
- AAA Gas Prices Los Angeles County: https://gasprices.aaa.com/?state=CA
- NOAA NCEI Climate Normals: https://www.ncei.noaa.gov/access/us-climate-normals/
- FBI Crime Data Explorer: https://cde.ucr.cjis.gov/
- HRC Municipal Equality Index: https://www.hrc.org/resources/municipal-equality-index
