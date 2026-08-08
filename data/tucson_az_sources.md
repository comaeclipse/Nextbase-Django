# Tucson, AZ Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 11), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Pima)

- Two-party math, Pima County, AZ:
  - 2016: Trump 167,428; Clinton 224,661 (total two-party 392,089). Trump two-party share 42.70%,
    Clinton 57.30%.
  - 2024: Trump 214,669; Harris 292,450 (total two-party 507,119). Trump two-party share 42.33%,
    Harris 57.67%.
  - `rep_vote_share_change_pp` = 42.33 − 42.70 = **-0.4**
  - `dem_vote_share_change_pp` = 57.67 − 57.30 = **+0.4**
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Arizona (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Arizona (section 10)
- Pre-existing `election_change` on this row already read "4% more Democratic" (legacy import, unknown
  methodology) — directionally consistent with, though larger in magnitude than, the +0.4 pp two-party
  Democratic shift computed here. Left untouched; only the two new pp columns were added.

## tci (Safety and Social Policy)

- Tucson 2024 violent crime rate: 588.75 per 100,000 (3,231 violent crimes), FBI UCR-derived.
  https://www.beautifydata.com/united-states-crimes/fbi-ucr/number-and-rate-of-crimes-trend-per-city/violent/arizona/tucson
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 588.75 / 359.1 * 100 = 163.9, stored as 164 (integer).

## tags / description

- Tags: `["Military", "Hiking", "Mountains"]`.
- Military: Davis-Monthan Air Force Base is located within Tucson's city limits.
  https://mybaseguide.com/davis-monthan-afb-welcome-center
- Hiking/Mountains: Saguaro National Park has two districts flanking the city (Rincon Mountain
  District to the east, Tucson Mountain District to the west), with saguaro cactus forests and hiking
  trails of varying difficulty.
  https://afcrashpad.com/base-guide/davis-monthan-air-force-base/
- Description written from the same two facts above.

## veterans_benefits

- Same statewide Arizona benefit summary as Phoenix, AZ (see `data/phoenix_az_sources.md` for full
  citations): military retirement pay (incl. SBP) fully exempt from state income tax since tax year
  2021 with no cap; 100% VA-disabled veterans get a full property tax exemption on their primary
  residence with no assessed-value limit, lower ratings get a partial exemption capped near $4,748 of
  assessed value.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Arizona
  https://vetunlock.com/benefits/arizona/property-tax-100

## Known limitations

None — all six target fields for this row were sourced and populated.
