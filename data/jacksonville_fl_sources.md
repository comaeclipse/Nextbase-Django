# Jacksonville, FL Source Notes

Retrieval date: 2026-08-20.

## Geography

- Primary geography: Jacksonville city limits, Duval County, FL (consolidated city-county government).
- Population and density: city limits. Stored population is the Census Reporter ACS 2024 1-year profile estimate of 1,009,831 (Census QuickFacts July 1, 2025 Vintage 2025 estimate is 1,017,689). Stored density is calculated from ACS 2024 population divided by land area of 747.3 square miles, rounded to 1,351 people per square mile.
- Climate: NOAA 1991-2020 monthly normals for Jacksonville International Airport station `USW00013889`, used as the representative city station. Annual rain is 53 inches (53.40 in normal). Snow is 0 (0.0 in normal). Winter low uses January normal low (42.9°F -> 43°F); summer high uses July normal high (91.9°F -> 92°F). Summer humidity uses July average relative humidity of 78% (morning 91%, afternoon 64%, from Current Results / NOAA historical normals).
- Sunshine: BestPlaces / local meteorological average of 220 annual sunny days.
- VA access: Jacksonville 1 VA Clinic (1536 North Jefferson Street, Jacksonville, FL 32209) is located approximately 1 mile from the city center. Additional facilities in city limits include the Jacksonville North VA Clinic and Jacksonville 2 VA Clinic. Inpatient VA hospital care is provided by Malcom Randall VA Medical Center in Gainesville, FL (~72 miles). Marked `VA=Yes`. The authoritative post-import VA sync will compute exact outpatient and hospital distances from centroid coordinates.
- Elections: Duval County presidential returns (co-extensive with Jacksonville consolidated government). 2016: Trump 211,672 (50.71% two-party, 48.48% total), Clinton 205,704 (49.29% two-party, 47.12% total). 2024: Trump 236,285 (50.74% two-party, 49.92% total), Harris 229,365 (49.26% two-party, 48.46% total). Winner percentage stored as two-party share rounded to whole percent (51% in 2016, 51% in 2024). Two-party vote share change is +0.03 pp Republican, stored as `rep_vote_share_change_pp=0.0` and `dem_vote_share_change_pp=0.0`. `CityPolitics` classified as `County-level: Mixed / Swing` per the 49-51% two-party threshold.
- Crime: `TCI` is a violent-crime-rate proxy indexed to national average violent crime rate (national average = 388.7 per 100k). OpenCrime reports Jacksonville violent crime rate as 697.9 per 100,000; 697.9 / 388.7 * 100 = 179.55, rounded to 180. Stored as `TCI=180`, `CrimeRating=High`.
- Taxes: Florida state sales tax is 6.00%. Duval County levies a 1.50% discretionary sales surtax (Florida Department of Revenue DR-15DSS), giving a combined sales tax rate of 7.50%. Florida has no personal income tax (`Income=0.00`).
- Cost of living: BEA Regional Price Parities (RPPs) 2024 vintage for Jacksonville, FL Metropolitan Statistical Area (MSA 27260) reports an all-items RPP of 99.484, stored as `CostOfLiving=99` (derived as `Moderate`).
- Housing: Zillow Home Value Index (ZHVI) for Jacksonville, FL reports typical home value of $286,646 as of July 31, 2026. Stored as `AvgHomeValue=$286,646`.
- LGBTQ rating and state policy score: Human Rights Campaign Municipal Equality Index (MEI) 2025 scorecard rates Jacksonville at 73/100 (2024 MEI score was 68/100). Stored as `LGBTQ=73`, `LGBTQ_MEI=73`. State policy score is stored as `-5.50` matching the existing Florida rows' MAP overall policy score convention.
- Defense & Tech Hubs: `DefenseHub=Y` (Jacksonville is a major military concentration anchoring Naval Station Mayport, Naval Air Station Jacksonville, Marine Corps Blount Island Command, Florida National Guard HQ, and active RTX Raytheon/Collins job sites). `TechHub=Y` (major southeastern FinTech capital hosting global headquarters of FIS, Dun & Bradstreet, ICE/Black Knight, and JAX Hub).
- Amenities: `HasWalmart=Y` (multiple Walmart Supercenters within city limits including 10991 San Jose Blvd, 13490 Beach Blvd, and 6830 Normandy Blvd). `HasCostco=Y` (two Costco Warehouses in city limits: 4901 Gate Pkwy and 8000 Parramore Rd).
- Gas: AAA Jacksonville metro regular gasoline average of $3.85 per gallon as of August 17, 2026.

## Source URLs

- Census Reporter Jacksonville, FL Profile (ACS 2024 1-year): https://censusreporter.org/profiles/16000US1235000-jacksonville-fl/
- Census QuickFacts Jacksonville city, Florida: https://www.census.gov/quickfacts/fact/table/jacksonvillecityflorida/PST045225
- Zillow Jacksonville, FL Home Values (ZHVI July 2026): https://www.zillow.com/home-values/25294/jacksonville-fl/
- Florida Department of Revenue Discretionary Sales Surtax (DR-15DSS): https://floridarevenue.com/Forms_library/current/dr15dss_26.pdf
- BEA Regional Price Parities (RPPs) State and Metro Area (MARPP MSA 27260): https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
- Florida Department of State / Duval County Supervisor of Elections 2016 & 2024 Official Returns: https://dos.fl.gov/elections/data-statistics/elections-data/election-results-archive/
- OpenCrime Jacksonville Violent Crime Statistics: https://www.opencrime.us/cities/jacksonville-florida
- FBI Crime Data Explorer: https://cde.ucr.cjis.gov/
- NOAA / NCEI 1991-2020 Climate Normals (USW00013889): https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- Florida Climate Center 1991-2020 Normals for Jacksonville International Airport: https://climatecenter.fsu.edu/
- Current Results Jacksonville Humidity & Climate Averages: https://www.currentresults.com/Weather/Florida/humidity-july.php
- BestPlaces Jacksonville, FL Climate & Sunny Days: https://www.bestplaces.net/climate/city/florida/jacksonville
- VA North Florida/South Georgia Veterans Health System Locations (Jacksonville 1 VA Clinic): https://www.va.gov/north-florida-health-care/locations/jacksonville-1-va-clinic/
- Florida Department of Veterans' Affairs Benefits Guide: https://floridavets.org/wp-content/uploads/2012/08/FDVA-Benefits-Guide.pdf
- Human Rights Campaign Municipal Equality Index (MEI): https://www.hrc.org/mei
- Movement Advancement Project (MAP) Equality Maps - Florida: https://www.lgbtmap.org/equality-maps/profile_state/FL
- JAXUSA Partnership FinTech & Industry Profile: https://jaxusa.org/industry/fintech/
- Costco Warehouse Locations (Jacksonville): https://www.costco.com/warehouse-locations/jacksonville-fl-357.html
- AAA Florida Gas Prices: https://gasprices.aaa.com/?state=FL
