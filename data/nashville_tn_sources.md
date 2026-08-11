# Nashville, TN Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 56); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Nashville 2024 violent crime rate: 1,124.1 per 100,000, FBI UCR data (ranked #13 among major U.S.
  cities for violent crime). https://www.wsmv.com/2025/09/04/nashvilles-violent-crime-rate-among-top-15-nationwide-2024-per-fbi-data/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill, and independently
  confirmed by this WSMV article's own citation of the national rate).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1124.1 / 359.1 * 100 = 313.0, stored as 313 (integer).

## Elections (county: Davidson)

- Two-party math, Davidson County, TN:
  - 2016: Trump 84,550 (33.95% of all votes); Clinton 148,864 (59.77% of all votes). Two-party total
    233,414. Trump two-party share 36.22%, Clinton 63.78%.
  - 2024: Trump 102,256 (35.26% of all votes); Harris 181,862 (62.70% of all votes). Two-party total
    284,118. Trump two-party share 35.99%, Harris 64.01%.
  - `rep_vote_share_change_pp` = 35.99 − 36.22 = **-0.2**
  - `dem_vote_share_change_pp` = 64.01 − 63.78 = **+0.2**
  - Directionally consistent with the row's pre-existing `election_change` value of "3% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Tennessee
    (section 10)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Tennessee
    (section 9)

## tags / description

- Tags: `["Music", "History", "Culture"]`.
- Music/Culture: Broadway's honky-tonks (Tootsie's Orchid Lounge and others) and the Country Music Hall
  of Fame anchor Nashville's "Music City" identity.
  https://www.trolleytours.com/nashville/country-music-hall-of-fame
- History: the Ryman Auditorium, the "Mother Church of Country Music," is a historic downtown venue
  near Broadway. https://franklinis.com/visiting-nashville-tn-your-guide-to-broadway-history-honky-tonks-hidden-gems/
- Description written from the same facts above.

## veterans_benefits

- Tennessee has no state income tax, so military retirement pay, VA disability compensation, and all
  other income are entirely untaxed at the state level.
  https://militaryretirementcalc.com/states/tennessee-military-retirement
- Tennessee provides property tax relief (reimbursement, not a blanket exemption) covering property
  taxes on up to $175,000 of a disabled veteran's home value; veterans with a 100% total
  service-connected disability rating are eligible for a property tax exemption on their primary
  residence. https://usmilitary.org/veteran-benefits-state/tennessee/

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Berry Field Air National Guard Base, headquarters of the entire Tennessee Air National Guard and home to the 118th Wing (1,200+ personnel), is located at Nashville International Airport — a substantial, genuinely Nashville-based military presence beyond the tracked Collins Aerospace (1 onsite) and L3Harris (1 onsite) postings.

Sources:
- Wikipedia, "118th Wing" — https://en.wikipedia.org/wiki/118th_Wing
- Air National Guard, unit locations page — https://www.ang.af.mil/
- Tennessee.gov, Tennessee Military Department — https://www.tn.gov/military.html
