# Stratford, CT Source Notes

Retrieval date: 2026-08-31.

## Geography

- Primary geography: Stratford town/place, CT, in Fairfield County. The row represents the town of Stratford.
- U.S. Census 2020 reports Stratford town population of 52,355.
- Stored density uses the 2020 Census population divided by the Census land area for Stratford town (17.6 square miles): 52,355 / 17.6 = 2,975 people per square mile.
- Census place GEOID: 0973140.
- Pace: project classifier handles pace post-import. Do not infer pace manually.

## Cost, Taxes, and Housing

- Zillow Home Value Index (ZHVI) reports Stratford typical home value of $471,249 through July 31, 2026. Stored `AvgHomeValue` is `$471,249`.
- Connecticut Department of Revenue Services states the general sales and use tax rate is 6.35% with no local sales taxes in Connecticut. Stored SalesTax is 6.35.
- Gas uses AAA Fairfield County average of $4.21 per gallon as of August 2026.
- Cost of living baseline: legacy CSV column carries 108. Post-ingest RPP script (`sync-col-index-from-rpp.ts`) will derive the exact `col_index` from BEA Regional Price Parities (Bridgeport-Stamford-Norwalk MSA).

## VA and Veteran Benefits

- Nearest outpatient and hospital VA access: West Haven VA Medical Center (950 Campbell Ave, West Haven, CT) is located 13 miles from Stratford via I-95 or Metro-North Railroad.
- `VA=Y` because the nearest outpatient-capable VA health facility is well within the 25-mile threshold.
- Connecticut veterans benefits: Connecticut does not tax federally taxed military retired pay, exempts qualifying military disability and survivor benefits, provides wartime veteran property-tax exemptions with additional income/disability-based relief, and requires municipalities to provide a full property-tax exemption for veterans with a total and permanent service-connected VA disability rating.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station: USW00094702 (Bridgeport Sikorsky Memorial Airport, located in Stratford, CT).
- Normals from Sikorsky Memorial Airport station: January low 24.0°F, July high 83.1°F, annual precipitation 44.1 inches, annual snowfall 35.1 inches. Stored rounded fields: Snow 35, Rain 44, AverageLowWinter 24, AverageHighSummer 83.
- Sunny days use BestPlaces/Current Results Stratford climate summary of 206 days with sun (99 clear + 107 partly sunny).
- Summer humidity uses July relative humidity average for coastal Long Island Sound (73%).
- Climate label: Humid continental.

## Politics

- Election geography: Stratford town official returns.
- Denominator: two-party presidential vote for trend math and winner percentage.
- 2016 Stratford presidential votes: Clinton 13,729; Trump 10,534. Two-party total = 24,263. Clinton two-party share = 56.58%, winner percent 57.
- 2024 Stratford presidential votes: Harris 15,708; Trump 11,261. Two-party total = 26,969. Harris two-party share = 58.24%, winner percent 58.
- Trend: Republican two-party share decreased from 43.42% to 41.76% (-1.66 pp / -1.7 pp); Democratic two-party share increased 1.66 pp / +1.7 pp. Stored `ElectionChange`: `1.7 pp more Democratic since 2016`. `rep_vote_share_change_pp` = `-1.7`, `dem_vote_share_change_pp` = `1.7`.
- `CityPolitics`: Stored as `Liberal` (58.24% Democratic two-party share falls into the 55-64.9% Liberal band).

## Safety and Social

- TCI method: violent crime rate per 100,000 indexed to the 2024 FBI national violent crime rate baseline of 359.1 per 100,000.
- FBI UCR / OpenCrime reports Stratford 2024 violent crime rate of 66.6 per 100,000 (35 violent crimes).
- TCI = (66.6 / 359.1) * 100 = 18.5 -> 19 (integer). Stored CrimeRating: `Low`.
- Marijuana status: Recreational (Connecticut state law).
- LGBTQ: Movement Advancement Project (MAP) CT state equality profile ranked High. Stored LGBTQ rating `High`, `LGBTQ_MEI` = 0 (unrated by HRC MEI).

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N.
- DefenseHub=Y. Stratford is the global headquarters and primary manufacturing plant for Sikorsky Aircraft (a Lockheed Martin company, Rotary and Mission Systems division), producing military helicopters such as the UH-60 Black Hawk and CH-53K King Stallion. `DefenseHub=Y` records a manual true in `defense_hub_manual`.
- HasWalmart=Y. Walmart Store #2585 is located at 150 Barnum Avenue Cutoff, Stratford, CT 06614.
- HasCostco=N. Nearest Costco warehouse is in Milford, CT (1718 Boston Post Rd).
- Description & Tags: Highlight coastal location on Long Island Sound, Sikorsky Aircraft aerospace footprint, VA access, local Walmart, low crime, and liberal voting profile.

## Source URLs

- U.S. Census Bureau QuickFacts / Place Data: https://www.census.gov/quickfacts/
- Zillow Stratford CT Home Values: https://www.zillow.com/home-values/
- CT Department of Revenue Services: https://portal.ct.gov/drs
- AAA Gas Prices: https://gasprices.aaa.com/
- VA Connecticut Healthcare System / West Haven VA Medical Center: https://www.va.gov/connecticut-health-care/locations/west-haven-va-medical-center/
- NOAA NCEI Climate Normals 1991-2020 (Bridgeport Sikorsky Memorial Airport USW00094702): https://www.ncei.noaa.gov/access/us-climate-normals/
- FBI UCR / OpenCrime Stratford 2024 Crime: https://opencrime.us/
- Lockheed Martin / Sikorsky Aircraft Headquarters: https://www.lockheedmartin.com/
- Walmart Stratford Store Directory: https://www.walmart.com/store/2585-stratford-ct
