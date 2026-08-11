# Houston, TX Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 57). Pre-patch scan showed `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, and `description` missing — `veterans_benefits` already had a
pre-existing value ("Partial property tax reduction") and was correctly excluded from this patch.
Applied via a single-row parameterized SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`,
transient/not committed, permanent safety check). No other column touched.

## tci (Safety and Social Policy)

- Houston 2024 violent crime rate: 1,148.2 per 100,000, FBI UCR 2024 data, independently confirmed by
  multiple sources. https://plaincrime.com/city/houston-tx
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1148.2 / 359.1 * 100 = 319.7, stored as 320 (integer).

## Elections (county: Harris)

- Two-party math, Harris County, TX:
  - 2016: Trump 545,955 (41.61% of all votes); Clinton 707,914 (53.95% of all votes). Two-party total
    1,253,869. Trump two-party share 43.55%, Clinton 56.45%.
  - 2024: Trump 722,695 (46.40% of all votes); Harris 808,771 (51.93% of all votes). Two-party total
    1,531,466. Trump two-party share 47.19%, Harris 52.81%.
  - `rep_vote_share_change_pp` = 47.19 − 43.55 = **+3.6**
  - `dem_vote_share_change_pp` = 52.81 − 56.45 = **-3.6**
  - Directionally consistent with the row's pre-existing `election_change` value of "2% less Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Texas (section 12)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Texas (section 10)

## tags / description

- Tags: `["Arts", "Parks", "Aerospace"]`.
- Arts: the Houston Museum District spans 19 museums across four walkable zones, including the Houston
  Museum of Natural Science (1.5M+ objects, 430,000+ sq ft).
  https://www.tripadvisor.com/Attractions-g56003-Activities-Houston_Texas.html
- Aerospace: Space Center Houston offers NASA facility tram tours.
  https://www.visittheusa.com/experience/space-center-houston-unforgettable-science-and-space-museum-texas
- Parks: Buffalo Bayou Park anchors downtown outdoor recreation (skate park, dog park, hiking/biking
  trails, kayak rentals). https://www.lemon8-app.com/experience/best-outdoor-adventures-and-tours-in-houston?region=us
- Description written from the same facts above.

## veterans_benefits

`veterans_benefits` was already populated on this row pre-patch ("Partial property tax reduction") and
was intentionally left untouched — out of scope for this patch. No new research was performed on this
field.

## Known limitations

None of the five fields this patch targeted were left blank. `scripts/verify-location-completeness.ts`
flags this row as missing `defense_hub_manual`/`defense_hub`, out of scope for issue #29 (belongs to
issue #26).

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Ellington Field Joint Reserve Base, with 5,000+ personnel, is headquarters of the 147th Reconnaissance Wing and the Army Reserve's 75th Training Command — a genuine, sizable military installation within Houston, beyond the tracked Collins Aerospace (1 onsite) posting.

Sources:
- Wikipedia, "Ellington Field Joint Reserve Base" — https://en.wikipedia.org/wiki/Ellington_Field_Joint_Reserve_Base
- DVIDS Hub, Ellington Field feature coverage — https://www.dvidshub.net/
