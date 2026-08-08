# Boston, MA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 29); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Boston 2024 violent crime rate: 627.9 per 100,000 (4,138 violent crimes), FBI UCR 2024 data, 74.90%
  above the national average. https://www.homesnacks.com/ma/boston-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 627.9 / 359.1 * 100 = 174.8, stored as 175 (integer).

## Elections (county: Suffolk) — magnitude discrepancy noted

- Two-party math, Suffolk County, MA:
  - 2016: Trump 50,421 (16.09% of all votes); Clinton 245,751 (78.44% of all votes). Two-party total
    296,172. Trump two-party share 17.02%, Clinton 82.98%.
  - 2024: Trump 66,480 (22.22% of all votes); Harris 222,280 (74.29% of all votes). Two-party total
    288,760. Trump two-party share 23.02%, Harris 76.98%.
  - `rep_vote_share_change_pp` = 23.02 − 17.02 = **+6.0**
  - `dem_vote_share_change_pp` = 76.98 − 82.98 = **-6.0**
  - Same direction as the row's pre-existing `election_change` ("1% less Democratic" = more
    Republican), but a much larger magnitude (6.0 pp vs. 1%) — flagged for transparency (same pattern
    as Louisville's smaller-magnitude match, but here the gap is large enough to note explicitly),
    `election_change` left untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Massachusetts
    (section 10)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Massachusetts
    (section 9)

## tags / description

- Tags: `["History", "Culture", "Coastal"]`.
- History/Culture: the 2.5-mile Freedom Trail links 16 historic sites — Faneuil Hall ("Cradle of
  Liberty," built 1742), the Paul Revere House, Old North Church, and the Bunker Hill Monument.
  https://www.trolleytours.com/boston/freedom-trail , https://www.thefreedomtrail.org/trail-sites/faneuil-hall
- Coastal: the USS Constitution frigate is moored in Boston Harbor along the trail.
  https://www.trolleytours.com/boston/freedom-trail
- Description written from the same facts above.

## veterans_benefits

- Massachusetts fully exempts military retirement pay (treated like other exempt contributory
  government pensions), active-duty pay, and VA disability compensation/pension from state income tax.
  https://militaryretirementcalc.com/states/massachusetts-military-retirement
- Property tax is set and collected locally, not by the state. Disabled veterans (10%+ VA rating, plus
  residency/domicile conditions) may claim a local property tax exemption of $400 to $1,500 through
  their city/town's board of assessors; amounts vary by municipality.
  https://www.veteranpcs.com/blog/massachusetts-veteran-property-tax-exemptions-2026

## Known limitations

None — all six target fields for this row were sourced and populated.
