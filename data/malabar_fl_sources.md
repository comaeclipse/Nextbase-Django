# Malabar, FL Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 19), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills 5 of the 6 target fields: `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`. `tci` is deliberately left
**blank** — see below. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## tci — left blank, documented gap

- Malabar is a very small town (~3,225 residents, 2020) with no evidence of its own police department
  reporting separately to the FBI UCR/NIBRS program; it is served by Brevard County Sheriff coverage.
- AreaVibes' Malabar crime page explicitly states: "Malabar crime rates are not available from the FBI
  crime report" and that its displayed figures are "estimates ... calculated based on demographic
  data" — exactly the kind of proprietary, non-FBI-backed modeled estimate the skill's Quality Rules
  say not to use for `tci`. https://www.areavibes.com/malabar-fl/crime/
- A Brevard County-wide FBI UCR figure exists (234.5 violent crimes per 100,000, "20 reporting agencies
  represented") but is dated **2022**, not 2024, and is explicitly flagged as partial-coverage; using
  a 2-year-stale, partial-coverage county figure as a per-city substitute would create an inconsistent
  vintage against the 2024-baseline TCI values already stored for every other city in this backfill.
  https://crimebycounty.com/florida/brevard-county
- Per the skill's Quality Rules ("if a field cannot be sourced reliably, leave it blank"), `tci` is left
  NULL for this row rather than computed from an unreliable estimate or a stale/partial county proxy.

## Elections (county: Brevard)

- Two-party math, Brevard County, FL:
  - 2016: Trump 181,848 (57.16% of all votes); Clinton 119,679 (37.62% of all votes). Two-party total
    301,527. Trump two-party share 60.31%, Clinton 39.69%.
  - 2024: Trump 216,533 (59.91% of all votes); Harris 141,233 (39.07% of all votes). Two-party total
    357,766. Trump two-party share 60.53%, Harris 39.47%.
  - `rep_vote_share_change_pp` = 60.53 − 60.31 = **+0.2**
  - `dem_vote_share_change_pp` = 39.47 − 39.69 = **-0.2**
  - Net: essentially unchanged. The row's pre-existing `election_change` ("1% less Republican") points
    the opposite direction at a similarly tiny magnitude — both values are close enough to zero that
    this reads as noise/rounding-convention difference rather than a real disagreement, but is flagged
    here for transparency, same as the larger Costa Mesa/Bridgeport discrepancies. `election_change`
    left untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Florida
    (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Florida
    (section 13)

## tags / description

- Tags: `["Rural", "Small Town", "Hiking"]`.
- Rural/Small Town: incorporated 1962(1969), ~3,225 residents (2020), 299 people/sq mi, zoned
  predominantly for low-density (2 units/acre max) single-family residential.
  https://www.townofmalabar.org/town-history
- Hiking: Malabar holds an official "Florida Trail Town" designation from its own town government for
  its walking, biking, and paddling trail network through conservation areas.
  https://www.townofmalabar.org/parks-and-recreation-department/pages/florida-trail-town
- Description written from the same facts above. (Turkey Creek Sanctuary, sometimes associated with the
  "Malabar" name via Port Malabar Blvd, is physically located in neighboring Palm Bay, FL, not Malabar
  itself, so it was not claimed as a Malabar attraction.)

## veterans_benefits

- Florida has no state individual income tax, so military retirement pay and VA disability compensation
  are entirely state-tax-free by default. https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Florida
- A veteran with a 100% permanent and total VA disability rating gets a full homestead property tax
  exemption; partially disabled veterans get a $5,000 assessed-value reduction, and veterans 65+ get a
  percentage discount matching their disability rating; deployed service members get an exemption
  proportional to days deployed outside the continental U.S. Apply by March 1.
  https://www.veteranpcs.com/blog/florida-veteran-property-tax-exemptions-2026

## Known limitations

- `tci` intentionally left blank — see dedicated section above. This should be revisited if/when
  Malabar (or a clean, current-year Brevard County aggregate) gets a directly reported FBI UCR/NIBRS
  figure.
- `scripts/verify-location-completeness.ts` also flags this row as missing `lgbtq_mei_score`, out of
  scope for issue #29 (belongs to issue #26).
