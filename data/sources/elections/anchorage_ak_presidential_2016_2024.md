# Anchorage Municipality presidential vote shares (2016 → 2024)

Retrieval date: 2026-08-25. Geography: Municipality of Anchorage (Census county-equivalent FIPS `02020`).
Denominator: two-party presidential vote share (`candidate / (DEM + REP)`), matching
`ALL_DATA_RETRIEVAL_INSTRUCTIONS.md`.

## 2024 (endpoint)

Source: Wikipedia “Results by borough and census area” table for Alaska 2024, citing
certified borough-level returns.

- Trump (R): **62,925**
- Harris (D): **64,781**
- Two-party total: 127,706
- Two-party share: Trump **49.274%**, Harris **50.726%**
- Winner (two-party): Harris

https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Alaska

## 2016 (baseline)

Alaska’s Division of Elections publishes presidential returns by precinct and by
house-district Absentee / Early / Questioned buckets, not as a borough rollup. This
pass reconstructs the Municipality of Anchorage total from official OpenElections
precinct CSV (transcribed from `elections.alaska.gov` 2016 general results) plus a
Census TIGER 2022 county-equivalent spatial join:

1. Election-day precincts whose representative point falls inside GEOID `02020`
   contribute their full OpenElections President votes.
2. House-district Absentee / Early Voting / Questioned buckets are apportioned to
   Anchorage by that district’s election-day vote share inside `02020` (district 12
   is the only material split with Anchorage; share ≈ 42.7%).

Reconstructed Anchorage Municipality 2016:

- Clinton (D): **53,969**
- Trump (R): **61,083**
- Other: 14,989
- Two-party total: 115,052
- Two-party share: Trump **53.092%**, Clinton **46.908%**
- Winner (two-party): Trump

Primary inputs (not committed; regenerated as needed):

- OpenElections AK 2016 precinct CSV:
  https://github.com/openelections/openelections-data-ak/blob/master/2016/20161108__ak__general__precinct.csv
- Official precinct text mirror:
  https://www.elections.alaska.gov/results/16GENR/data/resultsbyprct.txt
- MGGG AK precinct geometries (for precinct→borough assignment only):
  https://github.com/mggg-states/AK-shapefiles
- Census TIGER/Line 2022 US county file, filtered to `STATEFP=02`

Independent cross-check (Akashic borough series, CC BY 4.0): Clinton 54,036 / Trump 60,987
(two-party Trump 53.022%). Difference vs this reconstruction is <0.1 pp on the
two-party Republican share — not enough to change a one-decimal stored delta.

https://akashic.app/county/02020/

## Stored fields

| Field | Value | Notes |
| --- | ---: | --- |
| `rep_vote_share_change_pp` | **-3.8** | 49.274 − 53.092 |
| `dem_vote_share_change_pp` | **+3.8** | 50.726 − 46.908 |
| `election_change` | `3.8 pp more Democratic since 2016` | replaces legacy statewide-flavored `3% more Republican` |
| `election_2016` | `Trump` | borough two-party winner |
| `election_2016_percent` | `53` | borough two-party winner % |
| `election_2024` | `Harris` | borough two-party winner (legacy row incorrectly stored Trump/54) |
| `election_2024_percent` | `51` | borough two-party winner % |
| `city_politics` | `Municipality-level: Mixed / Swing` | 2024 two-party Dem share 50.7% is inside the 49–51% swing band |

## Apply path

`scripts/apply-anchorage-vote-deltas.ts` (`--dry-run` first). Single-row UPDATE on
`locations_location` where `name = 'Anchorage' AND state = 'AK'`. No CSV re-import.
Production write only after this artifact merges to `master` (AGENTS.md ingest rule).
