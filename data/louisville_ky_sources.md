# Louisville, KY Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 27); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Louisville (city) 2024 violent crime rate: 707 per 100,000, explicitly FBI UCR-sourced ("This data
  reflects the 2024 calendar year and was released from the FBI in September, 2025"), per AreaVibes;
  97% above the national average. https://www.areavibes.com/louisville-ky/crime/
  - Note: a Louisville *Metro* figure of 760.3/100k also appears in secondary sources; the city-proper
    707/100k figure was used since this dataset's row represents the city, not the consolidated
    metro/county government.
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 707 / 359.1 * 100 = 196.9, stored as 197 (integer).

## Elections (county: Jefferson)

- Two-party math, Jefferson County, KY:
  - 2016: Trump 143,768 (40.72% of all votes); Clinton 190,836 (54.05% of all votes). Two-party total
    334,604. Trump two-party share 42.96%, Clinton 57.04%.
  - 2024: Trump 144,553 (40.64% of all votes); Harris 203,070 (57.09% of all votes). Two-party total
    347,623. Trump two-party share 41.59%, Harris 58.41%.
  - `rep_vote_share_change_pp` = 41.59 − 42.96 = **-1.4**
  - `dem_vote_share_change_pp` = 58.41 − 57.04 = **+1.4**
  - Directionally consistent with the row's pre-existing `election_change` value of "3% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Kentucky
    (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Kentucky
    (section 9)

## tags / description

- Tags: `["History", "Culture", "Riverfront"]`.
- History/Culture: Churchill Downs opened in 1875 and hosted the first Kentucky Derby and Kentucky Oaks
  that year; the Kentucky Derby Museum holds 20,000+ artifacts and 170+ bourbons.
  https://en.wikipedia.org/wiki/Churchill_Downs , https://www.derbymuseum.org/
- Riverfront: Waterfront Park sits along the Ohio River in downtown Louisville.
  https://www.visittheusa.com/destinations/kentucky/louisville/
- Description written from the same facts above.

## veterans_benefits

- Kentucky Army/Air Force official benefits page: service members who retired before January 1, 1998
  are fully exempt from state income tax on retired pay; those who retired after December 31, 1997 may
  exclude up to $31,110 (adjusted every two years), with additional pro-rated exclusion via Schedule P
  for those with pre-1998 creditable service.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Kentucky
- Kentucky homeowners who are 65+ or totally disabled qualify for a homestead exemption deducted from
  their home's assessed value ($49,100 for the 2025-2026 assessment years, recalculated every two
  years). https://www.aarp.org/states/kentucky/state-tax-guide/

## Known limitations

None — all six target fields for this row were sourced and populated.
