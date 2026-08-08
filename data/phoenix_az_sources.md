# Phoenix, AZ Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 12), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Maricopa)

- Two-party math, Maricopa County, AZ:
  - 2016: Trump 747,361; Clinton 702,907 (total two-party 1,450,268). Trump two-party share 51.53%,
    Clinton 48.47%.
  - 2024: Trump 1,051,531; Harris 980,016 (total two-party 2,031,547). Trump two-party share 51.76%,
    Harris 48.24%.
  - `rep_vote_share_change_pp` = 51.76 − 51.53 = **+0.2**
  - `dem_vote_share_change_pp` = 48.24 − 48.47 = **-0.2**
  - Net: essentially unchanged / very slightly more Republican since 2016 by strict two-party math.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Arizona (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Arizona (section 10)
- Pre-existing `election_change` on this row already read "3% more Republican" (legacy import,
  different/unknown methodology) — directionally consistent with, though larger in magnitude than, the
  +0.2 pp two-party shift computed here. Left untouched; only the two new pp columns were added.

## tci (Safety and Social Policy)

- Phoenix 2024 violent crime rate: 799.6 per 100,000, FBI UCR-derived (123% above the national
  average). https://www.eufy.com/blogs/security-system/phoenix-crime-rate
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 799.6 / 359.1 * 100 = 222.7, stored as 223 (integer).

## tags / description

- Tags: `["Golf", "Hiking", "Arts", "Culture"]`.
- Golf/Hiking: South Mountain Park — the largest municipal park in the U.S. — hosts multiple desert
  golf courses (Arizona Grand, Foothills, Raven) plus extensive hiking/biking trails.
  https://matadornetwork.com/destinations/north-america/united-states/phoenix-united-states/nature-parks/
- Arts/Culture: downtown Phoenix hosts the Heard Museum (Native American art/culture, 200,000
  visitors/year), the Phoenix Art Museum, Arizona Science Center, and the Roosevelt Row arts district.
  https://www.wonderfulmuseums.com/museum/downtown-phoenix-museums/
- Description written from the South Mountain Park facts above.

## veterans_benefits

- Arizona has fully exempted military retirement pay (including Survivor Benefit Plan payments) from
  state income tax since tax year 2021, with no dollar cap.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Arizona
- A veteran with a 100% VA service-connected disability rating gets a full property tax exemption on
  their primary residence with no assessed-value limit; veterans with lower disability ratings may
  qualify for a partial exemption subject to income and assessed-value limits (capped near $4,748 of
  assessed value, adjusted annually for inflation).
  https://vetunlock.com/benefits/arizona/property-tax-100

## Known limitations

None — all six target fields for this row were sourced and populated.
