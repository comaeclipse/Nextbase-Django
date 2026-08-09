# Bremerton, WA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 62); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Bremerton 2024 violent crime rate: 434.0 per 100,000 (200 violent crimes), FBI UCR data, 20.90%
  above the national average. https://www.homesnacks.com/wa/bremerton-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 434.0 / 359.1 * 100 = 120.9, stored as 121 (integer).

## Elections (county: Kitsap)

- Two-party math, Kitsap County, WA:
  - 2016: Trump 49,018 (38.07% of all votes); Clinton 63,156 (49.05% of all votes). Two-party total
    112,174. Trump two-party share 43.70%, Clinton 56.30%.
  - 2024: Trump 59,080 (37.66% of all votes); Harris 91,731 (58.48% of all votes). Two-party total
    150,811. Trump two-party share 39.18%, Harris 60.82%.
  - `rep_vote_share_change_pp` = 39.18 − 43.70 = **-4.5**
  - `dem_vote_share_change_pp` = 60.82 − 56.30 = **+4.5**
  - Directionally consistent with the row's pre-existing `election_change` value of "10% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Washington_(state)
    (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Washington_(state)
    (section 9)

## tags / description

- Tags: `["Military", "History", "Coastal"]`.
- Military: the Puget Sound Naval Shipyard anchors Bremerton's downtown waterfront.
  https://pugetsoundnavymuseum.org/plan-a-day-trip/
- History/Coastal: the free Puget Sound Navy Museum and the USS Turner Joy (a Vietnam-era destroyer,
  now the Naval Destroyer Museum) sit on the Bremerton Boardwalk.
  https://www.wonderfulmuseums.com/museum/naval-museum-in-bremerton/
- Description written from the same facts above.

## veterans_benefits

- Washington has no state income tax, so military retirement pay is completely tax-free at the state
  level. https://militaryretirementcalc.com/states/washington-military-retirement
- Veterans with an 80%+ disability rating (or paid at the 100% rate) qualify for an income-based
  property tax exemption for taxes levied for collection in 2026 (threshold drops to 40% starting with
  taxes levied for collection in 2027); VA disability compensation and DIC are excluded entirely from
  the eligibility income calculation, though other military retirement pay counts toward the threshold.
  https://www.enoughfp.com/blog/2026/2026-planning-for-2027-savings-updates-for-washington-state-property-taxes

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `lgbtq_mei_score`, out of scope for
issue #29 (belongs to issue #26).
