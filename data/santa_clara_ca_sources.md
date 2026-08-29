# Santa Clara, CA Source Notes

Retrieval date: 2026-08-28.

## Geography

- Primary geography: Santa Clara city limits, Santa Clara County, CA.
- Population and density: city limits. Density is calculated from U.S. Census QuickFacts / 2024 population estimate of 132,377 divided by 2020 land area of 18.28 square miles, yielding approximately 7,242 people per square mile.
- Climate: San Jose International Airport SJC / station `USW00023293` (and Moffett Field NUQ) used as representative nearby weather stations.
- VA access: Distance from Santa Clara City Hall to San Jose VA Clinic (~8 miles) and Palo Alto VA Medical Center (~12 miles). `scripts/sync-va-facilities.ts` will derive exact great-circle miles post-ingest.
- Elections: Santa Clara County 2016 and 2024 presidential election returns. 2016 Clinton 73.37% (78% two-party) vs 2024 Harris 66.8% (69% two-party). Shift: 9.1 pp more Republican since 2016.
- Crime: `TCI` is a violent-crime-rate proxy indexed to the national violent crime rate. Santa Clara Police Department 2024 Part 1 violent crime reports ~200-220 per 100,000, yielding TCI ~56.
- Cost of living: BEA Regional Price Parities for San Jose-Sunnyvale-Santa Clara MSA will derive `col_index` post-ingest via `sync-col-index-from-rpp.ts`.
- Amenity backfill: Sourced in-city Walmart Neighborhood Market at 3255 Mission College Blvd, Santa Clara, CA 95054 (`has_walmart = true`) and in-city Costco Wholesale at 1601 Coleman Ave, Santa Clara, CA 95050 (`has_costco = true`).

## Source URLs

- U.S. Census QuickFacts, Santa Clara city, California: https://www.census.gov/quickfacts/fact/table/santaclaracitycalifornia/
- Zillow Santa Clara ZHVI, updated 2026-07: https://www.zillow.com/home-values/49476/santa-clara-ca/
- CDTFA Sales and Use Tax Rates, Santa Clara County: https://www.cdtfa.ca.gov/taxes-and-fees/rates.aspx
- Tax Foundation California Tax Profile: https://taxfoundation.org/location/california/
- AAA California Gas Prices: https://gasprices.aaa.com/?state=CA
- VA San Jose VA Clinic: https://www.va.gov/palo-alto-health-care/locations/san-jose-va-clinic/
- VA Palo Alto Health Care System: https://www.va.gov/palo-alto-health-care/
- California Secretary of State Statement of Vote 2024: https://www.sos.ca.gov/elections/prior-elections/statewide-election-results/general-election-nov-5-2024/statement-vote
- California Secretary of State Statement of Vote 2016: https://www.sos.ca.gov/elections/prior-elections/statewide-election-results/general-election-november-8-2016/statement-vote
- NOAA Climate Normals overview: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- HRC Municipal Equality Index 2024: https://www.hrc.org/resources/municipal-equality-index
- City of Santa Clara Police Department Crime Reports: https://www.santaclaraca.gov/our-city/departments-g-z/police-department
- Costco Santa Clara (1601 Coleman Ave): https://www.costco.com/warehouse-locations/santa-clara-ca-127.html
- Walmart Neighborhood Market Santa Clara (3255 Mission College Blvd): https://www.walmart.com/store/3123-santa-clara-ca
