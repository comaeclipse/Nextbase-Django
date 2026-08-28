# Remaining employer geographies — GNIS resolution

Resolved with USGS GNIS rather than the Census Geocoder, because these places
have no Census place geography: military reservations, unincorporated
communities, and Guam villages. Renamed installations use the documented
alias table in the script, not fuzzy matching.

- attempted: **9**
- resolved: **8**
- refused: **1**

## Resolved

| place | onsite+hybrid | source and provenance | county | CBSA | coordinates |
|---|---:|---|---|---|---|
| Bismarck, ND | 0 | USGS GNIS Bismarck (1035849) | Burleigh | 13900 | 46.808334, -100.783749 |
| Columbia, SC | 0 | USGS GNIS Columbia (1245051) | Richland | 17900 | 34.000717, -81.034818 |
| Concord, NH | 0 | USGS GNIS Concord (873303) | Merrimack | 18180 | 43.208145, -71.537573 |
| Jefferson City, MO | 0 | USGS GNIS Jefferson City (758233) | Cole | 27620 | 38.576709, -92.173523 |
| Lincoln, NE | 0 | USGS GNIS Lincoln (837279) | Lancaster | 30700 | 40.800008, -96.666968 |
| Montgomery, AL | 0 | USGS GNIS Montgomery (165344) | Montgomery | 33860 | 32.366811, -86.299974 |
| Saint Paul, MN | 0 | USGS GNIS Saint Paul (662851) | Ramsey | 33460 | 44.944418, -93.093282 |
| Salem, OR | 0 | USGS GNIS Salem (1167861) | Marion | 41420 | 44.942903, -123.035111 |

## Refused — no row written

- **Washington Dc, DC** (0 onsite/hybrid) — no GNIS feature named "Washington Dc" in DC. Tried: Washington Dc

## Name aliases applied


## Correction — 2026-08-27

`Saint Paul, MN` was resolved and imported by this run, then **rolled back**: the
database already held `St. Paul, MN` (#517), so the import created a second
geography for one city. It has been removed from the CSVs above and moved to
`data/employer_geographies_aliases.csv`.

The resolver keyed on an exact `(name, state)` miss, which cannot see a spelling
variant. It now normalizes `St./Saint`, `Ft./Fort`, `Mt./Mount` and `D.C./DC`
and checks the existing rows first, emitting an alias instead of a new row.

Still outstanding, and predating this run: `Ft George G Meade, MD` (#236) and
`Fort George G Meade, MD` (#365) are the same installation at identical
coordinates, splitting its defense presence — Raytheon and Collins on one row,
L3Harris on the other. `scripts/merge-duplicate-geography.ts` can merge them;
that is a separate change.
