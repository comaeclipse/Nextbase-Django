# Little Rock, AR Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 10), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Pulaski)

- Two-party math, Pulaski County, AR:
  - 2016: Trump 61,257; Clinton 89,574 (total two-party 150,831). Trump two-party share 40.62%,
    Clinton 59.38%.
  - 2024: Trump 57,977; Harris 92,038 (total two-party 150,015). Trump two-party share 38.65%,
    Harris 61.35%.
  - `rep_vote_share_change_pp` = 38.65 − 40.62 = **-2.0**
  - `dem_vote_share_change_pp` = 61.35 − 59.38 = **+2.0**
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific section
  index rather than the full page, which truncates before reaching Pulaski County alphabetically):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Arkansas (section
    10, "By county")
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Arkansas (section
    8, "By county")
- Pre-existing `election_2016`/`election_2016_percent`/`election_2024`/`election_2024_percent`/
  `election_change` ("4% more Democratic")/`city_politics` ("Moderate left") on this row were left
  untouched — directionally consistent with the +2.0 pp Democratic shift computed here.

## tci (Safety and Social Policy)

- Little Rock 2024 violent crime rate: 1,672.0 per 100,000 (3,415 violent crimes), FBI UCR-derived, per
  PlainCrime's Little Rock city profile. https://plaincrime.com/city/little-rock-ar
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used consistently across this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1672.0 / 359.1 * 100 = 465.6, stored as 466 (integer). This is a materially high TCI value;
  flagged here for visibility since it is well above the other Cohort A cities processed so far.

## tags / description

- Tags: `["Arts", "Culture", "Hiking"]`.
- Arts/Culture: William J. Clinton Presidential Library and Museum sits on a 30-acre riverfront campus
  in downtown Little Rock. https://www.visittheusa.com/destinations/arkansas/little-rock/
- Hiking: the Arkansas River Trail runs along the downtown riverfront past the Clinton Presidential
  Park Bridge and wetlands boardwalks. https://www.visittheusa.com/destinations/arkansas/little-rock/
- Description written from the same facts; Little Rock Air Force Base is located ~15 miles away in
  Jacksonville, AR, not within Little Rock proper, so a "Military" tag was not added for this row.

## veterans_benefits

- Arkansas fully exempts military retirement pay from state income tax, effective January 1, 2018;
  veterans may also claim the state's separate $6,000 exemption on other retirement income (e.g. IRA
  distributions) in addition to the military exemption.
  https://blog.aarp.org/fighting-for-you/veterans-tax-relief-legislation
- A veteran with a 100% service-connected VA disability rating (or VA special monthly compensation for
  loss/loss-of-use of a limb, or total blindness) is fully exempt from property tax on a primary
  residence and personal property, with no dollar cap.
  https://www.hillandponton.com/arkansas-state-benefits/

## Known limitations

None — all six target fields for this row were sourced and populated.
