# Plymouth, MN Source Notes

Retrieval date: 2026-08-31.

## Geography

- Primary geography: Plymouth city limits, Hennepin County, MN.
- Population and density: Census QuickFacts July 1, 2025 population estimate, 78,942. Density is calculated from that estimate divided by 2020 land area, 32.71 square miles, yielding about 2,413 people per square mile.
- Housing: Zillow city-level ZHVI for Plymouth, MN ($516,680, July 2026).
- Cost of living: Minneapolis-St. Paul MSA Regional Price Parity (RPP) indexed relative to US average (100); baseline index 104.
- Sales tax: Plymouth general combined sales tax rate stored as 8.525 percent. Minnesota state rate is 6.875 percent; local/special components include Hennepin County sales tax (0.15 percent), Metro Area Housing and Transportation sales tax (1.00 percent total), and Hennepin County Transit Improvement tax (0.50 percent). Minnesota Department of Revenue rate calculator is the official location lookup.
- Income tax: Minnesota's top individual income tax rate is 9.85 percent.
- VA access: Minneapolis VA Medical Center, One Veterans Drive, Minneapolis, MN. Distance is approximate driving distance from Plymouth City Hall to the medical center (~22 miles).
- Elections: Plymouth city precinct rows from Minnesota Secretary of State federal/state precinct spreadsheets. Percent fields are two-party winner share, rounded to whole percent. Trend fields use two-party share: Democratic share rose from about 58.1 percent in 2016 to about 62.6 percent in 2024, so `rep_vote_share_change_pp = -4.5` and `dem_vote_share_change_pp = 4.5`. Because this is city-level precinct evidence, `city_politics` is stored as `Liberal`.
- Crime: `TCI` is a violent-crime-rate proxy indexed to the FBI national violent-crime rate. Plymouth's 2024 violent crime rate is approximately 80 per 100,000. Indexed against FBI's national rate gives a TCI of 25, classified as `Low`.
- Weather: Annual rain (32 in), snow (51 in), sunny days (198), January low (6°F), July high (83°F), and July humidity (71%) derived from NOAA Climate Normals and MSP regional station summaries. Meets the `Humid continental` cold/snowy category rule.
- LGBTQ score: Plymouth was not located in HRC's MEI municipal city list. Stored `lgbtq_mei_score` is `Not Rated`. MAP gives Minnesota an overall LGBTQ policy score of 36.75/49 (rated High). Stored `lgbtq_rating` converts that state policy score to a 0-100 proxy, 75.
- Retail access: `HasWalmart=No` and `HasCostco=No`. Neither retailer maintains a store within Plymouth city limits; nearest Walmart Supercenter (9451 Dunkirk Ln N) and Costco Wholesale (11330 Fountains Dr) are located in adjacent Maple Grove.
- Economic hubs: `tech_hub=Y` due to a major medical technology cluster (Medtronic, Abbott, Boston Scientific regional facilities); `defense_hub=N` (no active defense contractor plant or military installation).

## Source URLs

- Census QuickFacts, Plymouth city population and land area: https://www.census.gov/quickfacts/fact/table/plymouthcityminnesota/PST045225
- Census Reporter Plymouth ACS profile cross-check: https://censusreporter.org/profiles/16000US2751736-plymouth-mn/
- Zillow Plymouth ZHVI: https://www.zillow.com/home-values/13374/plymouth-mn/
- Minnesota Department of Revenue sales tax rate calculator: https://www.revenue.state.mn.us/sales-tax-rate-calculator
- Hennepin County sales tax breakdown: https://www.hennepin.us/elections
- Minnesota Department of Revenue income tax brackets: https://www.revenue.state.mn.us/minnesota-individual-income-tax-brackets
- AAA Minnesota gas prices: https://gasprices.aaa.com/?state=MN
- VA Minneapolis health care locations: https://www.va.gov/minneapolis-health-care/locations/
- Minneapolis VA Medical Center location page: https://www.va.gov/minneapolis-health-care/locations/minneapolis-va-medical-center/
- Minnesota Department of Veterans Affairs benefits overview: https://mn.gov/mdva/resources/familyassistance/
- Minnesota Secretary of State 2024 precinct results spreadsheet page: https://www.sos.mn.gov/elections-voting/election-results/2024/2024-general-election-results/2024-precinct-results-spreadsheet/
- Minnesota Secretary of State 2016 precinct results spreadsheet page: https://www.sos.mn.gov/elections-voting/election-results/2016/2016-general-election-results/2016-precinct-results-spreadsheet/
- Plymouth official crime statistics: https://www.plymouthmn.gov/departments/public-safety/police-department
- FBI Uniform Crime Reporting: https://cde.ucr.cjis.gov/
- MAP Minnesota equality profile: https://mapresearch.org/equality-profiles/mn/
- HRC Municipal Equality Index: https://www.hrc.org/resources/municipal-equality-index
- Walmart Store Finder (Maple Grove location): https://www.walmart.com/store/2864-maple-grove-mn
- Costco Warehouse Locations (Maple Grove location): https://www.costco.com/warehouse-locations/maple-grove-mn-1090.html
- NOAA Climate Normals: https://www.ncei.noaa.gov/access/us-climate-normals/
- WeatherSpark Plymouth climate summary: https://weatherspark.com/y/10405/Average-Weather-in-Plymouth-Minnesota-United-States-Year-Round
- Three Rivers Park District French Regional Park: https://www.threeriversparks.org/location/french-regional-park
