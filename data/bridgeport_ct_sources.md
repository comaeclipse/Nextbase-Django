# Bridgeport, CT Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 16), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Fairfield) — discrepancy noted

- Connecticut counties have no governmental function and the state's official returns are compiled by
  town, but Wikipedia's "By county" tables aggregate town-level official returns up to county totals,
  which is the geography this dataset's existing rows use (`county = "Fairfield"` was already set on
  this row) — so county-level was used here for consistency with the rest of this dataset.
- Two-party math, Fairfield County, CT:
  - 2016: Trump 160,077 (38.00% of all votes); Clinton 243,852 (57.89% of all votes). Two-party total
    403,929. Trump two-party share 39.63%, Clinton 60.37%.
  - 2024: Trump 178,263 (39.41% of all votes); Harris 267,019 (59.04% of all votes). Two-party total
    445,282. Trump two-party share 40.03%, Harris 59.97%.
  - `rep_vote_share_change_pp` = 40.03 − 39.63 = **+0.4**
  - `dem_vote_share_change_pp` = 59.97 − 60.37 = **-0.4**
  - Net: essentially unchanged, very slightly more Republican by strict two-party math (Harris still
    won the county by a wide margin in both raw-percentage and two-party terms).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Connecticut
    (section 12)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Connecticut
    (section 9)
- **Discrepancy**: this row's pre-existing (legacy, unmodified) `election_change` already read "4% more
  Democratic" — the opposite direction from the +0.4 pp Republican shift computed here. As with Costa
  Mesa, CA (see `data/costa_mesa_ca_sources.md`), this is left unresolved and flagged rather than
  silently reconciled — the legacy field's methodology/geography is undocumented and out of scope to
  investigate here. Only the two new pp columns were added; `election_change` was not modified.

## tci (Safety and Social Policy)

- Bridgeport 2024 violent crime rate: 393 per 100,000 (582 violent crimes), FBI UCR-derived (data
  released by the FBI September 2025), per AreaVibes. https://www.areavibes.com/bridgeport-ct/crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 393 / 359.1 * 100 = 109.4, stored as 109 (integer).

## tags / description

- Tags: `["Coastal", "Arts", "Culture"]`.
- Coastal: Bridgeport fronts Long Island Sound; Seaside Park runs 2.5 miles of Sound waterfront across
  325 acres, designed by Frederick Law Olmsted and Calvert Vaux (the designers of NYC's Central Park).
  https://www.thecrazytourist.com/25-best-things-bridgeport-ct/
- Arts/Culture: the Barnum Museum documents P.T. Barnum's life and legacy in the city; the Housatonic
  Museum of Art holds a 20th-century American art collection.
  https://whichmuseum.com/place/bridgeport-2888
- Description written from the same facts above.

## veterans_benefits

- Connecticut fully exempts military retirement pay from state income tax with no age or income
  conditions (unlike its other-pension AGI thresholds).
  https://militaryretirementcalc.com/states/connecticut-military-retirement
- A veteran with a 100% Permanent & Total VA disability rating gets a full property tax exemption on
  their primary residence, effective October 1, 2024; veterans with 10%+ ratings may get a partial
  exemption based on age/rating/income (at least $10,500 for a 100%-rated veteran under $18,000 income,
  $21,000 if married); any veteran with 90+ days of wartime service (including WWII Merchant Marines)
  qualifies for a $1,500 exemption on real estate or a vehicle.
  https://vetcalc.org/veteran-benefits/connecticut/

## Known limitations

- Flagging the `election_change` direction conflict described above (same pattern as Costa Mesa, CA)
  for a maintainer/future pass — left untouched in this patch since it is outside issue #29's scope.
