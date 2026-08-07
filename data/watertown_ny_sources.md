# Watertown, NY — Source Notes

Retrieval date: 2026-08-06. The row represents Watertown city, Jefferson County, New York.

## Geography and housing

- The U.S. Census Bureau estimates Watertown's July 1, 2025 population at **23,517**; 2020 population density was **2,733.1 people per square mile** and land area was 9.03 square miles. Stored population is the current Census estimate and density is the published 2020 density.
  - https://www.census.gov/quickfacts/fact/table/watertowncitynewyork/INT100223
- Zillow reports a city-level ZHVI / typical home value of **$207,760**, data through June 30, 2026. This is stored in the legacy `AvgHomeValue` field; it is not described as an average or median in the product notes.
  - https://www.zillow.com/home-values/829287/watertown-ny/

## Weather and climate

- The legacy summary weather values are computed from the official NOAA/NCEI **1991–2020** monthly normals for **WATERTOWN, NY (USC00309000)**, located in Watertown (43.9761, -75.8753): annual precipitation sums to **44.36 in** (stored as 44), annual snowfall sums to **116.4 in** (stored as 116), January mean minimum is **10.7 F** (stored as 11), and July mean maximum is **79.8 F** (stored as 80).
  - https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USC00309000.csv
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- NOAA's monthly GHCN normals product used here does not publish sunshine days or relative humidity. The follow-up weather import loads 12 monthly normals from the local station and hourly dew-point/heat-index normals from the nearby Watertown International Airport station (USW00094790); station provenance is retained in the corresponding weather tables.
  - https://www.ncei.noaa.gov/data/normals-hourly/1991-2020/access/USW00094790.csv
- The supplemental dataset supports **162 sunny days** per year. This is a commercial climate estimate, not a NOAA-normal metric, and is marked as such. Timeanddate's Fort Drum / Wheeler-Sack Army Airfield series (11 miles away; reports collected 1992–2021) gives June/July/August relative humidity of 75%/75%/77%; their mean of **75.7%** is stored as the integer value **76** for the legacy summer-humidity field.
  - https://usclimatedata.com/climate/watertown/new-york/united-states/usny1525
  - https://www.timeanddate.com/weather/%405143400/climate

## Veterans access and benefits

- Watertown has an in-city VA outpatient clinic, so the established in-city convention stores `DistanceToVA` as `0 miles`. VA identifies primary and specialty care at Watertown VA Clinic.
  - https://www.va.gov/syracuse-health-care/locations/watertown-va-clinic/
- New York's official veterans guidance covers property-tax exemptions; the benefit summary also notes the state's military retirement-pay tax treatment.
  - https://veterans.ny.gov/property-tax-exemptions-veterans
  - https://www.tax.ny.gov/pit/file/military_page.htm

## Politics and policy

- County-level presidential results are used and explicitly qualified because city/precinct totals were not collected in this pass. New York's official results identify the contest and provide county-result downloads. Jefferson County's 2016 two-party totals were Trump 21,763 and Clinton 13,809 (61.2% Republican); 2024 totals were Trump 26,417 and Harris 16,326 (61.8% Republican). The stored change is therefore +0.6 percentage points Republican / -0.6 Democratic, with whole-percent winner fields rounded to 61 and 62.
  - https://results.elections.ny.gov/contest/1650
  - https://results.elections.ny.gov/contest/5591
  - https://www.jeffersoncountyny.gov/departments/Elections/election-results
- New York is represented as Democratic state party/governor at retrieval. Adult-use cannabis is legal.
  - https://www.governor.ny.gov/
  - https://cannabis.ny.gov/adult-use
- The New York Office of Cannabis Management confirms adults 21+ may possess up to three ounces of cannabis or 24 grams of concentrate; the stored `Marijuana` value remains the schema's concise `Recreational` label.
  - https://cannabis.ny.gov/adult-use-information
- MAP reports New York's overall LGBTQ policy tally as **44.5/49**. No Watertown HRC Municipal Equality Index score was located, so city MEI remains blank and the row uses a transparent state-policy-derived display score of 91.
  - https://www.lgbtmap.org/equality_maps/profile_state/NY

## Taxes and deliberate gaps

- New York's top individual income-tax rate is **10.9%**. The 8.00% sales-tax entry follows the existing New York city-row convention and should be refreshed against the local jurisdiction rate before any tax-focused release.
  - https://taxfoundation.org/statetaxindex/states/New-York/
- AAA's Watertown-Fort Drum regular-gas average was **$4.2319** on 2026-08-06, stored rounded as `$4.23`. Gas is volatile and this field should be refreshed rather than treated as a stable city fact.
  - https://gasprices.aaa.com/?state=NY
- The supplied 80.8 cost-of-living index and 64 city LGBTQ score are analytical estimates without a reproducible compatible methodology or official city score. They were not written over the established rows. `CostOfLiving`, `TCI`, `CrimeRating`, city MEI, and a defense-hub manual decision therefore remain blank/unknown where applicable. The importer’s legacy cost display fallback is `Moderate` when its numeric index is null; this is not a sourced Watertown cost-of-living claim.
