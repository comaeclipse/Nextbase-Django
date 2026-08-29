# Remaining employer geographies — GNIS resolution

Resolved with USGS GNIS rather than the Census Geocoder, because these places
have no Census place geography: military reservations, unincorporated
communities, and Guam villages. Renamed installations use the documented
alias table in the script, not fuzzy matching.

- attempted: **3**
- resolved: **3**
- refused: **0**

## Resolved

| place | onsite+hybrid | source and provenance | county | CBSA | coordinates |
|---|---:|---|---|---|---|
| Middletown, RI | 7 | USGS GNIS Middletown (1220013) | Newport | 39300 | 41.545666, -71.291439 |
| East Granby, CT | 1 | Census TIGERweb county subdivision 0911022070 internal point — A Connecticut town is a county subdivision, not a populated place, so GNIS has no feature for it -- the same class of miss as Cranberry Township PA. County is the Capitol Planning Region, which replaced Hartford County in 2022; CBSA 25540 Hartford-West Hartford-East Hartford confirmed from the Census CBSA layer at this point. | Capitol | 25540 | 41.930057, -72.745375 |
| St Louis Park, MN | 1 | USGS GNIS Saint Louis Park (650797) | Hennepin | 33460 | 44.948306, -93.348013 |

## Refused — no row written

_none_

## Name aliases applied

- feed `St Louis Park, MN` → GNIS `Saint Louis Park`
