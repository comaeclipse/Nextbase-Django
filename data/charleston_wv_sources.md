# Charleston, WV Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 64); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Charleston 2024 violent crime rate: 542.7 per 100,000 (251 violent crimes), FBI data.
  https://plaincrime.com/city/charleston-wv
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 542.7 / 359.1 * 100 = 151.1, stored as 151 (integer).

## Elections (county: Kanawha) — discrepancy noted

- Two-party math, Kanawha County, WV:
  - 2016: Trump 43,850 (57.03% of all votes); Clinton 28,263 (36.76% of all votes). Two-party total
    72,113. Trump two-party share 60.81%, Clinton 39.19%.
  - 2024: Trump 43,352 (57.62% of all votes); Harris 30,231 (40.18% of all votes). Two-party total
    73,583. Trump two-party share 58.93%, Harris 41.07%.
  - `rep_vote_share_change_pp` = 58.93 − 60.81 = **-1.9**
  - `dem_vote_share_change_pp` = 41.07 − 39.19 = **+1.9**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "1% more
    Republican." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_West_Virginia
    (section 7)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_West_Virginia
    (section 11)

## tags / description

- Tags: `["History", "Riverfront", "Arts"]`.
- History: the West Virginia State Capitol, topped by a 293-foot gold dome, sits in downtown
  Charleston on the Kanawha River. https://wvtourism.com/company/state-capitol-complex/
- Riverfront: Haddad Riverfront Park (2,500-seat amphitheater, "Live on the Levee" concert series) and
  Magic Island are on the Kanawha River. https://www.midwesterntraveler.com/5-riverfront-attractions-in-charleston-wv/
- Arts: the Clay Center for the Arts and Sciences houses art and discovery museums, a planetarium, and
  a concert hall. https://www.thetravel.com/things-to-do-in-charleston-west-virginia/
- Description written from the same facts above.

## veterans_benefits

- West Virginia has fully exempted military retirement pay from state income tax since 2018, no income
  limit for pensions from any branch; VA disability compensation is also untaxed.
  https://tinygrab.com/does-west-virginia-tax-military-retirement
- Instead of an assessor-level property tax exemption, West Virginia offers a refundable state income
  tax credit (since January 1, 2024) equal to 100% of the property tax paid on the primary residence for
  honorably discharged veterans with a 90-100% combined VA disability rating.
  https://www.militarytransitiontoolkit.com/disabled-veteran-property-tax/west-virginia

## Known limitations

None — all six target fields for this row were sourced and populated.
