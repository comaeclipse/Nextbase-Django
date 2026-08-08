# Huntsville, AL Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 8), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Madison)

- Two-party math, Madison County, AL:
  - 2016: Trump 89,520; Clinton 62,822 (total two-party 152,342). Trump two-party share 58.77%,
    Clinton 41.23%.
  - 2024: Trump 105,430; Harris 87,824 (total two-party 193,254). Trump two-party share 54.57%,
    Harris 45.43%.
  - `rep_vote_share_change_pp` = 54.57 − 58.77 = **-4.2**
  - `dem_vote_share_change_pp` = 45.43 − 41.23 = **+4.2**
  - Direction: Madison County moved toward Democrats since 2016 (Huntsville's tech/NASA-driven growth
    is the commonly cited local explanation, not itself used as a data source here).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API to get the specific
  section rather than the full page, which is too large to reliably extract from in one fetch):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Alabama
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Alabama
    (section "By county", vote totals fetched via
    `https://en.wikipedia.org/w/api.php?action=parse&page=2024_United_States_presidential_election_in_Alabama&section=10&format=json&prop=wikitext`)
- Pre-existing `election_2016`/`election_2016_percent`/`election_2024`/`election_2024_percent`/
  `election_change`/`city_politics` fields on this row were left untouched (out of scope for this
  patch; note `election_change` already reads "1% les Repuiblican" — a pre-existing typo/vocabulary
  issue from the legacy import, not introduced or corrected here).

## tci (Safety and Social Policy)

- Huntsville 2024 violent crime rate: 483.2 per 100,000, FBI UCR-derived, per PlainCrime's Huntsville
  city profile. https://plaincrime.com/city/huntsville-al
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline document used for Dallas, Casper, and Anchorage in this
  repo, for cross-city consistency).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 483.2 / 359.1 * 100 = 134.55, stored as 135 (integer).

## tags / description

- Tags: `["Military", "Tech", "Arts", "Culture"]`.
- Military/Tech: Redstone Arsenal (U.S. Army) and NASA's Marshall Space Flight Center are both
  headquartered in Huntsville, driving the city's "Rocket City" identity and its tech/aerospace
  employment base. https://en.wikipedia.org/wiki/Marshall_Space_Flight_Center ,
  https://choosehuntsville.com/blog/how-huntsville-became-rocket-city/
- Arts/Culture: U.S. Space & Rocket Center draws over 1 million visitors/year and anchors the city's
  museum/cultural attractions. https://en.wikipedia.org/wiki/U.S._Space_%26_Rocket_Center
- Description written from the same two facts above.

## veterans_benefits

- Alabama fully exempts military retirement pay from state income tax under Ala. Code 40-18-20 (no age
  or income cap); VA disability compensation is untaxed.
  https://alabamaveteran.org/2022/04/27/what-are-my-alabama-military-and-veterans-state-tax-benefits/
- Permanently and totally disabled Alabama residents (including 100% P&T veterans) are exempt from ad
  valorem property tax on their home and up to 160 adjacent acres; veterans who obtained their home via
  a VA Specially Adapted Housing Grant owe no property tax on it regardless of value.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Alabama

## Known limitations

None — all six target fields for this row were sourced and populated.
