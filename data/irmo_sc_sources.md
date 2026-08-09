# Irmo, SC Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 53). Pre-patch scan showed `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, and `veterans_benefits` missing — `description` already had a
pre-existing value and was correctly excluded from this patch. Applied via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No
other column touched.

## tci (Safety and Social Policy)

- Irmo 2024 violent crime rate: 238.1 per 100,000 (29 violent crimes), FBI UCR 2024 data (33.67% below
  the national average). https://www.homesnacks.com/sc/irmo-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 238.1 / 359.1 * 100 = 66.3, stored as 66 (integer).

## Elections (county: Lexington)

- Irmo spans parts of both Lexington and Richland counties; this row's existing `county` field
  ("Lexington") was used for consistency with the already-curated geography.
- Two-party math, Lexington County, SC:
  - 2016: Trump 80,026 (65.55% of all votes); Clinton 35,230 (28.86% of all votes). Two-party total
    115,256. Trump two-party share 69.43%, Clinton 30.57%.
  - 2024: Trump 96,965 (66.01% of all votes); Harris 47,815 (32.55% of all votes). Two-party total
    144,780. Trump two-party share 66.98%, Harris 33.02%.
  - `rep_vote_share_change_pp` = 66.98 − 69.43 = **-2.5**
  - `dem_vote_share_change_pp` = 33.02 − 30.57 = **+2.5**
  - Directionally consistent with the row's pre-existing `election_change` value of "4% less Republican"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_South_Carolina
    (section 10)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_South_Carolina
    (section 9)

## tags

- Tags: `["Suburban", "Small Town", "Lake"]`.
- Irmo is a suburban community 12 miles northwest of Columbia, on the banks of 50,000-acre Lake Murray
  (650 miles of shoreline), originally a railroad-stop settlement; hosts the annual Irmo Okra Strut
  festival. https://www.islands.com/2042879/irmo-just-outside-columbia-charming-south-carolina-suburb-banks-lake-muray/

## veterans_benefits

- Same statewide South Carolina benefit summary as Greenville, SC (see `data/greenville_sc_sources.md`
  for full citations): military retirement pay fully exempt from state income tax since 2022 (incl.
  SBP/RCSBP/RSFPP), VA disability untaxed; 100% total/permanent disabled veterans get a full property
  tax exemption on homestead + up to 5 acres and up to two vehicles.

## Known limitations

None of the five fields this patch targeted were left blank. `description` was intentionally left
untouched (already populated pre-patch). `scripts/verify-location-completeness.ts` flags this row as
missing `lgbtq_mei_score`, out of scope for issue #29 (belongs to issue #26).
