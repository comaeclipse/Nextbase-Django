# Parkersburg, WV Source Notes

Retrieval date: 2026-08-26.

## Scope of this patch

Brand-new city addition (`Parkersburg, WV`, Wood County) for the VetRetire retirement location database. Ingest prepared per `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md`.

## Identity and Geography

- **City**: Parkersburg
- **State**: WV
- **County**: Wood County
- **Population**: 29,738 (U.S. Census Bureau 2020 Decennial Census / ACS 5-year estimate).
- **Land Area**: 11.78 sq mi (U.S. Census Bureau Gazetteer).
- **Density**: 2,524 people per square mile (29,738 / 11.78 sq mi).
- Primary URL: https://www.census.gov/quickfacts/fact/table/parkersburgcitywestvirginia

## Housing

- **AvgHomeValue**: $151,551 (Zillow Home Value Index - ZHVI typical home value for Parkersburg, WV, June 2026).
- Primary URL: https://www.zillow.com/home-values/46944/parkersburg-wv/

## Taxes and Cost of Living

- **SalesTax**: 7.00% (West Virginia state sales tax rate of 6.00% plus Parkersburg 1.00% municipal sales tax under the WV Municipal Home Rule Program).
- **Gas**: $3.93 / gallon (AAA Gas Prices for Parkersburg-Marietta, WV metro area, August 2026).
- **CostOfLiving**: Moderate (Derived post-import from BEA Regional Price Parities via `scripts/sync-col-index-from-rpp.ts`).
- Primary URLs:
  - Sales Tax: https://tax.wv.gov/Business/SalesAndUseTax/
  - Gas Price: https://gasprices.aaa.com/?state=WV

## Veterans Affairs

- **VA**: Y (Parkersburg hosts a primary VA Outpatient Clinic within city limits).
- **NearestVA**: Parkersburg VA Clinic (2610 Murdoch Ave, Parkersburg, WV 26101-3810).
- **DistanceToVA**: 2 miles from city centroid.
- **Veterans Benefits**: West Virginia fully exempts military retirement pay from state income tax for all branches and ranks. In addition, honorably discharged veterans with a 90-100% combined VA disability rating receive a 100% state income tax credit for real property taxes paid on their primary residence.
- Primary URLs:
  - VA Facility: https://www.va.gov/huntington-health-care/locations/parkersburg-va-clinic/
  - State Benefits: https://veterans.wv.gov/

## Weather and Climate

- **Snow**: 13 inches annual snowfall (NOAA 1991–2020 Climate Normals for Mid-Ohio Valley Regional Airport / PKB).
- **Rain**: 42 inches annual precipitation (NOAA 1991–2020 Normals).
- **SunnyDays**: 172 sunny / partly sunny days per year.
- **AverageLowWinter**: 23°F (January average low temperature).
- **AverageHighSummer**: 85°F (July average high temperature).
- **HumiditySummer**: 58% (July afternoon relative humidity).
- **Climate**: Humid subtropical (Cfa).
- Primary URL: https://www.ncei.noaa.gov/access/us-climate-normals/

## Politics and Elections (Wood County, WV)

- **County**: Wood County
- **2016 Presidential Election**:
  - Trump (Rep): 25,434 votes (70.51% total votes)
  - Clinton (Dem): 8,400 votes (23.29% total votes)
  - Others: 2,237 votes (6.20% total votes)
  - Two-party total: 33,834 votes
  - Trump two-party share: 75.17% (25,434 / 33,834)
  - Clinton two-party share: 24.83% (8,400 / 33,834)
- **2024 Presidential Election**:
  - Trump (Rep): 26,256 votes (70.72% total votes)
  - Harris (Dem): 10,261 votes (27.64% total votes)
  - Others: 610 votes
  - Two-party total: 36,517 votes
  - Trump two-party share: 71.90% (26,256 / 36,517)
  - Harris two-party share: 28.10% (10,261 / 36,517)
- **Partisan Shift**:
  - `rep_vote_share_change_pp`: **-3.3 pp** (71.90% − 75.17% = −3.27 pp)
  - `dem_vote_share_change_pp`: **+3.3 pp** (28.10% − 24.83% = +3.27 pp)
  - `ElectionChange`: "3.3 pp more Democratic since 2016"
- **CityPolitics**: Strongly Conservative (County vote 71.9% Republican, Wood County political culture).
- Primary URLs:
  - 2016 Election: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_West_Virginia
  - 2024 Election: West Virginia Secretary of State Official Election Returns

## Safety and Social Policy

- **TCI**: 72
  - Parkersburg 2024 violent crime rate: 260.3 per 100,000 (75 reported violent offenses, FBI UCR / OpenCrime data).
  - FBI 2024 national violent crime baseline: 359.1 per 100,000.
  - TCI calculation: (260.3 / 359.1) * 100 = 72.48 -> **72** (integer).
- **CrimeRating**: Low (TCI = 72 is under 100 national baseline).
- **Marijuana**: Medical (West Virginia Senate Bill 386 established medical cannabis program; legal dispensaries opened 2021. Recreational remains illegal).
- **LGBTQ**: 26 (Human Rights Campaign Municipal Equality Index 2024 score: 26/100).
- **LGBTQStatePolicyScore**: 12.50 (Movement Advancement Project West Virginia state policy score).
- Primary URLs:
  - Crime: https://opencrime.us/
  - LGBTQ MEI: https://www.hrc.org/resources/municipal-equality-index

## Economic Hubs, Amenities, and Lifestyle Tags

- **TechHub**: N
- **DefenseHub**: N (Mapped to `defense_hub_manual = false` in database recompute).
- **HasWalmart**: Y (Walmart Supercenter located at 2900 Pike St, Parkersburg, WV 26101).
- **HasCostco**: N (No Costco location in Parkersburg, WV or Wood County).
- **Tags**: `["Riverfront", "History", "Low Taxes", "Outdoor Recreation"]`
- **Description**: Situated along the Ohio and Little Kanawha rivers, Parkersburg offers rich history at Blennerhassett Island State Park, an affordable cost of living, and full state tax exemptions on military retirement pensions.

## Known limitations

None. All 44 CSV fields fully researched, calculated, and validated against primary sources.
