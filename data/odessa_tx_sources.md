# Odessa, TX source notes

Researched 2026-07-28. This row represents the incorporated city of Odessa in Ector County. Blank CSV cells are intentional rather than estimates.

| Field(s) | Source and retrieval note |
| --- | --- |
| Geography | [U.S. Census QuickFacts](https://www.census.gov/quickfacts/fact/table/odessacitytexas/POP060220) reports 2020 Census population 114,428, population density 2,240.1 per square mile, and land area 51.08 square miles. The CSV stores the matched 2020 population and rounded Census density. |
| Politics | The [Texas Secretary of State 2016 Ector County canvass](https://elections.sos.state.tx.us/elchist319_county68.htm) reports Trump 25,020 and Clinton 10,249. The [2024 county result](https://electionsbycounty.com/result/presidential/tx/ector) reports Trump 32,429 and Harris 9,881. Two-party Republican shares are 70.94% in 2016 and 76.64% in 2024, a +5.70 percentage-point Republican change; CSV display percentages use the same two-party denominator. The county qualifier is intentional because city-precinct aggregation was not independently completed. |
| State leadership and tax | The [Office of the Texas Governor](https://gov.texas.gov/) identifies Greg Abbott as governor. The [Texas Comptroller city tax table](https://comptroller.texas.gov/taxes/sales/city.php) lists Odessa at 0.082500 (8.25% combined sales/use tax); Texas has no state individual income tax. |
| Home value | [Zillow's Odessa home-value page](https://www.zillow.com/home-values/93077/odessa-tx-79769/) showed a Zillow Home Value Index of $253,500 when retrieved. This is a typical home value (ZHVI), not an average or median, despite the legacy CSV column name. |
| VA access | The [VA Wilson and Young Medal of Honor VA Clinic](https://www.va.gov/west-texas-health-care/locations/wilson-and-young-medal-of-honor-va-clinic/) is an outpatient VA clinic at 8050 East Highway 191 in Odessa. It is in the city, so the CSV records `VA=Yes` and `0 miles`. |
| Veterans benefits | [Texas Comptroller property-tax exemptions](https://comptroller.texas.gov/taxes/property-tax/exemptions/) documents disabled-veteran exemptions; the [Texas Veterans Commission benefits guide](https://tvc.texas.gov/wp-content/uploads/2025/01/Federal-and-State-benefits-for-Veterans-in-Texas.pdf) covers additional state programs. |
| Marijuana | [Texas.gov medical marijuana](https://www.texas.gov/health-services/texas-medical-marijuana/) describes the Texas Compassionate Use Program; no adult-use program is represented, so the row is `Medical`. |
| LGBTQ | Odessa was not found in the HRC 2024 Municipal Equality Index scorecard set, so no city MEI score or city rating is invented. The [MAP Texas Equality Profile](https://mapresearch.org/equality-profiles/tx/) reported an overall state policy score of -6.75/49 (Negative) when retrieved; that state-level proxy is retained separately with its limitation. |
| Climate | NOAA 1991-2020 normals for station [USC00416502 (Odessa)](https://noaa-normals-pds.s3.amazonaws.com/normals-monthly/1991-2020/access/USC00416502.csv) and its [annual/seasonal file](https://noaa-normals-pds.s3.amazonaws.com/normals-annualseasonal/1991-2020/access/USC00416502.csv) report annual precipitation 12.28 in, annual snow 0.9 in, January mean minimum 32.2 F, and July mean maximum 94.0 F. CSV values are rounded to integers; `Semi-arid` is a display label. |

## Intentional gaps and follow-ups

- No sourced city-specific crime rate/index was retained; `TCI` and `CrimeRating` remain blank rather than mixing proprietary or weak estimates.
- No documented annual sunny-day or summer-humidity value was retained, so those CSV fields are blank.
- No current city gas-price snapshot, cost-of-living index, federal Tech Hub designation, or local defense-employer location link was found in the reviewed sources. `DefenseHub` is blank (unknown), not `No`; the derived field must be recomputed after any future employer linkage.
- Tags are modest, source-compatible product descriptors: local VA access, Texas tax policy, and local cultural amenities. They do not assert an unsourced defense, safety, or LGBTQ conclusion.

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **NULL (left unset — insufficient evidence either way)**

Odessa's economy is dominated by oil and gas. Only a small National Guard armory was found, and the area's WWII-era airfields (e.g. Midland Army Air Field) closed decades ago. Left NULL.

Sources:
- Texas Military Department, armory/facility locations — https://tmd.texas.gov/
