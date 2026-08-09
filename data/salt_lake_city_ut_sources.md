# Salt Lake City, UT Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 59); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Salt Lake City 2024 violent crime rate: 864.2 per 100,000 (1,838 violent crimes), FBI 2024 data,
  140.73% above the national average. https://www.homesnacks.com/ut/salt-lake-city-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 864.2 / 359.1 * 100 = 240.7, stored as 241 (integer).

## Elections (county: Salt Lake) — large discrepancy noted

- Two-party math, Salt Lake County, UT:
  - 2016: Trump 138,043 (32.58% of all votes); Clinton 175,863 (41.50% of all votes). Two-party total
    313,906. Trump two-party share 43.98%, Clinton 56.02%.
  - 2024: Trump 221,555 (43.47% of all votes); Harris 273,658 (53.70% of all votes). Two-party total
    495,213. Trump two-party share 44.74%, Harris 55.26%.
  - `rep_vote_share_change_pp` = 44.74 − 43.98 = **+0.8**
  - `dem_vote_share_change_pp` = 55.26 − 56.02 = **-0.8**
  - **This is the opposite direction** from the row's pre-existing `election_change` value of "12% more
    Democratic" (a large, notable discrepancy — one of the largest found in this backfill). The
    2016 Utah presidential race had an unusually large third-party/independent vote share statewide
    (Utah-connected independent Evan McMullin ran that year), which is a plausible contributor to why a
    strict two-party recompute diverges so much from whatever method produced the legacy field, but this
    was not independently verified against Salt Lake County-specific data as part of this patch — flagged
    for transparency and a closer look by a future pass, not reconciled here. `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Utah (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Utah (section 10)

## tags / description

- Tags: `["History", "Culture", "Mountains"]`.
- History/Culture: Temple Square, a National Historic Landmark, is headquarters of The Church of Jesus
  Christ of Latter-day Saints and home to the Salt Lake Temple and Tabernacle.
  https://www.viator.com/Salt-Lake-City/d5200
- Mountains: 11 ski resorts (including Alta with 2,600+ acres/118 runs, and Snowbird) line the Wasatch
  Mountains less than an hour from the airport. https://www.visitutah.com/plan-your-trip/plan-your-ski-trip/utahs-easy-access
- Description written from the same facts above.

## veterans_benefits

- Utah effectively fully exempts military retirement pay through a nonrefundable tax credit (since
  2021) offsetting the state's flat 4.55% income tax rate on that income, resulting in a near-zero
  effective tax. https://militaryretirementcalc.com/states/utah-military-retirement
- Disabled veterans with a 10%+ VA rating (plus Utah residency) qualify for a property tax abatement,
  prorated by disability percentage, on up to $535,459 of taxable value for a 100% P&T veteran (2026
  maximum); VA disability compensation itself is untaxed.
  https://vetunlock.com/benefits/utah/property-tax-exemption

## Known limitations

None — all six target fields for this row were sourced and populated.
