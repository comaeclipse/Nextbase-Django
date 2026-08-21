# Charleston, SC Source Notes

Retrieval date: 2026-08-20.

## Geography

- Primary geography: incorporated City of Charleston, Charleston County, South Carolina. The row represents the city/place, not the MSA.
- U.S. Census QuickFacts reports Charleston city population estimate of 159,423 for July 1, 2025 (and 150,746 base at April 1, 2020).
- Land area: 114.76 square miles (U.S. Census 2020 Gazetteer / QuickFacts).
- Stored density: 159,423 / 114.76 = 1,389 people per square mile.
- Census place GEOID: 4513330. Centroid coordinates from Census 2024 Gazetteer / project pace bundle: 32.828017, -79.972896.
- Pace: project classifier handles pace after import. Do not infer pace from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index (ZHVI) reports Charleston typical home value of $596,437 (all homes, mid-tier, smoothed/seasonally adjusted, data through July 31, 2026). Stored `AvgHomeValue` is `$596,437`.
- BEA Regional Price Parities (2024 vintage) for the Charleston-North Charleston, SC Metropolitan Statistical Area (CBSA 16700) reports an All-items RPP index of 100.962. Stored `CostOfLiving` index is 101 (`Moderate`).
- South Carolina Department of Revenue (SCDOR) lists the state sales tax at 6.0%, and Charleston County imposes 3.0% in local option sales taxes (1% Local Option Sales Tax + 1% Transportation Sales Tax + 1% Education Capital Improvement Sales Tax), yielding a combined sales tax rate of 9.0%. Stored `SalesTax` is 9.0.
- State income tax: South Carolina has an individual income tax with top rate of 6.2% (exempting military retirement pay), managed state-wide in `locations_stateinfo`. State-owned income tax fields are ignored by `scripts/import-csv.ts`.
- Gas price: AAA Charleston-North Charleston regular gasoline average on 2026-08-20 is $3.756 per gallon, stored as `$3.76`.

## VA and Veteran Benefits

