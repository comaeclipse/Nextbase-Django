# Medford, OR Source Notes

Retrieval date: 2026-08-20.

## Geography and source choices

- Primary geography: incorporated City of Medford, Jackson County, Oregon.
- Population, density, housing, Walmart, and local descriptive fields are city-level.
- Presidential election fields use Jackson County results because a reviewed Medford city-boundary precinct crosswalk was not prepared for this ingest; `city_politics` is therefore explicitly marked county-level.
- VA access uses nearby White City VA Medical Center. It is not inside Medford city limits, but it is close enough for the repo's current outpatient-access rule.
- Cost of living is intentionally not hand-sourced. The CSV uses `RPP-derived post-import` only to satisfy the current nonblank CSV gate; `scripts/import-csv.ts` ignores that column, and phase 2 must run `scripts/import-bea-rpp.ts` plus `scripts/sync-col-index-from-rpp.ts`.
- HRC's 2025 MEI report and Oregon listing did not expose a Medford score in the accessible report data checked during this ingest. The row uses the repository's `Not Rated` path rather than inventing a municipal MEI score.

## Imported values and method

- Population and density: Census QuickFacts lists Medford city's July 1, 2025 population estimate as 86,494 and 2020 population density as 3,315.3 people per square mile, stored as 86,494 and 3,315.
- Housing: Zillow's Medford ZHVI page reports a typical home value of $412,596 with data through 2026-07-31. The model field is named `avg_home_value`, but this is Zillow Home Value Index typical value, not a mean sale price.
- Taxes: Oregon Department of Revenue says Oregon has no general sales or use/transaction tax, so sales tax is stored as 0. The CSV includes Oregon's 9.9 percent top individual income-tax rate for compatibility; `scripts/import-csv.ts` ignores state-owned tax fields.
- VA and veterans benefits: VA Southern Oregon lists White City VA Medical Center at 8495 Crater Lake Highway, White City, OR. It is roughly 8 miles from Medford's city center, so `VA=Yes`, `NearestVA=White City VA Medical Center`, and `DistanceToVA=8 miles`. Oregon veteran benefits are state-owned and already maintained in `locations_stateinfo`; the CSV summary is included for legacy compatibility only.
- Elections: County-level presidential results are used. The 2016 Jackson County result was Trump 53,870 and Clinton 44,447; two-party Republican share was 54.79 percent, rounded to 55. The 2024 Jackson County result was Trump 61,743 and Harris 54,065; two-party Republican share was 53.32 percent, rounded to 53. Republican two-party share moved from 54.79 percent in 2016 to 53.32 percent in 2024, so `rep_vote_share_change_pp = -1.5`, `dem_vote_share_change_pp = 1.5`, and `election_change = 1.5 pp more Democratic since 2016`.
- Crime: OpenCrime reports Medford's 2024 violent crime rate as 491.9 per 100,000 residents. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 137.0, rounded to TCI 137. The `High` label is used because AreaVibes reports total crime roughly 104 percent above the national average; this is a third-party presentation and should be treated as a safety caveat, not a locally maintained index.
- Cannabis: Oregon adult-use cannabis is treated as recreational.
- LGBTQ: Medford is stored as `Not HRC Rated` / `Not Rated` for municipal MEI. MAP's Oregon Equality Profile gives Oregon an overall policy score of 39.5 out of 49 with a High rating. The MAP value is state-owned and retained here only for compatibility/source review.
- Technology and defense: No strong official evidence was found that Medford is a technology hub or defense hub under the product's city flag semantics, so `TechHub=N` and `DefenseHub=N`.
- Retail: Walmart lists two Medford stores, including South Medford Supercenter #2069 at 1360 Center Dr, Medford, OR and Medford Crater Lake Hwy Supercenter #5839 at 3615 Crater Lake Hwy, Medford, OR, so `HasWalmart=Y`. Costco's nearest warehouse is in Central Point, OR, not Medford city, so strict in-city `HasCostco=N`.
- Climate: NOAA 1991-2020 normals for Rogue Valley International-Medford Airport station `USW00024225` give annual precipitation 18.43 inches, annual snowfall 3.40 inches, DJF average low 33.0 F, and JJA average high 88.1 F, stored as 18, 3, 33, and 88. Current Results reports Medford at 196 total days with sun annually; Weather Atlas reports July average relative humidity of 61 percent. These sunshine/humidity values are secondary because comparable NOAA normals are not available in the same station product.
- Gas: AAA's Oregon regular-gas average was $4.7593 as of 2026-08-20, stored as $4.76. This field is volatile.
- Economy and lifestyle: City and tourism sources describe Medford as Southern Oregon's healthcare, transportation, retail, airport, and outdoor/wine-country hub. Travel Medford and Travel Oregon emphasize Rogue River, Table Rocks, wineries, hiking, rafting, and proximity to Crater Lake.

