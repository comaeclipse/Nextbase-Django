# Colorado Springs, CO Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 15), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: El Paso)

- Two-party math, El Paso County, CO:
  - 2016: Trump 179,228 (56.19% of all votes); Clinton 108,010 (33.86% of all votes). Two-party total
    287,238. Trump two-party share 62.40%, Clinton 37.60%.
  - 2024: Trump 203,933 (53.53% of all votes); Harris 166,597 (43.73% of all votes). Two-party total
    370,530. Trump two-party share 55.04%, Harris 44.96%.
  - `rep_vote_share_change_pp` = 55.04 − 62.40 = **-7.4**
  - `dem_vote_share_change_pp` = 44.96 − 37.60 = **+7.4**
  - Directionally and closely consistent with the row's pre-existing `election_change` value of "2%
    less Republican" (legacy import, smaller magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Colorado
    (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Colorado
    (section 10)

## tci (Safety and Social Policy)

- Colorado Springs 2024 violent crime rate: 718.3 per 100,000 (3,517 violent crimes: 2,600 aggravated
  assault, 498 rape, 381 robbery, 38 murder), FBI data. https://www.eufy.com/blogs/security-camera/colorado-springs-crime-rate
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 718.3 / 359.1 * 100 = 200.0, stored as 200 (integer).

## tags / description

- Tags: `["Military", "Mountains", "Hiking"]`.
- Military: Peterson Space Force Base (HQ of U.S. Space Command, NORTHCOM, and NORAD) lies within
  Colorado Springs; Fort Carson (4th Infantry Division, 10th Special Forces Group, 40,000+ active-duty
  personnel and family) and the U.S. Air Force Academy are also in/around the city.
  https://homefrontmilitarynetwork.org/uncategorized/exploring-the-military-presence-in-colorado-springs/
- Mountains/Hiking: the city sits at the base of Pikes Peak on the eastern edge of the Southern Rocky
  Mountains, with the Air Force Academy on the Rampart Range.
  https://homefrontmilitarynetwork.org/uncategorized/exploring-the-military-presence-in-colorado-springs/
- Description written from the same facts above.

## veterans_benefits

- Colorado excludes military retirement pay (and SBP payments) from state income tax on a sliding scale
  by age: up to $15,000 under 55, up to $20,000 for 55-64, up to $24,000 for 65+.
  https://militaryretirementcalc.com/states/colorado-military-retirement
- A veteran with a 100% permanent VA service-connected disability rating (or individual unemployability
  status) qualifies for a property tax exemption on 50% of the first $200,000 of actual value of their
  primary residence; must apply to the county assessor between January 1 and July 1 of the qualifying
  year. https://dpt.colorado.gov/property-tax-exemption-for-veterans-with-a-disability-and-gold-star-spouses

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual` /
`defense_hub`. That is out of scope for issue #29 (belongs to issue #26) and requires a curatorial
defense-hub judgment call per `CLAUDE.md`'s rules, not a sourced narrative fact — left untouched.
Given the extensive military presence documented above (Peterson SFB, Fort Carson, USAFA), Colorado
Springs looks like a strong `defense_hub_manual = true` candidate for that separate pass.

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Home to Peterson Space Force Base (NORAD/USNORTHCOM HQ), Schriever Space Force Base, Fort Carson, the Cheyenne Mountain Complex, and the U.S. Air Force Academy — one of the most concentrated multi-installation defense presences of any curated city, independent of the tracked RTX/Collins/System High/L3Harris postings.

Sources:
- Homefront Military Network, Colorado Springs installation guide — https://www.homefrontmilitarynetwork.org/
- MilitaryHomeSearch, Colorado Springs base guide — https://www.militaryhomesearch.com/
- PCS Pay It Forward, Peterson SFB guide — https://pcspayitforward.com/
