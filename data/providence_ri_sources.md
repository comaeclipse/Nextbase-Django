# Providence, RI Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 52); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Providence 2024 violent crime rate: 276.7 per 100,000, FBI UCR 2024 data (22.91% below the national
  average). https://www.homesnacks.com/ri/providence-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 276.7 / 359.1 * 100 = 77.05, stored as 77 (integer).

## Elections (county: Providence)

- Two-party math, Providence County, RI:
  - 2016: Trump 90,882 (36.58% of all votes); Clinton 142,899 (57.51% of all votes). Two-party total
    233,781. Trump two-party share 38.88%, Clinton 61.12%.
  - 2024: Trump 112,443 (41.70% of all votes); Harris 150,102 (55.66% of all votes). Two-party total
    262,545. Trump two-party share 42.83%, Harris 57.17%.
  - `rep_vote_share_change_pp` = 42.83 − 38.88 = **+4.0**
  - `dem_vote_share_change_pp` = 57.17 − 61.12 = **-4.0**
  - Directionally consistent with the row's pre-existing `election_change` value of "7% less Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Rhode_Island
    (section 7)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Rhode_Island
    (section 8)

## tags / description

- Tags: `["Arts", "Culture", "Riverfront"]`.
- Riverfront/Arts: WaterFire has lit bonfires along the Woonasquatucket, Moshassuck, and Providence
  rivers in downtown Providence since 1995. https://waterfire.org/
- Culture: the RISD Museum holds 91,000+ works; the Providence Athenaeum on Benefit Street is one of
  America's oldest private libraries. https://travel.usnews.com/Providence_RI/Things_To_Do/Rhode_Island_School_of_Design_Museum_of_Art_62274/
- Description written from the same facts above.

## veterans_benefits

- Rhode Island has fully exempted military retirement pay (including SBP, RCSBP, and RSFPP annuities)
  from state income tax since tax year 2023, with no age or income limits.
  https://militaryretirementcalc.com/states/rhode-island-military-retirement
- A veteran with a 100% permanent and total disability rating qualifies for a full property tax
  exemption on their primary residence (extending to a surviving spouse who remains in the home); other
  totally disabled veterans get at least $10,000 of assessed value removed (plus an additional $10,000
  for a specially adapted housing grant); amounts, deadlines, and procedures are set locally and vary
  by city/town. https://www.veteranpcs.com/blog/rhode-island-veteran-property-tax-exemptions-2026

## Known limitations

None — all six target fields for this row were sourced and populated.
