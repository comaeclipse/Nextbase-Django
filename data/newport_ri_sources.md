# Newport, RI Source Notes

- Retrieval guide: `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` was reviewed for active TS/Neon import requirements, city completion gates, source priority, and defense employer location linking rules.
- Geography and demographics: Census Reporter reports Newport city, Newport County, RI at 25,163 population, 7.7 square miles land area, and 3,249 people per square mile based on ACS 5-year data.
- Current state-party convention: Rhode Island's Governor is Dan McKee (Democrat), so both `state_party` and `governor` fields are set to `D`.
- Elections: Rhode Island Board of Elections official certified municipal presidential election results for the City of Newport. In 2016, Clinton received 6,287 votes and Trump received 2,644 votes out of 8,931 two-party votes (6,287 / 8,931 = 70.395% Democratic, stored as 70). In 2024, Harris received 7,102 votes and Trump received 2,784 votes out of 9,886 two-party votes (7,102 / 9,886 = 71.839% Democratic, stored as 72). Republican two-party share decreased from 29.605% to 28.161%, so `rep_vote_share_change_pp = -1.5` and `dem_vote_share_change_pp = 1.5`. Because 2024 Democratic two-party share is above 65%, `city_politics` is `Strongly Liberal`.
- Taxes: Rhode Island Division of Taxation lists the statewide general sales tax rate at 7.00% and top marginal individual income tax rate at 5.99%.
- Cost and housing: ERI / regional data reports cost of living ~28% above baseline (placeholder 128 before post-ingest BEA RPP derivation). Zillow Home Value Index (ZHVI) reports average home value for Newport, RI at $962,240 as of July 2026.
- VA access and veteran benefits: Newport VA Clinic is located directly in Newport at 1 Modern Ave, Bldg 1, Newport, RI 02840 (`has_va: Yes`, `distance_to_va: 0 miles`). The nearest VA hospital is Providence VA Medical Center (~33 miles away in Providence). Rhode Island Office of Veterans Services documents full exemption on military retirement pay from state income tax, property tax relief for veterans, state park access, and free hunting/fishing licenses for eligible disabled veterans.
- Retail access: Walmart store #2885 is located inside city limits at 199 JT Connell Hwy, Newport, RI 02840 (`HasWalmart=Y`). Rhode Island currently has no Costco Wholesale locations statewide; nearest is East Lyme, CT or Avon, MA (`HasCostco=N`).
- Crime: AreaVibes reports violent crime rate for Newport, RI at 176 per 100,000 residents. Using the repo's open TCI method against the FBI 2024 national baseline of 359.1 per 100,000 gives 176 / 359.1 * 100 = 49.0, stored as `TCI = 49`. The public-facing label is `Low`.
- Cannabis: Rhode Island Cannabis Control Commission operates adult-use cannabis program; stored as `Recreational`.
- LGBTQ: MAP Rhode Island Equality Profile reports overall policy score of 38/49 (Sexual Orientation 17.75/23, Gender Identity 20.25/26). HRC Municipal Equality Index (MEI) 2025 reports a city score of 65 for Newport, RI.
- Economy and tags: Anchored by Naval Station Newport, Naval Undersea Warfare Center (NUWC) Division Newport, and Leidos Newport defense facility, so `DefenseHub=Y` (`defense_hub_manual=Y`). `TechHub=N`. Tags use established filter vocabulary: `["Beaches","Military","Healthcare","Arts","Culture","Golf","Fishing"]`.
- Climate: NOAA 1991-2020 Normals and WeatherSpark report Newport averages 28 inches of snow, 46 inches of rain, and 201 sunny days per year. July is the warmest month with a 79°F average high, January is the coldest with a 24°F average low, and July relative humidity averages 72%. Display climate is `Humid continental`.
- Gas: AAA Fuel Prices reported Rhode Island regular gasoline average at $4.05 on August 26, 2026.

## URLs

- Census Reporter Newport, RI profile: https://censusreporter.org/profiles/16000US4449960-newport-ri/
- Rhode Island Governor Dan McKee official page: https://governor.ri.gov/
- Rhode Island Board of Elections 2024 results: https://elections.ri.gov/elections/results/2024/general_election/
- Rhode Island Board of Elections 2016 results: https://elections.ri.gov/elections/results/2016/general_election/
- Rhode Island Division of Taxation sales tax: https://tax.ri.gov/tax-sections/sales-excise-tax
- Rhode Island Division of Taxation income tax rates: https://tax.ri.gov/tax-sections/income-tax
- Zillow Newport, RI Home Values: https://www.zillow.com/home-values/46700/newport-ri/
- Newport VA Clinic: https://www.va.gov/providence-health-care/locations/newport-va-clinic/
- Rhode Island Office of Veterans Services benefits: https://vets.ri.gov/benefits/
- Walmart Newport RI Store #2885: https://www.walmart.com/store/2885-newport-ri
- AreaVibes Newport crime statistics: https://www.areavibes.com/newport-ri/crime/
- Rhode Island Cannabis Control Commission: https://ccc.ri.gov/
- Movement Advancement Project RI Profile: https://www.mapresearch.org/equality-profiles/ri/
- HRC Municipal Equality Index 2025: https://www.hrc.org/resources/municipal-equality-index
- Naval Station Newport official site: https://cnrse.cnic.navy.mil/Installations/NAVSTA-Newport/
- WeatherSpark Newport climate: https://weatherspark.com/y/27197/Average-Weather-in-Newport-Rhode-Island-United-States-Year-Round
- AAA Rhode Island Gas Prices: https://gasprices.aaa.com/?state=RI
