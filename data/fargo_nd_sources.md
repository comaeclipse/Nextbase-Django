# Fargo, ND Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 39); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Fargo 2024 violent crime rate: 498.2 per 100,000, FBI UCR 2024 data (38.78% above the national
  average). A separate InForum analysis independently cites 503/100k for the same year, closely
  consistent. https://www.homesnacks.com/nd/fargo-crime/ , https://www.inforum.com/news/fargo/crime-higher-than-10-years-ago-in-fargo-lower-in-moorhead-and-west-fargo-analysis-finds
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 498.2 / 359.1 * 100 = 138.7, stored as 139 (integer).

## Elections (county: Cass) — discrepancy noted

- Two-party math, Cass County, ND:
  - 2016: Trump 39,816 (49.26% of all votes); Clinton 31,361 (38.80% of all votes). Two-party total
    71,177. Trump two-party share 55.94%, Clinton 44.06%.
  - 2024: Trump 47,873 (52.69% of all votes); Harris 40,304 (44.36% of all votes). Two-party total
    88,177. Trump two-party share 54.29%, Harris 45.71%.
  - `rep_vote_share_change_pp` = 54.29 − 55.94 = **-1.7**
  - `dem_vote_share_change_pp` = 45.71 − 44.06 = **+1.7**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "4% more
    Republican." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_North_Dakota
    (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_North_Dakota
    (section 8)

## tags / description

- Tags: `["Arts", "Culture", "Parks"]`.
- Arts/Culture: the Plains Art Museum — North Dakota's only Smithsonian Affiliate — occupies a
  renovated International Harvester warehouse downtown, with 4,000+ works in its permanent collection.
  https://www.fargomoorhead.org/listing/plains-art-museum/943/
- Parks: the Red River Zoo (33 acres, 300+ animals, 75 species, focus on cold-climate conservation).
  https://wangokart.com/blogs/usa-travel/40-things-to-do-in-fargo-north-dakota-nd
- Description written from the same facts above.

## veterans_benefits

- North Dakota has no state income tax, so military retirement pay, active-duty/reserve pay, and
  SBP/RCSBP/RSFPP annuities are all untaxed by the state by default.
  https://militaryretirementcalc.com/states/north-dakota-military-retirement
- A veteran with a 100% VA service-connected disability rating qualifies for a $120,000 property tax
  exemption on their primary residence; apply through the county tax assessor.
  https://usmilitary.org/military-retirement-pay-will-now-be-tax-free-in-these-5-states/

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).
