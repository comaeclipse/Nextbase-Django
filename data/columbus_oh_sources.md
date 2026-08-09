# Columbus, OH Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 47); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Columbus 2024 violent crime rate: 434.9 per 100,000 (3,981 violent crimes), FBI data, 21.13% above
  the national average. https://www.homesnacks.com/oh/columbus-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 434.9 / 359.1 * 100 = 121.1, stored as 121 (integer).

## Elections (county: Franklin)

- Two-party math, Franklin County, OH:
  - 2016: Trump 199,331 (33.93% of all votes); Clinton 351,198 (59.78% of all votes). Two-party total
    550,529. Trump two-party share 36.21%, Clinton 63.79%.
  - 2024: Trump 210,830 (34.89% of all votes); Harris 380,518 (62.98% of all votes). Two-party total
    591,348. Trump two-party share 35.65%, Harris 64.35%.
  - `rep_vote_share_change_pp` = 35.65 − 36.21 = **-0.6**
  - `dem_vote_share_change_pp` = 64.35 − 63.79 = **+0.6**
  - Same direction as the row's pre-existing `election_change` ("4% more Democratic") but a much
    smaller magnitude — flagged, not reconciled.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Ohio (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Ohio (section 10)

## tags / description

- Tags: `["Arts", "Culture", "History"]`.
- Arts: the Short North Arts District hosts galleries, boutiques, and the nighttime Gallery Hop.
  https://www.experiencecolumbus.com/things-to-do/attractions/
- Culture/History: German Village, on the National Register of Historic Places, preserves 19th-century
  brick rowhouses built by German immigrants; COSI (Center of Science and Industry) has served 30M+
  visitors since 1964. https://whatshouldwedotodaycolumbus.com/things-to-do-in-german-village-columbus-ohio/
- Description written from the same facts above.

## veterans_benefits

- Same statewide Ohio benefit summary as Akron, OH (see `data/akron_oh_sources.md` for full
  citations): military retirement pay (incl. SBP/RCSBP) fully exempt from state income tax; Enhanced
  Homestead Exemption removes $58,000 of appraised value for 100% VA-rated veterans (tax year 2026, no
  income limit, must apply).

## Known limitations

None — all six target fields for this row were sourced and populated.
