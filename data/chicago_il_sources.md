# Chicago, IL Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 66). Pre-patch scan showed only `tci`, `tags`, `description`,
and `veterans_benefits` missing — `rep_vote_share_change_pp` (7.29) and `dem_vote_share_change_pp`
(-4.3) were **already populated** on this row (unlike every other city in this backfill) and were
correctly excluded from this patch. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, safety-checked). No other column
touched, and no election-math research was needed for this city.

## tci (Safety and Social Policy)

- Chicago 2024 violent crime rate: 539.8 per 100,000 (14,245 violent crimes, population 2,638,698),
  FBI UCR Table 8 city-level submission data; violent crime down 11.0% from the prior year.
  (Search-aggregated summary citing FBI UCR data; see also PlainCrime's Chicago profile reporting a
  similar ~540/100k figure independently.) https://plaincrime.com/city/chicago-il
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 539.8 / 359.1 * 100 = 150.3, stored as 150 (integer).

## tags / description

- Tags: `["Arts", "Culture", "Coastal"]`.
- Arts/Culture: Millennium Park (Cloud Gate/"The Bean," Jay Pritzker Pavilion, Crown Fountain, Lurie
  Garden) sits adjacent to the Art Institute of Chicago.
  https://www.choosechicago.com/articles/parks-outdoors/millennium-park-campus/
- Coastal: Millennium Park borders Lake Michigan's downtown shoreline.
  https://gocity.com/en/chicago/things-to-do/things-to-do-near-millennium-park-chicago
- Description written from the same facts above.

## veterans_benefits

- Illinois fully exempts military retirement pay (including military disability retirement pay) from
  state income tax. https://militaryretirementcalc.com/states/illinois-military-retirement
- Disabled veterans get a tiered property tax exemption: $2,500 for a 30-49% disability rating, $5,000
  for 50-69%, and full property tax exemption on the primary residence at 70%+; returning veterans (from
  active duty in an armed conflict) get a $5,000 assessed-value reduction for the return year plus the
  following year. https://valoannetwork.com/property-tax-exemptions/illinois/

## Known limitations

None of the four fields this patch targeted were left blank. `rep_vote_share_change_pp` and
`dem_vote_share_change_pp` were intentionally left untouched (already populated pre-patch; no
election-math verification was performed on those pre-existing values as part of this patch).
`scripts/verify-location-completeness.ts` flags this row as missing `election_change` (text summary) —
that field is not part of issue #29's 6-field bundle and was left blank rather than derived
unilaterally from the pre-existing pp values, out of scope for this patch.
