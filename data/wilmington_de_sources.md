# Wilmington, DE Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 17), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: New Castle)

- Two-party math, New Castle County, DE:
  - 2016: Trump 85,525 (32.52% of all votes); Clinton 162,919 (61.95% of all votes). Two-party total
    248,444. Trump two-party share 34.43%, Clinton 65.57%.
  - 2024: Trump 90,868 (32.82% of all votes); Harris 180,700 (65.27% of all votes). Two-party total
    271,568. Trump two-party share 33.46%, Harris 66.54%.
  - `rep_vote_share_change_pp` = 33.46 − 34.43 = **-1.0**
  - `dem_vote_share_change_pp` = 66.54 − 65.57 = **+1.0**
  - Directionally consistent with the row's pre-existing `election_change` value of "4% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Delaware
    (section 13)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Delaware
    (section 13)

## tci (Safety and Social Policy)

- Wilmington 2024 violent crime rate: 1,127.05 per 100,000 (811 violent crimes: 598 aggravated assault,
  183 robbery, 25 murder), FBI UCR-derived. https://beautifydata.com/united-states-crimes/fbi-ucr/2024/number-and-rate-of-violent-crimes-per-city/delaware/wilmington
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1127.05 / 359.1 * 100 = 313.9, stored as 314 (integer).

## tags / description

- Tags: `["Arts", "Culture", "Riverfront"]`.
- Arts/Culture: the Delaware Art Museum (Pre-Raphaelite collection, Howard Pyle illustrations) and the
  Delaware Contemporary (rotating exhibitions) are both in Wilmington.
  https://www.visitwilmingtonde.com/blog/stories/post/25-arts-cultural-experiences-to-discover-in-greater-wilmington-the-brandywine-valley/
- Riverfront: Wilmington's Riverfront district on the Christina River hosts the Blue Rocks ballpark,
  Delaware Children's Museum, and Riverwalk. https://www.visitwilmingtonde.com/things-to-do/cities-and-neighborhoods/wilmington-riverfront/
- Description written from the same facts above; the Brandywine River Museum of Art itself is in Chadds
  Ford, PA (not Wilmington), so it was mentioned only as a nearby Brandywine Valley attraction, not
  claimed as within the city.

## veterans_benefits

- Delaware exempts military pension income from state income tax regardless of age; the exemption
  increases from $12,500 to $25,000 for taxable years beginning on/after January 1, 2026 (the
  age-60+ restriction was also removed).
  https://themilitarywallet.com/military-retirement-pay-tax-exempt/
- A veteran with a 100% VA-rated service-connected permanent and total disability (or 100% via
  individual unemployability) who has held Delaware domicile for 3+ years qualifies for a full county
  property tax and non-vocational school district property tax exemption on their primary residence
  (apply by April 30). https://sussexcountyde.gov/disabled-veterans-school-tax-credit

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` additionally flags this row as missing `tech_hub`,
`defense_hub_manual`, and `defense_hub`. Those are out of scope for issue #29 (belong to issue #26) and
were not researched or populated here.

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Delaware Army National Guard headquarters is located in Wilmington, and New Castle Air National Guard Base (home of the 166th Airlift Wing) is in the same urbanized area, sharing Wilmington's metro/commuting geography even though the base's mailing address is technically New Castle.

Sources:
- Wikipedia, "New Castle Air National Guard Base" — https://en.wikipedia.org/wiki/New_Castle_Air_National_Guard_Base
- Wikipedia, "Delaware Air National Guard" — https://en.wikipedia.org/wiki/Delaware_Air_National_Guard
- Wikipedia, "166th Airlift Wing" — https://en.wikipedia.org/wiki/166th_Airlift_Wing
