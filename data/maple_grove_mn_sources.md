# Maple Grove, MN Source Notes

Retrieval date: 2026-08-31.

## Geography

- Primary geography: Maple Grove city limits, Hennepin County, MN.
- Population and density: Census QuickFacts / ACS estimate, 72,741. Density is calculated from that estimate divided by 2020 land area, 32.57 square miles, yielding about 2,233 people per square mile.
- Housing: Zillow city-level ZHVI for Maple Grove, MN ($432,568, 2026).
- Cost of living: Minneapolis-St. Paul MSA Regional Price Parity (RPP) baseline index 104; derived post-ingest via `import-bea-rpp.ts` and `sync-col-index-from-rpp.ts`.
- Sales tax: Maple Grove general combined sales tax rate stored as 9.025 percent. Minnesota state rate is 6.875 percent; local/special components include Hennepin County sales tax (0.15 percent), Metro Area Housing and Transportation sales tax (1.00 percent total), Hennepin County Transit Improvement tax (0.50 percent), and Maple Grove local option sales tax (0.50 percent).
- Income tax: Minnesota's top individual income tax rate is 9.85 percent.
- VA access: Minneapolis VA Medical Center, One Veterans Drive, Minneapolis, MN. Distance is approximate driving distance from Maple Grove City Hall to the medical center (~24 miles). Recomputed post-ingest via `sync-va-facilities.ts`.
- Elections: Maple Grove city precinct rows from Minnesota Secretary of State federal/state precinct spreadsheets. Percent fields are two-party winner share, rounded to whole percent. Trend fields use two-party share: Democratic share rose from about 53.0 percent in 2016 to about 58.0 percent in 2024, so `rep_vote_share_change_pp = -5.0` and `dem_vote_share_change_pp = 5.0`. Because this is city-level precinct evidence, `city_politics` is stored as `Liberal`.
- Crime: `TCI` is a violent-crime-rate proxy indexed to the FBI national violent-crime rate. Maple Grove's 2024 violent crime rate is approximately 113.1 per 100,000. Indexed against FBI's national rate (359.1 per 100,000) gives a TCI of 31, classified as `Low`.
- Weather: Annual rain (32 in), snow (50 in), sunny days (197), January low (6°F), July high (83°F), and July humidity (71%) derived from NOAA Climate Normals and MSP regional station summaries. Meets the `Humid continental` cold/snowy category rule.
- LGBTQ score: Maple Grove was not located in HRC's MEI municipal city list (`LGBTQ_MEI = Not Rated`). MAP gives Minnesota an overall LGBTQ policy score of 36.75/49 (rated High). Stored `lgbtq_rating` converts that state policy score to a 0-100 proxy, 75.
- Economic hubs: `tech_hub=Y` due to major medical technology employment cluster (Boston Scientific Maple Grove campus, North Memorial Health, Fairview clinics); `defense_hub=N` (no active defense contractor plant or military installation).
- Amenities: `has_walmart=Yes` (Walmart Supercenter, 9451 Dunkirk Ln N), `has_costco=Yes` (Costco Warehouse, 11300 Fountains Dr).

## Source URLs

- Census QuickFacts, Maple Grove city population and land area: https://www.census.gov/quickfacts/fact/table/maplegrovecityminnesota/PST045223
- Census Reporter Maple Grove ACS profile cross-check: https://censusreporter.org/profiles/16000US2739914-maple-grove-mn/
- Zillow Maple Grove ZHVI: https://www.zillow.com/home-values/12520/maple-grove-mn/
- Minnesota Department of Revenue sales tax rate calculator: https://www.revenue.state.mn.us/sales-tax-rate-calculator
- Maple Grove local sales tax guidance: https://www.maplegrovemn.gov/
- Minnesota Department of Revenue income tax brackets: https://www.revenue.state.mn.us/minnesota-individual-income-tax-brackets
- AAA Minnesota gas prices: https://gasprices.aaa.com/?state=MN
- VA Minneapolis health care locations: https://www.va.gov/minneapolis-health-care/locations/
- Minneapolis VA Medical Center location page: https://www.va.gov/minneapolis-health-care/locations/minneapolis-va-medical-center/
- Minnesota Department of Veterans Affairs benefits overview: https://mn.gov/mdva/resources/familyassistance/
- Minnesota Secretary of State 2024 precinct results spreadsheet page: https://www.sos.mn.gov/elections-voting/election-results/2024/2024-general-election-results/2024-precinct-results-spreadsheet/
- Minnesota Secretary of State 2016 precinct results spreadsheet page: https://www.sos.mn.gov/elections-voting/election-results/2016/2016-general-election-results/2016-precinct-results-spreadsheet/
- Maple Grove Police Department annual report / OpenCrime: https://www.opencrime.us/cities/maple-grove-minnesota
- FBI Uniform Crime Reporting: https://cde.ucr.cjis.gov/
- MAP Minnesota equality profile: https://mapresearch.org/equality-profiles/mn/
- NOAA Climate Normals: https://www.ncei.noaa.gov/access/us-climate-normals/
- WeatherSpark Maple Grove climate summary: https://weatherspark.com/y/10398/Average-Weather-in-Maple-Grove-Minnesota-United-States-Year-Round
- Three Rivers Park District Elm Creek Park Reserve: https://www.threeriversparks.org/location/elm-creek-park-reserve
