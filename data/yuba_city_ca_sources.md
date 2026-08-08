# Yuba City, CA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 13), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Sutter)

- Two-party math, Sutter County, CA:
  - 2016: Trump 18,176 (54.22%); Clinton 13,076 (39.01%). Two-party total 31,252. Trump two-party share
    58.16%, Clinton 41.84%.
  - 2024: Trump 25,372 (64.50%); Harris 13,016 (33.09%). Two-party total 38,388. Trump two-party share
    66.09%, Harris 33.91%.
  - `rep_vote_share_change_pp` = 66.09 − 58.16 = **+7.9**
  - `dem_vote_share_change_pp` = 33.91 − 41.84 = **-7.9**
  - This is directionally and closely consistent with the row's pre-existing `election_change` value of
    "10% more Republican" (legacy import; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_California
    (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_California
    (section 13)

## tci (Safety and Social Policy)

- Yuba City 2024 violent crime rate: 424 per 100,000, FBI UCR-derived (data released by the FBI
  September 2025), per AreaVibes. https://www.areavibes.com/yuba+city-ca/crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 424 / 359.1 * 100 = 118.1, stored as 118 (integer). Note: a secondary source
  (crimeexplorer.com) reported a materially different and internally confusing figure (an "84.6 average
  over 2019-2024" framed ambiguously); AreaVibes' explicitly-dated, explicitly-FBI-sourced 2024 figure
  was preferred as the more clearly documented single-year value, consistent with the methodology used
  for other cities in this backfill.

## tags / description

- Tags: `["Rural", "Riverfront", "Small Town"]` (all three already used elsewhere in this dataset's tag
  vocabulary).
- Rural: agriculture (rice, walnuts, plums/prunes, peaches, tomatoes, almonds) accounts for roughly 14%
  of Yuba City-area businesses and 19% of the workforce; Sunsweet's Yuba City headquarters is the
  world's largest dried-fruit processing plant. https://californiagrown.org/blog/yuba-sutter-farm-bureau/
- Riverfront: Yuba City sits at the confluence of the Feather and Yuba rivers in the Sacramento Valley,
  40 miles north of Sacramento. https://www.britannica.com/place/Yuba-City
- Description written from the same facts above.

## veterans_benefits

- Same statewide California benefit summary as Costa Mesa, CA (see `data/costa_mesa_ca_sources.md` for
  full citations): $20,000 military-retired-pay income exclusion starting tax year 2025 (income-capped
  at $125k single/HoH or $250k joint); VA disability untaxed; Disabled Veterans' Property Tax Exemption
  ($180,671 off assessed value, or $271,009 for low-income households under $81,131) for a 100%
  VA-rated (or TDIU) veteran.
  https://veteranlife.com/military-benefits/california-military-retirement-tax
  https://vareadyapp.com/states/california.html

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` also flags this row as missing `lgbtq_mei_score`, which is
out of scope for issue #29 (belongs to the broader issue #26 audit) and was not researched here.
