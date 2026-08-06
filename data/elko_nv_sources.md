# Elko, Nevada source notes

Retrieved: 2026-07-28

## Identity and demographics

- City/county/state: Elko, Elko County, Nevada.
- Population and density: Census Reporter, sourced from U.S. Census Bureau ACS 2024 5-year data, reports 20,696 residents, 17.8 square miles, and 1,159.7 people per square mile. Stored as `Population=20,696` and `Density=1160`.
- Source: https://censusreporter.org/profiles/16000US3222500-elko-nv/

## Taxes and cost of living

- Sales tax: 7.10% combined Elko County rate. Nevada Department of Taxation publishes county rate sheets; Avalara's Elko County lookup corroborates 7.10%.
- Income tax: 0.00%. Nevada has no individual income tax.
- Cost of living: AreaVibes Elko cost-of-living index 108, with 100 as the national baseline. AreaVibes labels this as 2026 modeled data using Census housing inputs plus city-level pricing models, so it is a directional index rather than a licensed C2ER value.
- Sources:
  - https://tax.nv.gov/tax-types/sales-tax-use-tax/
  - https://www.avalara.com/us/en/taxrates/state-rates/nevada/counties/elko-county.html
  - https://tax.nv.gov/about-nevada-department-of-taxation/income-tax-in-nevada/
  - https://www.areavibes.com/elko-nv/cost-of-living/

## Housing

- Average home value: Zillow Elko typical home value $364,923, data through June 30, 2026. This is ZHVI typical value, not a median sale price.
- Source: https://www.zillow.com/home-values/31396/elko-nv/

## VA access and veteran benefits

- VA access: Elko has an in-city Elko VA Clinic at 2767 Mountain City Highway, so the nearest VA distance is recorded as 0 miles.
- Veteran benefits: Nevada has no individual income tax, so military retirement income is not taxed at the state level. Nevada also offers veterans and disabled veterans property-tax exemptions; MyArmyBenefits notes a disabled veteran exemption for veterans with at least a 60% permanent service-connected disability.
- Sources:
  - https://www.va.gov/salt-lake-city-health-care/locations/elko-va-clinic/
  - https://tax.nv.gov/faqs/veterans-tax-exemptions-faqs/
  - https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Nevada

## Politics

- State party/governor: Nevada governor Joe Lombardo is Republican. The stored state party/governor fields match the existing Nevada row convention in this database.
- City politics: City-only presidential returns were not used; Elko County is the recorded geography. Elko County's two-party presidential vote stayed above 75% Republican in 2016 and 2024, so the row is explicitly qualified as `County-level: Strongly Conservative`.
- 2016 presidential result: Elko County voted for Trump. Two-party share was 13,551 Trump votes / (13,551 Trump + 3,401 Clinton) = 79.94%, rounded to 80%.
- 2024 presidential result: Elko County voted for Trump. Two-party share was 17,352 Trump votes / (17,352 Trump + 4,632 Harris) = 78.93%, rounded to 79%.
- Election change: Republican two-party share moved from 79.94% in 2016 to 78.93% in 2024, a -1.01 percentage point shift, rounded to 1.0 pp more Democratic.
- Sources:
  - https://www.gov.nv.gov/about/governor-joe-lombardo/
  - https://ballotpedia.org/Joe_Lombardo
  - https://www.nvsos.gov/silverstate2016gen/county-results/elko.shtml
  - https://www.nvsos.gov/SOSelectionPages/results/2024StateWideGeneral/Elko.aspx
  - https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Nevada
  - https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Nevada

## Crime

- Violent crime input: AreaVibes reports 2024 FBI-source Elko violent crime at 398 per 100,000 people.
- TCI: 398 / 359 national violent-crime baseline * 100 = 110.9, rounded to 111.
- Crime rating: Moderate, because violent crime is modestly above the national baseline while total and property crime are below national rates.
- Source: https://www.areavibes.com/elko-nv/crime/

## Cannabis

- Marijuana: Recreational. Nevada legalized adult-use recreational cannabis beginning January 1, 2017; possession/use remains subject to state limits and private-property restrictions.
- Source: https://ccb.nv.gov/laws-regulations/

## LGBTQ

- LGBTQ MEI: HRC 2025 Elko MEI final score 50.
- State policy score: MAP Nevada Equality Profile reports 42.25 / 49, high equality tally.
- Sources:
  - https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Elko-Nevada.pdf
  - https://mapresearch.org/equality-profiles/nv/

## Defense and technology hubs

- Tech hub: No source-backed evidence was found that Elko is a technology hub; stored `TechHub=N`.
- Defense hub: The live `defense_employer_locations` and `military_installations` tables had no Elko, NV rows at retrieval time. Stored `DefenseHub=N` as the manual curation input, then `defense_hub` is left to `scripts/recompute-defense-hub.ts`.

## Weather and climate

- NOAA station: Elko Regional Airport (`USW00024121`), 1991-2020 monthly normals.
- Annual precipitation: 9.99 inches, rounded to 10.
- Annual snowfall: 41.2 inches, rounded to 41.
- Winter low: January normal minimum 16.0 F, rounded to 16.
- Summer high: July normal maximum 91.8 F, rounded to 92.
- Humidity: Timeanddate's Elko Township July climate average reports 29% humidity; NOAA monthly normals do not carry humidity in this product.
- Sunny days: BestPlaces reports 231 sunny days per year for Elko. This is a secondary source because NOAA normals do not expose annual sunny-day counts in the monthly normals file.
- Sources:
  - https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00024121.csv
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - https://www.timeanddate.com/weather/%405703698/climate
  - https://www.bestplaces.net/climate/city/nevada/elko

## Gas

- Gas price: AAA Nevada regular unleaded statewide average was $4.799 on July 28, 2026, stored as `$4.80`. No official city-level Elko average was found.
- Source: https://gasprices.aaa.com/?state=NV

## Lifestyle and description

- Tags and description are based on official/regional tourism and local economy sources: Ruby Mountains/Lamoille Canyon outdoor access, Basque and Western cultural events, golf/fishing, and gold-mining economy.
- Sources:
  - https://exploreelko.com/
  - https://travelnevada.com/cities/elko/
  - https://extension.unr.edu/neap/county-reports/elko.aspx
