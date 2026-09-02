# `tci` / `crime` backfill from the FBI Crime Data Explorer — 2026-09-02 (issue #55)

Fills **27 of the 29** ranked city candidates that had no Total Crime Index,
and every one of the 13 that also had no `crime` label, using the fixed method
in `TCI_METHODOLOGY.md` (`lib/crime-index.ts`): each offense family indexed to
the FBI national rate for the **same year**, equal-weighted, national average
= 100, `crime` label Low < 75 / Moderate 75–149 / High ≥ 150.

## Source and tooling

- **Counts:** FBI Crime Data Explorer, the CDE web app's own summarized-agency
  endpoint, which is keyless (the `api.usa.gov` mirror needs an api.data.gov
  key and rate-limits `DEMO_KEY` within minutes):
  `https://cde.ucr.cjis.gov/LATEST/summarized/agency/{ORI}/{violent-crime|property-crime}?from=01-YYYY&to=12-YYYY`.
  Each response carries the agency's monthly offense counts, its covered
  population and per-100k rates; the 12 monthly counts are summed.
- **National reference:** `NATIONAL_CRIME_REFERENCE_BY_YEAR[2023]` (violent
  363.8 / property 1916.7 per 100k).
- **Script:** `scripts/fetch-cde-tci.ts` reads
  `cde_tci_backfill_2026-09-02.input.json` (location id → ORI, curated from
  `https://cde.ucr.cjis.gov/LATEST/agency/byStateAbbr/{ST}`) and writes
  `cde_tci_backfill_2026-09-02.json`; re-runnable.
- **Year rule:** a city is indexed against the newest stored reference year in
  which the agency reported all 12 months (a month counts when both families
  are present and at least one offense of either kind was logged — a small
  town legitimately has zero-violent months). Otherwise it is **blocked**,
  never indexed from the CDE's placeholder zero/null.
- **County proxy:** five places have no municipal police agency in the CDE
  (Malabar FL, Kuna ID, McHenry MS, Indian Trail NC, Hamilton WA). For those
  the county sheriff's office is used, as the methodology allows, and the
  patch `method` text says so — it is a county-wide rate, not the town's.

## Result

| City | Agency (ORI) | FBI year | Covered pop | Violent | Property | V-idx | P-idx | TCI | Label |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Florence, AL | Florence Police Department (AL0410100) | 2023 | 42,260 | 213 | 997 | 139 | 123 | **131** | Moderate |
| Camden, AR | Camden Police Department (AR0520100) | 2023 | 10,151 | 121 | 365 | 328 | 188 | **258** | High |
| Goleta, CA | Goleta Police Department (CA042140X) | 2023 | 32,281 | 56 | 475 | 48 | 77 | **62** | Low |
| Lake Forest, CA | Lake Forest Police Department (CA030430X) | 2023 | 85,533 | 114 | 852 | 37 | 52 | **44** | Low |
| Boulder, CO | Boulder Police Department (CO0070100) | 2023 | 104,232 | 374 | 3,268 | 99 | 164 | **131** | Moderate |
| Broomfield, CO | Broomfield Police Department (CO0640100) | 2023 | 77,072 | 130 | 1,781 | 46 | 121 | **83** | Moderate |
| Fort Collins, CO | Fort Collins Police Department (CO0350300) | 2023 | 168,886 | 505 | 4,164 | 82 | 129 | **105** | Moderate |
| Grand Junction, CO | Grand Junction Police Department (CO0390100) | 2023 | 69,240 | 350 | 2,237 | 139 | 169 | **154** | High |
| Kuna, ID | Ada County Sheriff's Office (ID0010000) — county proxy | 2023 | 138,487 | 281 | 500 | 56 | 19 | **37** | Low |
| Lexington, MA | Lexington Police Department (MA0092300) | 2023 | 34,044 | 10 | 110 | 8 | 17 | **12** | Low |
| Quincy, MA | Quincy Police Department (MA0112000) | 2023 | 102,211 | 352 | 1,151 | 95 | 59 | **77** | Moderate |
| Waltham, MA | Waltham Police Department (MA0094700) | 2023 | 63,797 | 160 | 540 | 69 | 44 | **57** | Low |
| McHenry, MS | Stone County Sheriff's Office (MS0660000) — county proxy | 2023 | 14,625 | 41 | 157 | 77 | 56 | **67** | Low |
| Indian Trail, NC | Union County Sheriff's Office (NC0900000) — county proxy | 2023 | 170,556 | 156 | 1,326 | 25 | 41 | **33** | Low |
| Morrisville, NC | Morrisville Police Department (NC0921300) | 2023 | 32,259 | 40 | 868 | 34 | 140 | **87** | Moderate |
| Hudson, NH | Hudson Police Department (NH0062800) | 2023 | 25,669 | 19 | 212 | 20 | 43 | **32** | Low |
| Watertown, NY | Watertown Police Department (NY0220100) | 2023 | 24,393 | 125 | 1,015 | 141 | 217 | **179** | High |
| Ashville, OH | Ashville Police Department (OH0650200) | 2023 | 4,760 | 5 | 20 | 29 | 22 | **25** | Low |
| Oklahoma City, OK | Oklahoma City Police Department (OK0550600) | 2023 | 700,764 | 4,590 | 21,036 | 180 | 157 | **168** | High |
| Scranton, PA | Scranton Police Department (PA0350400) | 2023 | 75,687 | 236 | 1,088 | 86 | 75 | **80** | Moderate |
| Warren, PA | Warren Police Department (PA0620100) | 2023 | 9,094 | 37 | 88 | 112 | 50 | **81** | Moderate |
| North Kingstown, RI | North Kingstown Police Department (RI0050200) | 2023 | 27,943 | 21 | 163 | 21 | 30 | **26** | Low |
| Memphis, TN | Memphis Police Department (TNMPD0000) | 2023 | 616,061 | 16,118 | 53,456 | 719 | 453 | **586** | High |
| Odessa, TX | Odessa Police Department (TX0680200) | 2023 | 111,922 | 443 | 2,011 | 109 | 94 | **101** | Moderate |
| San Antonio, TX | San Antonio Police Department (TXSPD0000) | 2023 | 1,490,047 | 10,439 | 80,790 | 193 | 283 | **238** | High |
| Hamilton, WA | Skagit County Sheriff's Office (WA0290000) — county proxy | 2023 | 54,788 | 87 | 676 | 44 | 64 | **54** | Low |
| Cody, WY | Cody Police Department (WY0150100) | 2023 | 10,316 | 21 | 113 | 56 | 57 | **57** | Low |

