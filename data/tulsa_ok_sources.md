# Tulsa, OK Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 49); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Tulsa 2024 violent crime rate: 942 per 100,000 (3,874 violent crimes), FBI data, 162.3% above the
  national average, up 3% year over year. https://homesnacks.com/ok/tulsa-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 942 / 359.1 * 100 = 262.3, stored as 262 (integer).

## Elections (county: Tulsa) — discrepancy noted

- Two-party math, Tulsa County, OK:
  - 2016: Trump 144,258 (58.39% of all votes); Clinton 87,847 (35.56% of all votes). Two-party total
    232,105. Trump two-party share 62.15%, Clinton 37.85%.
  - 2024: Trump 145,241 (56.53% of all votes); Harris 106,105 (41.30% of all votes). Two-party total
    251,346. Trump two-party share 57.79%, Harris 42.21%.
  - `rep_vote_share_change_pp` = 57.79 − 62.15 = **-4.4**
  - `dem_vote_share_change_pp` = 42.21 − 37.85 = **+4.4**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "5% less
    Democratic." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Oklahoma
    (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Oklahoma
    (section 10)

## tags / description

- Tags: `["Arts", "History", "Riverfront"]`.
- Arts: the Philbrook Museum of Art occupies oil magnate Waite Phillips' 1927 Italian Renaissance villa
  (8,500+ works, 23 acres of gardens, 150,000 visitors/year).
  https://travel.usnews.com/Tulsa_OK/Things_To_Do/Philbrook_Museum_of_Art_62223/
- History: Tulsa's Art Deco skyline (Boston Avenue Methodist Church, Philcade Building) reflects its
  history as the "Oil Capital of the World."
  https://justselfstorage.com/blog/what-to-do-in-tulsa-oklahoma-a-guide-to-the-city-s-best-attractions
- Riverfront: the Gathering Place (70 acres, playground, skate park, boathouse) and River Parks Trails
  run along the Arkansas River. https://www.travelok.com/tulsa
- Description written from the same facts above.

## veterans_benefits

- For tax year 2022 and after, Oklahoma fully exempts 100% of military retirement benefits (and
  disability retirement pay) from any branch of the U.S. Armed Forces from state income tax; Social
  Security benefits are also untaxed.
  https://www.gettaxreliefnow.com/main-article/military-tax-guide-oklahoma-benefits-for-service-members
- Oklahoma residents certified by the VA with a 100% permanent, service-connected disability get a full
  property tax exemption on their homestead's fair cash value; veterans with lower ratings get a
  proportional exemption. https://www.herringbank.com/learn/oklahoma-veteran-tax-exemption/

## Known limitations

None — all six target fields for this row were sourced and populated.
