# Gilbert, Arizona source notes

Retrieved: 2026-08-06

## Identity and geography

- Geography: Gilbert town, Maricopa County, Arizona; Census place GEOID `0427400`.
- Population: 288,790 (Census July 1, 2024 estimate). Census reports 2020 population density of 3,907.3 people per square mile; stored as `3,907` rather than mixing the 2024 estimate with the 2020 land area.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/gilberttownarizona/DIS010223
  - https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html

## Taxes, VA access, and veterans benefits

- Sales tax: stored as 8.30%, the Gilbert combined transaction-privilege/sales-tax rate. Arizona's individual income-tax rate is 2.50% for tax year 2025 and later.
- VA: the Staff Sergeant Alexander W. Conrad Veterans Affairs Health Care Clinic is in Gilbert at 3285 South Val Vista Drive and provides primary and specialty outpatient services. The row stores `VA=Yes` and `0 miles` because the facility is in the same city; this is not a driving-distance calculation.
- Veterans benefits: the summary is deliberately cautious. Arizona does not generally exempt military retirement income from state tax; eligibility-specific relief and programs require state confirmation.
- Sources:
  - https://azdor.gov/individuals/withholding-tax-individual
  - https://aztaxes.gov/TransactionPrivilegeTax/RateTable
  - https://www.va.gov/phoenix-health-care/locations/staff-sergeant-alexander-w-conrad-veterans-affairs-health-care-clinic/
  - https://dvs.az.gov/

## Politics and social policy

- State-party/governor fields are stored as `R` / `D`: Arizona's legislature is Republican-controlled and Governor Katie Hobbs is a Democrat as of retrieval. This follows the app's compact state-control / governor-party convention.
- Politics uses Maricopa County, not a claimed citywide result. The county's official 2016 results show 747,361 Trump and 702,907 Clinton votes, for a Republican two-party share of 51.53%. Official 2024 county results show 1,051,531 Trump and 980,016 Harris votes, for 51.76%. The stored change is therefore +0.23 percentage points Republican (rounded to `0.2`); `County-level: Moderately Conservative` is a geography-qualified label, not a claim about every Gilbert precinct.
- Cannabis: Arizona permits adult-use and medical cannabis; stored as `Recreational`.
- LGBTQ: HRC's 2025 Municipal Equality Index scorecard gives Gilbert a final municipal score of 62. This is a municipal-policy score, not a resident-opinion or safety measure. No state-policy score was stored because a current MAP numerical extraction was not obtained in this retrieval.
- Sources:
  - https://elections.maricopa.gov/asset/jcr%3A1126eed2-298b-4c1f-9683-f704b6f5ea20/11-08-2016%20Final%20Summary%20Report%20NOV%202016.pdf
  - https://elections.maricopa.gov/asset/jcr%3A6081b5b7-3b36-4467-bec3-718850c0ed3c/Unofficial%20Final%20Results%2011-18-24.pdf
  - https://azdor.gov/forms/individual-income-tax-highlights
  - https://www.azleg.gov/
  - https://cannabis.azdhs.gov/
  - https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Gilbert-Arizona.pdf

## Climate

- Climate: hot desert. The row uses representative Phoenix/Sky Harbor 1991-2020 normal values: approximately 8 annual inches of precipitation, 45 F average January low, 106 F average July high, and no meaningful annual snowfall; this station proxy is appropriate for metro-scale orientation but is not a Gilbert microclimate claim.
- `SunnyDays`, summer humidity, gas price, a cost-of-living index, and a Zillow citywide value are blank because a compatible current source was not successfully retrieved. The importer consequently uses its existing `Moderate` cost-of-living fallback when `CostOfLiving` is blank; that label must not be read as a sourced city cost index.
- Sources:
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - https://www.weather.gov/psr/Climate

## Safety

- Safety is stored as `TCI=86` and `CrimeRating=Low`. The 86 is a transparent, curated 0-100 safety assessment, not an FBI score or a proprietary-grade conversion.
- The comparable FBI UCR/Part I series (available years 2010-2019) shows Gilbert's violent-plus-property rate declined from 1,991 to 1,299 reported offenses per 100,000 (-34.8%), driven by property crime; violent-crime rates remained low but were broadly flat. Arizona DPS's 2024 NIBRS overview reports 5,581 offenses / 2,010.98 per 100,000 and is intentionally not plotted or compared as a continuation of the earlier UCR line because it covers broader categories.
- Sources:
  - https://ucr.fbi.gov/crime-in-the-u.s/2010/crime-in-the-u.s.-2010/tables/table-8/10tbl08az.xls
  - https://ucr.fbi.gov/crime-in-the-u.s/2019/crime-in-the-u.s.-2019/topic-pages/tables/table-8/table-8-state-cuts/arizona.xls
  - https://azcrimestatistics.azdps.gov/tops/report/crime-overview/gilbert-pd/2024
  - https://www.gilbertaz.gov/Home/Components/News/News/5781/1379

## Air quality

- EPA AirData's 2025 annual county summary is stored for Gilbert using Maricopa County, the matching source geography: 32 Good days, 295 Moderate days, and 38 days in worse AQI categories. This is a county monitor summary, not a measurement of every neighborhood in Gilbert.
- Source: https://aqs.epa.gov/aqsweb/airdata/annual_aqi_by_county_2025.zip

## Lifestyle, hubs, and unfilled fields

- The description and tags are grounded in the town's parks/community resources and local VA access. The supplied Reddit synthesis and resident-perception graphic are preserved as qualitative context only: 93 votes is not a representative sample, and its safety, walkability, transit, parks, and family-friendliness percentages were not written as official metrics. The cited Reddit threads are similarly supplemental anecdotal evidence.
- Pace: the fixed-source classifier initially produced an `urban` candidate at 79.73 with `needs_review; close_boundary`, using Phoenix-Mesa-Chandler CBSA inputs. It was manually approved as `suburban`: Gilbert is a distinct incorporated municipality whose supported place description is low-rise, auto-oriented, family-focused, and separated from the Phoenix core. This is a place-experience override for a 0.27-point threshold case; it does not replace or conceal the original CBSA candidate and inputs.
- No affirmative or negative manual `TechHub` / `DefenseHub` value was written. A live check found no matching active defense-employer locations in the project's current source table; absence from that table is not evidence for a hard manual veto. `defense_hub` is derived after recomputation.
- `TCI` and `CrimeRating` use the documented source-backed safety assessment above; consumer-site letter grades were not used.
- Sources:
  - https://www.gilbertaz.gov/residents/parks-and-recreation
  - https://www.gilbertaz.gov/residents/hospitals-community-facilities
  - User-provided Gilbert Reddit synthesis, local-perception graphic, and linked threads, accessed 2026-08-06.

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Northrop Grumman operates a satellite-manufacturing facility in Gilbert described as one of the largest of its kind in the U.S., and Phoenix Defense is headquartered in Gilbert with roughly 128,000 sq ft across three facilities — a real, substantial defense-manufacturing presence with no tracked RTX presence needed to justify it.

Sources:
- Northrop Grumman, Arizona careers/site page — https://www.northropgrumman.com/careers/locations/arizona
- Gilbert Economic Development (gilbertedi.com), aerospace-aviation sector page — https://www.gilbertedi.com/
- Phoenix Defense (phx-defense.com), locations page — https://www.phx-defense.com/