### Blocked (NIBRS coverage gap — a valid "not reported" outcome, per the methodology)

- **Malabar, FL** (Brevard County Sheriff's Office, FL0050000): 2023 has 7/12
  reported months (3 violent / 14 property, placeholder rows); 2022 is a single
  December dump (484 / 2,485). The sheriff reports cleanly from 2024 on, so
  Malabar unblocks once a 2024 national reference is added to
  `NATIONAL_CRIME_REFERENCE_BY_YEAR` from an FBI-primary page (the 2024 FBI
  release page returned 403 to automated fetches today).
- **Jackson, MS** (Jackson Police Department, MS0250100): every month 2021–2024
  is null — Jackson PD is a non-reporting NIBRS agency (`nibrs_start_date`
  2025-01-01), the same Mississippi gap that deferred Meridian and Columbus
  (issue #302). Its legacy `crime = "D"` letter grade is left as-is.

### Legacy `crime` labels superseded

The patch is applied with `--overwrite` so the TCI-derived label replaces the
legacy consumer-site label wherever the two disagree (the methodology says the
legacy vocabulary — letter grades and unsourced Low/Moderate/High — is
superseded, and a row must not carry a TCI its own label contradicts):

| City | Legacy label | TCI label | Fit-score safety effect |
| --- | --- | --- | --- |
| Lake Forest, CA | Moderate | Low (44) | 60 → 90 |
| Kuna, ID | B | Low (37) | letter grade → 90 |
| Waltham, MA | Moderate | Low (57) | 60 → 90 |
| Indian Trail, NC | D+ | Low (33; Union County proxy) | 48 → 90 |
| Morrisville, NC | Low | Moderate (87) | 90 → 60 |

The other nine already-labelled rows keep a label the TCI agrees with.
Because these five move the safety factor, regenerate
`baselines/fit_scores.json` (`scripts/generate-score-baseline.ts`) after the
live apply, in the same commit as the apply log.

## Apply

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch data/sources/crime/cde_tci_backfill_2026-09-02.json --dry-run --overwrite
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch data/sources/crime/cde_tci_backfill_2026-09-02.json --overwrite
```

Production write only after merge (AGENTS.md).
