# Sioux Falls, SD Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 55); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Sioux Falls 2024 violent crime rate: 526.7 per 100,000 (1,111 violent crimes), FBI UCR 2024 data.
  https://www.homesnacks.com/sd/sioux-falls-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 526.7 / 359.1 * 100 = 146.7, stored as 147 (integer).

## Elections (county: Minnehaha) — discrepancy noted

- Two-party math, Minnehaha County, SD:
  - 2016: Trump 42,043 (53.72% of all votes); Clinton 30,610 (39.11% of all votes). Two-party total
    72,653. Trump two-party share 57.87%, Clinton 42.13%.
  - 2024: Trump 51,842 (55.16% of all votes); Harris 39,923 (42.48% of all votes). Two-party total
    91,765. Trump two-party share 56.51%, Harris 43.49%.
  - `rep_vote_share_change_pp` = 56.51 − 57.87 = **-1.4**
  - `dem_vote_share_change_pp` = 43.49 − 42.13 = **+1.4**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "1% more
    Republican." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_South_Dakota
    (section 7)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_South_Dakota
    (section 8)

## tags / description

- Tags: `["Parks", "Riverfront", "Arts"]`.
- Parks/Riverfront: Falls Park (123 acres) is where the Big Sioux River drops over 100 feet across
  Sioux quartzite formations, viewable from a five-story observation tower.
  https://www.experiencesiouxfalls.com/falls-park
- Arts: the Washington Pavilion houses performing arts, visual arts, and interactive science; downtown
  SculptureWalk is one of the world's largest annual public sculpture exhibits.
  https://siouxfalls.com/entertainment/recreation/
- Description written from the same facts above.

## veterans_benefits

- South Dakota has no state income tax, so military retirement pay, VA disability compensation, and
  all other income are completely tax-free at the state level.
  https://militaryretirementcalc.com/states/south-dakota-military-retirement
- Veterans with a 100% service-connected disability get a $150,000 assessed-value property tax
  exemption; 70%+ disability gets a significant reduction; paraplegic veterans get a full exemption,
  also extending to unremarried surviving spouses of permanently/totally disabled veterans or those
  with loss (or loss of use) of both lower extremities.
  https://vetcalc.org/resources/veteran-benefits/south-dakota/

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).