- Ralph H. Johnson Department of Veterans Affairs Medical Center is located at 109 Bee Street, Charleston, SC 29401, within the City of Charleston (~3 miles from the city centroid at 32.828017, -79.972896). It provides full inpatient hospital care, emergency services, and primary outpatient care.
- `VA=Y` under the repo's 25-mile outpatient access rule; `NearestVA` and `NearestVAHospital` are both the Ralph H. Johnson VA Medical Center.
- South Carolina state veteran benefits: South Carolina provides 100% state income tax exemption on military retired pay (Act 156 / SC Rev. Ruling #22-11); 100% permanent and total service-connected disabled veterans receive property tax exemption on a dwelling home and up to two motor vehicles; state employment preference; tuition assistance for eligible dependents at state-supported colleges; and free hunting/fishing licenses for disabled veterans.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station: USW00013880 (Charleston International Airport), with complete temperature, precipitation, snowfall, and hourly moisture normals.
- Annual precipitation: 52.51 inches, stored as Rain = 53.
- Annual snowfall: 0.30 inches, stored as Snow = 0.
- January average low temperature: 38.9°F, stored as AverageLowWinter = 39.
- July average high temperature: 91.3°F, stored as AverageHighSummer = 91.
- Sunshine: Current Results / NCDC sunshine table reports 102 sunny days and 109 partly sunny days, totaling 211 days with sun (SunnyDays = 211).
- Summer relative humidity: Current Results July relative humidity table for Charleston reports 88% morning (7 AM) and 61% afternoon (4 PM) relative humidity, averaged to 75% (HumiditySummer = 75).
- Climate label: Humid subtropical.

## Politics

- Election geography: Charleston County official / officially certified presidential returns.
- Denominator: two-party presidential vote for trend math and stored winner percentages.
- 2016 Charleston County presidential election results: Hillary Clinton (DEM) 89,299 votes (54.21% two-party share); Donald Trump (REP) 75,443 votes (45.79% two-party share). Winner: Clinton (54%).
- 2024 Charleston County presidential election results: Kamala Harris (DEM) 111,427 votes (52.89% two-party share); Donald Trump (REP) 99,265 votes (47.11% two-party share). Winner: Harris (53%).
- Partisan trend: Republican two-party share increased from 45.79% to 47.11% (+1.32 pp, stored as `rep_vote_share_change_pp: 1.3`), while Democratic share decreased 1.32 pp (`dem_vote_share_change_pp: -1.3`). Stored ElectionChange: `1.3 pp more Republican since 2016`.
- CityPolitics: `Moderately Liberal` (two-party Democratic vote share 52.89% falls in the 51-54.9% threshold, reflecting consistent municipal and county voting patterns).
- Governor: Henry McMaster (R).

## Safety and Social Policy

- TCI violent crime index: Violent crime rate for Charleston is 357.6 per 100,000 residents based on FBI Uniform Crime Reporting (UCR) / AreaVibes reported data. Indexed to the FBI national violent crime baseline (359.1 per 100,000), TCI = (357.6 / 359.1) * 100 = 99.58, stored as 100.
- CrimeRating: `Moderate`.
- Marijuana status: `Illegal` (South Carolina state policy).
- LGBTQ: Human Rights Campaign (HRC) Municipal Equality Index (MEI) Scorecard for Charleston, SC awarded Charleston a score of 71 out of 100. Stored `LGBTQ=71`, `LGBTQ_MEI=71`.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=Y: Charleston hosts a recognized technology and software hub known as "Silicon Harbor," with major employers including Blackbaud (HQ), Naval Information Warfare Center (NIWC Atlantic), Boeing IT/engineering, Benefitfocus, BoomTown, and hundreds of tech startups supported by the Charleston Digital Corridor.
- DefenseHub=Y: Charleston is a major defense and military operations center, hosting Joint Base Charleston (628th Air Base Wing, 437th/315th Airlift Wings, Naval Support Activity / Weapons Station), Naval Information Warfare Center (NIWC) Atlantic, Naval Nuclear Power Training Command (NNPTC), Coast Guard Sector Charleston, and major defense contractors (SAIC, Boeing Defense, etc.). `DefenseHub=Y` records `defense_hub_manual=true`.
- HasWalmart=Y: Walmart Supercenter #1358 at 3951 Ashley Phosphate Rd, Charleston, SC 29418 and Supercenter #3367 at 3000 Ashley Town Center Dr, Charleston, SC 29414 are both located within incorporated Charleston city limits.
- HasCostco=Y: Costco Wholesale #334 is located at 3050 Ashley Town Center Dr, Charleston, SC 29414, inside the City of Charleston.
- Tags and description: Reflects healthcare, military installations, historic coastal living, Atlantic beaches, water sports/boating, arts and culinary scene.

## Source URLs

- Census QuickFacts Charleston city, SC: https://www.census.gov/quickfacts/fact/table/charlestoncitysouthcarolina/PST045225
- Census Gazetteer Places: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Zillow Charleston ZHVI: https://www.zillow.com/home-values/41802/charleston-sc/
- BEA Regional Price Parities: https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
- SCDOR Local Sales Tax Rates: https://dor.sc.gov/tax/sales/rates
- AAA South Carolina Gas Prices: https://gasprices.aaa.com/?state=SC
- Ralph H. Johnson VA Medical Center: https://www.va.gov/charleston-health-care/locations/ralph-h-johnson-department-of-veterans-affairs-medical-center/
- SCDVA Veteran Benefits: https://va.sc.gov/
- SCDOR Retiree Tax Guide: https://dor.sc.gov/tax-tips/retirees-lower-your-individual-income-tax-bill-these-five-tips
- South Carolina State Election Commission: https://www.scvotes.gov/
- 2016 SC Presidential Election Results: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_South_Carolina
- 2024 SC Presidential Election Results: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_South_Carolina
- NOAA Climate Normals USW00013880: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00013880&format=json
- Current Results Charleston Sunshine: https://www.currentresults.com/Weather/South-Carolina/annual-days-of-sunshine.php
- Current Results July Humidity: https://www.currentresults.com/Weather/South-Carolina/humidity-july.php
- AreaVibes Charleston Crime: https://www.areavibes.com/charleston-sc/crime/
- HRC Municipal Equality Index: https://www.hrc.org/resources/municipal-equality-index
- Joint Base Charleston: https://www.jbcharleston.jb.mil/
- NIWC Atlantic: https://www.niwcatlantic.navy.mil/
- Walmart Charleston Store Directory: https://www.walmart.com/store-directory/sc/charleston
- Costco Charleston Warehouse: https://www.costco.com/warehouse-locations/charleston-sc-334.html

## Known Limitations

- Presidential results use Charleston County returns as official countywide certification data; Charleston municipal politics align with the county's moderately liberal orientation.
- State-owned tax and veterans benefit facts are maintained in `locations_stateinfo` rather than on individual city rows.
- Annual sunshine and summer relative humidity use Current Results / NCDC compilations as standard proxies since GHCN monthly normals omit solar and humidity parameters.
