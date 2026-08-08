# Mobile, AL Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 9), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Mobile)

- Two-party math, Mobile County, AL:
  - 2016: Trump 95,116; Clinton 72,186 (total two-party 167,302). Trump two-party share 56.85%,
    Clinton 43.15%.
  - 2024: Trump 100,759; Harris 72,055 (total two-party 172,814). Trump two-party share 58.31%,
    Harris 41.69%.
  - `rep_vote_share_change_pp` = 58.31 − 56.85 = **+1.5**
  - `dem_vote_share_change_pp` = 41.69 − 43.15 = **-1.5**
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Alabama
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Alabama
    (section "By county", vote totals fetched via
    `https://en.wikipedia.org/w/api.php?action=parse&page=2024_United_States_presidential_election_in_Alabama&section=10&format=json&prop=wikitext`)
- Pre-existing `election_2016`/`election_2016_percent`/`election_2024`/`election_2024_percent`/
  `election_change` ("2% more Republican")/`city_politics` ("Center") fields on this row were left
  untouched (out of scope for this patch; the pre-existing "2% more Republican" is directionally
  consistent with the +1.5 pp Republican shift computed here from the strict two-party denominator).

## tci (Safety and Social Policy)

- Mobile 2024 violent crime rate: 752.03 per 100,000 (1,783 violent crimes), FBI UCR-derived, per
  beautifydata.com's Mobile, Alabama FBI-UCR city page.
  https://www.beautifydata.com/united-states-crimes/fbi-ucr/2024/total-violent-and-property-crimes-per-city/alabama/mobile
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used for Dallas, Casper, Anchorage, and Huntsville in
  this repo).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 752.03 / 359.1 * 100 = 209.4, stored as 209 (integer).

## tags / description

- Tags: `["Beaches", "Arts", "Culture", "Military"]`.
- Beaches: Mobile sits directly on Mobile Bay along Alabama's Gulf Coast.
  https://www.visittheusa.com/destinations/alabama/mobile/
- Military: USS Alabama Battleship Memorial Park, on Mobile Bay, houses the battleship USS Alabama,
  the submarine USS Drum, and military aircraft/veteran memorials.
  https://leisuregrouptravel.com/let-the-good-times-roll-in-mobile-alabama/
- Arts/Culture: Mobile hosted the nation's first Mardi Gras celebration (1703) and supports a symphony
  orchestra plus opera and ballet companies; founded 1702, one of the oldest US cities.
  https://www.visittheusa.com/destinations/alabama/mobile/
- Description written from the same facts above.

## veterans_benefits

- Same statewide Alabama benefit summary as Huntsville, AL (see `data/huntsville_al_sources.md` for
  full citations): military retirement pay fully exempt from state income tax (Ala. Code 40-18-20, no
  age/income cap), VA disability compensation untaxed, permanently/totally disabled residents (incl.
  100% P&T veterans) exempt from ad valorem property tax on home + up to 160 adjacent acres, and VA
  Specially Adapted Housing Grant homes owe no property tax.
  https://alabamaveteran.org/2022/04/27/what-are-my-alabama-military-and-veterans-state-tax-benefits/
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Alabama

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.

`scripts/verify-location-completeness.ts` additionally flags this row as missing `defense_hub_manual` /
`defense_hub`. That bundle is out of scope for issue #29 (it belongs to the broader location-completeness
audit, issue #26) and requires a separate curatorial judgment call about defense/aerospace employer
presence per `CLAUDE.md`'s defense-hub rules, not a sourced narrative fact — left untouched here and
flagged in the issue #29 progress comment instead of being guessed at.
