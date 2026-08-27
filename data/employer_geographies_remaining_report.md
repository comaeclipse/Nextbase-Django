# Remaining employer geographies — GNIS resolution

Resolved with USGS GNIS rather than the Census Geocoder, because these places
have no Census place geography: military reservations, unincorporated
communities, and Guam villages. Renamed installations use the documented
alias table in the script, not fuzzy matching.

- attempted: **16**
- resolved: **16**
- refused: **0**

## Resolved

| place | onsite+hybrid | source and provenance | county | CBSA | coordinates |
|---|---:|---|---|---|---|
| Dulles, VA | 12 | FAA US_Airport service, KIAD airport reference point — Not a place name: 'Dulles' is an airport, a Loudoun magisterial district and a USPS mailing name. No GNIS feature, no CDP. | Loudoun | 47900 | 38.947464, -77.459931 |
| Buckley Sfb, CO | 11 | DoD MIRTA DoD Sites, SITENAME 'Buckley Space Force Base' — Renamed from Buckley AFB on 2021-06-04. Inside Aurora city limits. | Arapahoe | 19740 | 39.706670, -104.757689 |
| Opa Locka, FL | 7 | USGS GNIS Opa-locka (308425) | Miami-Dade | 33100 | 25.902322, -80.250330 |
| Hanover, MD | 2 | Census TIGERweb ZCTA 21076 internal point — Contested. The GNIS point (584857) is a historical village locus in HOWARD county that falls inside Elkridge CDP; the modern Hanover MD 21076 community, which carries the BWI / Fort Meade / National Business Park office addresses this employer row refers to, centres in ANNE ARUNDEL. CBSA is 12580 either way, so the metro join is unaffected by the choice. | Anne Arundel | 12580 | 39.171419, -76.723328 |
| Merrimack, NH | 2 | USGS GNIS Merrimack (868400) | Hillsborough | 31700 | 42.865095, -71.493401 |
| Cranberry Township, PA | 1 | Census TIGERweb county subdivision 4201916920 internal point — Butler County, Pittsburgh metro. NOT the Luzerne County hamlet a GNIS populated-place query returns. | Butler | 38300 | 40.709967, -80.105642 |
| Dededo, GU | 1 | USGS GNIS Dededo (1389637) | Guam | — | 13.515285, 144.836106 |
| Fort Novosel, AL | 1 | DoD MIRTA DoD Sites, SITENAME 'Fort Novosel' — CBSA is Ozark AL Micro (37120), not Enterprise. The post was renamed BACK to Fort Rucker on 2025-07-17; MIRTA and Census both still carry 'Fort Novosel', and the employer feed uses it, so the row keeps that name. | Dale | 37120 | 31.403955, -85.747317 |
| Fort Shafter, HI | 1 | DoD MIRTA DoD Sites, SITENAME 'Fort Shafter' | Honolulu | 46520 | 21.345840, -157.883504 |
| JBER, AK | 1 | DoD MIRTA DoD Sites, SITENAME 'Joint Base Elmendorf-Richardson', ISJOINTBASE=yes — GNIS answers 'Fort Richardson' for this point, which is one of the two merged installations rather than the joint base. | Anchorage | 11260 | 61.269787, -149.811208 |
| Linthicum Heights, MD | 1 | USGS GNIS Linthicum Heights (590672) | Anne Arundel | 12580 | 39.203449, -76.662193 |
| Millersville, MD | 1 | USGS GNIS Millersville (590805) | Anne Arundel | 12580 | 39.059562, -76.648024 |
| Patrick Air Force Base, FL | 1 | DoD MIRTA DoD Sites, SITENAME 'Patrick Space Force Base' — Renamed from Patrick AFB on 2020-12-09. Census CDP is still named 'Patrick AFB CDP'. | Brevard | 37340 | 28.233570, -80.608413 |
| Peterson Afb, CO | 1 | DoD MIRTA DoD Sites, SITENAME 'Peterson Space Force Base' — Renamed from Peterson AFB on 2021-07-26. | El Paso | 17820 | 38.822897, -104.696135 |
| Santa Rita, GU | 1 | USGS GNIS Santa Rita (1390020) | Guam | — | 13.386118, 144.668884 |
| Yigo, GU | 1 | USGS GNIS Yigo (1390188) | Guam | — | 13.534451, 144.885551 |

## Refused — no row written

_none_

## Name aliases applied

- feed `Opa Locka, FL` → GNIS `Opa-locka`
