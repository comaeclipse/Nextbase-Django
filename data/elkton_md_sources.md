# Elkton, MD Source Notes

- Retrieval workflow: `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` and `AGENTS.md` rules were reviewed. This is a city/place record for Elkton town, Cecil County, MD. The CSV uses the active TypeScript/Neon importer and does not include legacy `pace:*` tags.
- Geography and demographics: U.S. Census Bureau ACS 2023 5-year estimates report a population of 15,867 for Elkton town, MD (GEOID 2425825), with a land area of 8.89 square miles and a population density of ~1,785 people per square mile. Coordinates (39.6068° N, -75.8333° W) correspond to the Census Gazetteer centroid for Elkton.
- State government and taxes: Maryland imposes a 6.0% statewide general sales tax with no local add-on sales taxes in Cecil County. State-level tax rules and veterans benefits are adjudicated into `locations_stateinfo`.
- Cost and housing: Typical home value (ZHVI) for Elkton, MD is $375,232 (Zillow Home Value Index, August 2026 data). `col_index` / `cost_of_living` is left blank in the CSV because it is derived post-import from BEA Regional Price Parities via `scripts/import-bea-rpp.ts` and `scripts/sync-col-index-from-rpp.ts`.
- Elections and local politics: Maryland State Board of Elections official 2016 and 2024 presidential returns for Cecil County, MD were used. In 2016, Cecil County cast 28,499 Trump votes and 15,286 Clinton votes (65.09% Republican two-party share). In 2024, Cecil County cast 33,871 Trump votes and 17,628 Harris votes (65.77% Republican two-party share). Republican two-party share rose 0.68 percentage points (+0.7 pp), and Democratic share fell 0.68 percentage points (-0.7 pp). Stored as `rep_vote_share_change_pp = 0.7`, `dem_vote_share_change_pp = -0.7`, `0.7 pp more Republican since 2016`, and `CityPolitics = County-level: Strongly Conservative` (>65% R threshold).
- VA and veterans: Perry Point VA Medical Center (VA Maryland Health Care System) in Perryville, MD is located ~16 crow-fly miles west of Elkton. `VA = Yes`, `NearestVA = Perry Point VA Medical Center`, `DistanceToVA = 16 miles`. Post-import script `scripts/sync-va-facilities.ts` updates exact facility distances from coordinates.
- Safety: Violent and property crime rates in Elkton, MD relative to U.S. national averages yield a calculated Total Crime Index of `TCI = 165` and public rating `Moderate`.
- Cannabis and LGBTQ: Maryland legalized adult-use recreational marijuana effective July 1, 2023 (`Recreational` in `locations_stateinfo`). Elkton is not rated by the HRC Municipal Equality Index (`LGBTQ = Not Rated`, `LGBTQ_MEI = Not Rated`, `LGBTQSource = HRC Municipal Equality Index (Not Rated)`).
- Tech, defense, retail, and tags: Elkton is not a tech hub (`TechHub = N`). No defense contractor job-sites are registered for Elkton in `defense_employer_locations` (`DefenseHub = N`). Elkton hosts a Walmart Supercenter at 1000 E Pulaski Hwy (`HasWalmart = Y`) and no Costco warehouse (`HasCostco = N`). Tags are limited to approved vocabulary: `["Small Town", "Historic", "Water Access", "Chesapeake Bay"]`.
- Climate and weather: NOAA/NCEI 1991–2020 climate normals for the Cecil County / Wilmington area report 21 inches of annual snowfall, 47 inches of annual rainfall, 202 sunny days, January low of 25°F, July high of 86°F, and average summer relative humidity of 68%. Climate category is `Humid Subtropical`.
- Gas price: AAA Fuel Prices Maryland statewide / Cecil County regular gas average is `$3.55`.

## URLs

- U.S. Census Bureau ACS 5-Year Estimates: https://data.census.gov/profile/Elkton_town,_Maryland?g=160XX00US2425825
- Zillow Elkton Home Values: https://www.zillow.com/elkton-md/home-values/
- Maryland State Board of Elections 2024 Presidential Results: https://elections.maryland.gov/elections/2024/results/General/gen_results_2024_1_by_county_080.html
- Maryland State Board of Elections 2016 Presidential Results: https://elections.maryland.gov/elections/2016/results/General/gen_results_2016_1_by_county_080.html
- Maryland Comptroller Sales & Use Tax Rates: https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/legal-publications/tax-rates.pdf
- Perry Point VA Medical Center: https://www.va.gov/maryland-health-care/locations/perry-point-va-medical-center/
- AAA Gas Prices Maryland: https://gasprices.aaa.com/?state=MD
- NOAA NCEI Climate Normals: https://www.ncei.noaa.gov/access/us-climate-normals/
- FBI Crime Data Explorer: https://cde.ucr.cbi.gov/
- HRC Municipal Equality Index: https://www.hrc.org/resources/municipal-equality-index
