# Omaha, NE Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 40). Pre-patch scan showed `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, and `veterans_benefits` missing — `description` already had a
pre-existing value and was correctly excluded from this patch. Applied via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No
other column touched.

## tci (Safety and Social Policy)

- Omaha 2024 violent crime rate: 369.0 per 100,000 (1,772 violent crimes, 19 murders), FBI 2024 data.
  https://www.homesnacks.com/ne/omaha-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 369.0 / 359.1 * 100 = 102.8, stored as 103 (integer).

## Elections (county: Douglas)

- Two-party math, Douglas County, NE:
  - 2016: Trump 108,077 (44.95% of all votes); Clinton 113,798 (47.33% of all votes). Two-party total
    221,875. Trump two-party share 48.71%, Clinton 51.29%.
  - 2024: Trump 120,919 (43.95% of all votes); Harris 148,733 (54.06% of all votes). Two-party total
    269,652. Trump two-party share 44.84%, Harris 55.16%.
  - `rep_vote_share_change_pp` = 44.84 − 48.71 = **-3.9**
  - `dem_vote_share_change_pp` = 55.16 − 51.29 = **+3.9**
  - Directionally consistent with the row's pre-existing `election_change` value of "7% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Nebraska
    (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Nebraska
    (section 11)

## tags

- Tags: `["Arts", "Parks", "Riverfront"]`.
- Arts: the Joslyn Art Museum anchors Omaha's Old Market historic district.
  https://travel.usnews.com/Omaha_NE/Things_To_Do/Omahas_Henry_Doorly_Zoo_62288/
- Parks: Omaha's Henry Doorly Zoo and Aquarium hosts the Lied Jungle (world's largest indoor
  rainforest) and Desert Dome (world's largest indoor desert).
  https://www.visitomaha.com/things-to-do/attractions/omaha-zoo-and-aquarium/
- Riverfront: the Bob Kerrey Pedestrian Bridge and Heartland of America Park sit along the Missouri
  River waterfront.

## veterans_benefits

- For tax years beginning on/after January 1, 2022, Nebraska allows all military retirees to exclude
  100% of military retirement benefits from state taxable income.
  https://veterans.nebraska.gov/income-tax-exemption-military-retirement-pay
- Starting January 1, 2026, disabled and/or blind veterans can claim a Motor Vehicle Tax and Motor
  Vehicle Fee exemption on one personally-owned vehicle. The Nebraska Homestead Exemption offers
  property tax relief for veterans totally disabled by a service-connected condition (or their
  surviving spouse), and for veterans whose home was substantially contributed to by the VA; apply
  through the county assessor. https://veterans.nebraska.gov/taxes

## Known limitations

None of the five fields this patch targeted were left blank. `description` was intentionally left
untouched (already populated pre-patch).
