# Asheville, NC Source Notes

Retrieval date: 2026-08-11.

## Scope

New curated city row for Asheville, North Carolina. CSV: `data/asheville_nc.csv`.

## Identity and Population

- City/county: Asheville, Buncombe County, NC.
- Population: 93,523, Census QuickFacts July 1, 2025 estimate.
- Density: 2,080 people per square mile, rounded from Census 2020 place geography.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/ashevillecitynorthcarolina/PST045225

## Politics and Elections

- `StateParty=D` follows the current project convention of governor-party shorthand, not a claim of unified state control.
- Governor: Josh Stein, Democrat, official NC governor site.
- City politics: `Strongly Liberal`, based on Asheville city/precinct pattern and Buncombe County presidential results.
- Buncombe County two-party presidential math:
  - 2016: Clinton 75,452 / Trump 55,716. Clinton two-party share 57.52%.
  - 2024: Harris 98,662 / Trump 59,016. Harris two-party share 62.57%.
  - Democratic movement: +5.05 pp; Republican movement: -5.05 pp.
- Sources:
  - https://governor.nc.gov/
  - https://er.ncsbe.gov/?contest=0&county_id=11&election_dt=11%2F05%2F2024&office=ALL
  - https://er.ncsbe.gov/?contest=0&county_id=11&election_dt=11%2F08%2F2016&office=ALL

## Taxes and Cost of Living

- Sales tax: 7.00%, Buncombe combined sales/use rate.
- Income tax: 3.99%, North Carolina individual income tax rate for 2026.
- Cost of living index: 107, C2ER Asheville metro 2025 annual average 106.8, rounded.
- Cost of living display category: `Moderate`, derived by importer from 95-115.
- Sources:
  - https://www.ncdor.gov/taxes-forms/sales-and-use-tax/sales-and-use-tax-rates/current-sales-and-use-tax-rates
  - https://taxfoundation.org/location/north-carolina/

## Housing

- AvgHomeValue: 464131, Zillow Home Value Index typical home value for Asheville, data through 2026-06-30.
- Note: ZHVI is a typical home value, not an average or median sale price.
- Source:
  - https://www.zillow.com/home-values/50779/asheville-nc/

## Veterans Affairs

- Initial CSV VA fields use the researched Asheville VAMC row; authoritative distances and `has_va` should be overwritten by `scripts/sync-va-facilities.ts` from live city centroid coordinates.
- Veterans benefits summary: North Carolina qualifying military retirement pay deduction and disabled-veteran homestead exclusion.
- Sources:
  - https://www.va.gov/asheville-health-care/locations/charles-george-va-medical-center/
  - https://www.ncdor.gov/taxes-forms/individual-income-tax/bailey-decision-concerning-federal-state-and-local-retirement-benefits
  - https://www.ncdor.gov/taxes-forms/property-tax/property-tax-relief-disabled-veterans

## Safety, Marijuana, and LGBTQ

- TCI: 222, calculated as Asheville 2024 violent crime rate 796.1 per 100,000 divided by FBI 2024 national violent crime rate 359.1 per 100,000, multiplied by 100 and rounded.
- Crime rating: `High`, consistent with current project TCI convention.
- Marijuana: `Illegal`; North Carolina has no general adult-use or medical marijuana legalization in force.
- LGBTQ: Asheville local nondiscrimination protections for sexual orientation and gender identity/expression; North Carolina MAP state policy rating is Low.
- LGBTQ_MEI: `Not Rated`; Asheville is not one of the North Carolina municipalities with a 2025 HRC MEI scorecard. This stores a null MEI score with documented source text.
- Sources:
  - https://cde.ucr.cjis.gov/
  - https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/ucr
  - https://www.ashevillenc.gov/department/human-relations-anti-discrimination/non-discrimination-ordinance/
  - https://codelibrary.amlegal.com/codes/ashevillenc/latest/asheville_nc/0-0-0-10296
  - https://mapresearch.org/equality-profiles/nc/
  - https://www.hrc.org/resources/municipal-equality-index
  - https://www.ncleg.gov/Laws/GeneralStatuteSections/Chapter90

## Economic Hubs and Tags

- TechHub: `N`; Asheville MSA computer/math employment share is materially below the national share.
- DefenseHub: `Y` in CSV, which maps to `defense_hub_manual`; derived `defense_hub` must be recomputed after employer linking.
- Basis: Pratt & Whitney / RTX Asheville turbine-airfoil manufacturing investment and local onsite RTX presence.
- Tags: `["Mountains","Culture","Healthcare"]`.
- Sources:
  - https://www.rtx.com/raytheon/news/2022/10/27/pratt-whitney-opens-asheville-turbine-airfoil-production-facility
  - https://www.ashevillenc.gov/
  - https://www.exploreasheville.com/

## Weather and Climate

- Annual snow: 12 inches, from 11.5 inches rounded.
- Annual rain: 41 inches, from 40.6 inches rounded.
- Sunny days: 212, secondary comparative climate source.
- January low: 29 F; July high: 86 F; July RH: 74%.
- Climate label: `Four-season mountain`.
- Follow-up required: monthly and hourly NOAA normals imports after the city exists in Neon and map coordinates are regenerated.
- Sources:
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - https://www.ncei.noaa.gov/access/us-climate-normals/

## Known Caveats

- `LGBTQ_MEI=Not Rated` is an intentional sourced value; `lgbtq_mei_score` should remain null.
- VA distance and hospital fields are provisional in the CSV and must be finalized by `scripts/sync-va-facilities.ts`.
- Climate category is derived separately from the current TypeScript categorizer. For a one-city insert, use exact-row SQL rather than running the global write mode.
