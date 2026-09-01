# Kingsport, TN Source Notes

Retrieval date: 2026-08-31.

## Geography

- Primary geography: Kingsport city, TN, primarily in Sullivan County (extending into Hawkins County). The row represents the city of Kingsport.
- Population and land area: U.S. Census QuickFacts reports Kingsport city 2020 Census population 55,442 and 2020 land area of 52.56 square miles (stored `Population` `"55,442"`).
- Stored density is calculated from the 2020 Census population divided by land area: 55,442 / 52.56 = 1,054 people per square mile.
- Pace: project classifier handles pace post-import. Do not infer pace from population or density cutoffs.

## Cost, Taxes, and Housing

- Zillow Home Value Index (ZHVI) reports Kingsport typical home value of $257,123 as of July 31, 2026. Stored `AvgHomeValue` is `"$257,123"`.
- Sales Tax: Tennessee state sales tax rate is 7.00%, and Sullivan County local option sales tax rate is 2.75% (combined 9.75%). Stored `SalesTax` is `9.75`.
- Income Tax: Tennessee has no state individual income tax (Hall Income Tax fully repealed effective Jan 1, 2021). Stored `Income` is `0.00`.
- Gas Price: AAA Kingsport-Bristol regular average gas price of $3.634 on 2026-08-31, rounded to `"$3.63"`.

## VA and Veteran Benefits

- VA Outpatient Facility: Kingsport VA Clinic, 2003 N Eastman Rd, Suite 1, Kingsport, TN 37660-5291.
- VA Medical Center: James H. Quillen VA Medical Center (Mountain Home / Johnson City, TN), ~20 miles from Kingsport centroid.
- `VA=Y` stored. `NearestVA` is `Kingsport VA Clinic`, `DistanceToVA` stored as `2 miles`.
- Tennessee Veterans Benefits summary: Tennessee has no state individual income tax (exempting military retired pay), property-tax relief for disabled veterans and surviving spouses, county motor-vehicle tax relief, veteran license plates, lifetime hunting/fishing licenses, and state park privileges.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station: USW00013877, Tri-Cities Airport (Bristol/Johnson City/Kingsport, TN).
- Monthly/annual normals: January low 26°F, July high 86°F, annual precipitation 44 inches, annual snowfall 9.2 inches. Stored: `Snow`: 9, `Rain`: 44, `AverageLowWinter`: 26, `AverageHighSummer`: 86.
- Sunny Days: 200 sunny days per year.
- Summer Humidity: 70% average summer humidity.
- Climate label: `Humid subtropical`.

## Politics

- Election geography: Sullivan County, TN.
- Denominator: two-party presidential vote for trend math and stored percentages.
- 2016 Sullivan County presidential votes: Trump 46,979; Clinton 12,578. Trump two-party share = 78.88% (stored winner percentage `79`).
- 2024 Sullivan County presidential votes: Trump 58,081; Harris 16,608. Trump two-party share = 77.76% (stored winner percentage `78`).
- Trend: Republican two-party share decreased 1.12 pp; Democratic two-party share increased 1.12 pp. Stored `rep_vote_share_change_pp`: `-1.1`, `dem_vote_share_change_pp`: `1.1`, `ElectionChange`: `1.1 pp more Democratic since 2016`.
- State party/governor: Tennessee Governor Bill Lee is a Republican (`R`). Legacy CSV fields `StateParty=R`, `Governor=R`.
- `CityPolitics`: `County-level: Strongly Conservative`.

## Safety and Social

- TCI method: AreaVibes / NeighborhoodScout / DoorProfit reported violent crime rates for Kingsport, TN (approx 441 per 100,000). Indexed against U.S. national average baseline of 359.1 per 100,000: TCI = 441 / 359.1 * 100 = 122.8, stored as `123`. `CrimeRating` stored as `Moderate`.
- Marijuana Status: `Illegal` under Tennessee state law.
- LGBTQ: Kingsport is not rated in the HRC Municipal Equality Index (MEI). MAP Tennessee Equality Profile 2026 score -1.50/49 (Low). Stored `LGBTQ=0`, `LGBTQ_MEI` blank, `LGBTQSource`: `Not rated in HRC MEI; MAP Tennessee Equality Profile 2026 score -1.50/49 (Low)`.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N. Kingsport economy is anchored by manufacturing (Eastman Chemical), healthcare (Ballad Health), logistics, and services.
- DefenseHub=N. While BAE Systems operates the Holston Army Ammunition Plant in Kingsport, defense employer location linking and `scripts/recompute-defense-hub.ts` own the derived `defense_hub` state; manual CSV field sets `DefenseHub=N`.
- HasWalmart=Y. Walmart Supercenter #596 (3200 Fort Henry Dr) and #742 (750 Lynn Garden Dr) in Kingsport.
- HasCostco=N. Nearest Costco warehouse is in Farragut/Knoxville, TN.
- Tags: `["Mountains","Hiking","Low Taxes","Healthcare","Fishing","Culture"]`.
- Description: Kingsport is a historic Appalachian mountain city in East Tennessee's Tri-Cities region along the Holston River, anchored by chemical manufacturing, healthcare, and outdoor recreation. It features low living costs, zero state income tax, local VA outpatient care, proximity to Bays Mountain Park and the Blue Ridge Mountains, and a strongly conservative county political profile.

## Source URLs

- Census QuickFacts Kingsport city, TN: https://www.census.gov/quickfacts/fact/table/kingsportcitytennessee/PST045225
- Zillow Kingsport TN ZHVI: https://www.zillow.com/home-values/52771/kingsport-tn/
- Tennessee Department of Revenue sales tax rates: https://www.tn.gov/revenue/taxes/sales-and-use-tax.html
- AAA Gas Prices Tennessee / Kingsport-Bristol: https://gasprices.aaa.com/?state=TN
- Kingsport VA Clinic: https://www.va.gov/mountain-home-health-care/locations/kingsport-va-clinic/
- James H. Quillen VA Medical Center: https://www.va.gov/mountain-home-health-care/locations/james-h-quillen-department-of-veterans-affairs-medical-center/
- Tennessee Department of Revenue veteran tax relief: https://www.tn.gov/revenue/tax-fraud-prevention/tax-relief.html
- NOAA/NCEI Climate Normals Tri-Cities Airport (USW00013877): https://www.ncei.noaa.gov/access/us-climate-normals/
- NWS Morristown Climate Page: https://www.weather.gov/mrx/
- 2016 Tennessee Presidential Election Results by County (Wikipedia / TN SOS): https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Tennessee
- 2024 Sullivan County TN Election Results (Johnson City Press / TN SOS): https://www.johnsoncitypress.com/news/election/sullivan-county-2024-election-results/
- AreaVibes / NeighborhoodScout Kingsport TN Crime: https://www.areavibes.com/kingsport-tn/crime/
- MAP Tennessee Equality Profile: https://mapresearch.org/equality-profiles/tn/
- Walmart Kingsport Supercenter locator: https://www.walmart.com/store/596-kingsport-tn
- Costco Warehouse Locator: https://www.costco.com/warehouse-locations