## Source URLs

- Census QuickFacts, Medford city: https://www.census.gov/quickfacts/fact/table/medfordcityoregon/PST045225
- Census Reporter Medford profile cross-check: https://censusreporter.org/profiles/16000US4147000-medford-or/
- Zillow Home Value Index, Medford: https://www.zillow.com/home-values/5891/medford-or/
- Oregon Department of Revenue sales tax: https://www.oregon.gov/dor/programs/businesses/pages/sales-tax.aspx
- Oregon Department of Revenue personal income tax: https://www.oregon.gov/dor/programs/individuals/pages/pit.aspx
- White City VA Medical Center: https://www.va.gov/southern-oregon-health-care/locations/white-city-va-medical-center/
- Oregon Secretary of State election history/open data: https://sos.oregon.gov/elections/pages/historical-data.aspx
- 2016 Oregon presidential county table cross-check: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Oregon
- 2024 Oregon presidential county table cross-check: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Oregon
- OpenCrime Medford: https://www.opencrime.us/cities/medford-oregon
- AreaVibes Medford crime: https://www.areavibes.com/medford-or/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Oregon Liquor and Cannabis Commission cannabis FAQ: https://www.oregon.gov/olcc/marijuana/pages/frequently-asked-questions.aspx
- HRC 2025 Municipal Equality Index report: https://reports.hrc.org/municipal-equality-index-2025
- HRC Oregon MEI listing: https://www.hrc.org/resources/mei-state/oregon
- MAP Oregon Equality Profile: https://mapresearch.org/equality-profiles/or/
- NOAA 1991-2020 annual/seasonal normals, USW00024225: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024225&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00024225: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024225&format=json&units=standard&includeAttributes=false
- Current Results Oregon sunshine days: https://www.currentresults.com/Weather/Oregon/annual-days-of-sunshine.php
- Weather Atlas Medford climate: https://www.weather-atlas.com/en/oregon-usa/medford-climate
- AAA Oregon gas prices: https://gasprices.aaa.com/?state=OR
- Walmart Medford store directory: https://www.walmart.com/store-directory/or/medford
- Walmart South Medford Supercenter: https://www.walmart.com/store/2069-medford-or
- Walmart Medford Crater Lake Hwy Supercenter: https://www.walmart.com/store/5839-medford-or
- Costco Central Point warehouse: https://www.costco.com/warehouse-locations/central-point-OR-1287.html
- City of Medford 140-year growth article: https://www.medfordoregon.gov/News-Articles/Medford-Celebrates-140-Years-of-Growth-and-Transformation
- Asante Rogue Regional Medical Center: https://www.asante.org/Locations/location-detail/rogue-regional-medical-center/
- Rogue Valley International-Medford Airport: https://flymfr.com/
- Travel Medford: https://www.travelmedford.org/
- Travel Oregon Medford: https://traveloregon.com/places-to-go/cities/medford/
