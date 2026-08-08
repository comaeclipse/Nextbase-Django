# Atlanta, GA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 20); pre-patch scan confirmed all six target fields were
genuinely NULL/empty (`tci`, `rep_vote_share_change_pp`, `dem_vote_share_change_pp`, `tags`,
`description`, `veterans_benefits`) before this patch touched them. Applied via a single-row
parameterized SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, now with a
safety check that refuses to overwrite any already-populated field — see the process-correction note
in `data/mobile_al_sources.md` and the issue #29 comment thread). No other column touched.

## tci (Safety and Social Policy)

- AreaVibes' Atlanta crime page was rejected as a source: it explicitly states "Atlanta crime rates are
  not available from the FBI crime report" and that its 176/100k figure is a non-FBI demographic
  estimate. https://www.areavibes.com/atlanta-ga/crime/
- Used instead: HomeSnacks' Atlanta page, explicitly "FBI Uniform Crime Reporting (2024)," internally
  consistent (3,538 violent crimes, 707.3 per 100,000, stated as "97.02% above the national average of
  359.0 per 100,000" — arithmetic checks out: 707.3/359.0 ≈ 1.97).
  https://www.homesnacks.com/ga/atlanta-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill; consistent with
  HomeSnacks' 359.0 comparator to within rounding).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 707.3 / 359.1 * 100 = 196.9, stored as 197 (integer).

## Elections (county: Fulton)

- Two-party math, Fulton County, GA:
  - 2016: Trump 117,783 (26.85% of all votes); Clinton 297,051 (67.70% of all votes). Two-party total
    414,834. Trump two-party share 28.39%, Clinton 71.61%.
  - 2024: Trump 144,655 (27.03% of all votes); Harris 384,752 (71.88% of all votes). Two-party total
    529,407. Trump two-party share 27.32%, Harris 72.68%.
  - `rep_vote_share_change_pp` = 27.32 − 28.39 = **-1.1**
  - `dem_vote_share_change_pp` = 72.68 − 71.61 = **+1.1**
  - Directionally consistent with the row's pre-existing `election_change` value of "4% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Georgia
    (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Georgia
    (section 11)

## tags / description

- Tags: `["Arts", "Culture", "Parks", "Biking"]`.
- Arts/Culture: the Woodruff Arts Center campus in Midtown houses the High Museum of Art (20,000+
  works) and the Atlanta Symphony Orchestra. https://discoveratlanta.com/things-to-do/arts-culture/high-museum/
- Parks/Biking: Piedmont Park (200 acres) and the Atlanta BeltLine's multi-use trail network (built on
  old rail corridors, hosting the largest free public art exhibition in the Southeast).
  https://beltline.org/art/ , https://beltline.org/visit/
- Description written from the same facts above.

## veterans_benefits

- Starting with the 2026 tax year, Georgia exempts up to $65,000 of military retirement income from
  state income tax for veterans of any age (House Bill 266, signed May 2025); automatic, no separate
  application. VA disability compensation remains completely tax-free.
  https://veterans.georgia.gov/military-retirement-income-tax-exemption
- Georgia offers a homestead property tax exemption for eligible disabled veterans (or their surviving
  spouse/minor children) worth $126,526 for 2026.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Georgia

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).
