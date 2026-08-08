# Portland, ME Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 31); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Portland (ME) 2024 violent crime rate: 266.92 per 100,000, FBI UCR 2024 data (25.65% below the
  national average). https://beautifydata.com/united-states-crimes/fbi-ucr/2024/number-and-rate-of-violent-crimes-per-city/maine/portland
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 266.92 / 359.1 * 100 = 74.3, stored as 74 (integer).

## Elections (county: Cumberland)

- Two-party math, Cumberland County, ME:
  - 2016: Trump 57,709 (33.59% of all votes); Clinton 102,981 (59.94% of all votes). Two-party total
    160,690. Trump two-party share 35.91%, Clinton 64.09%.
  - 2024: Trump 59,964 (31.12% of all votes); Harris 127,971 (66.42% of all votes). Two-party total
    187,935. Trump two-party share 31.91%, Harris 68.09%.
  - `rep_vote_share_change_pp` = 31.91 − 35.91 = **-4.0**
  - `dem_vote_share_change_pp` = 68.09 − 64.09 = **+4.0**
  - Directionally and closely consistent with the row's pre-existing `election_change` value of "6% more
    Democratic" (legacy import, similar order of magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Maine
    (section 13)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Maine
    (section 12)

## tags / description

- Tags: `["Coastal", "History", "Arts"]`.
- Coastal: the Old Port district lines Portland's Casco Bay waterfront with 19th-century brick
  buildings. https://www.theoceandrifter.com/a-weekend-guide-to-the-old-port-portland-me/
- History: Portland Head Light, commissioned by George Washington and built in 1791, is Maine's oldest
  lighthouse. https://visitmaine.com/things-to-do/lighthouses-sightseeing/portland-head
- Arts: the Portland Museum of Art holds works by notable artists.
  https://newenglandwanderlust.com/things-to-do-in-portland-maine/
- Description written from the same facts above.

## veterans_benefits

- Maine fully exempts military retirement pay from state income tax with no cap, age requirement, or
  phase-in; expanded in 2026 to cover Space Force retirees and USPHS/NOAA officers.
  https://militaryretirementcalc.com/states/maine-military-retirement
- Qualifying wartime veterans (age 62+ or receiving federal disability compensation) get a base $6,000
  assessed-value property tax exemption; 100% service-connected disabled veterans get $100,000; those
  rated 50-90% get $50,000; paraplegic veterans get $50,000 — all in addition to the base exemption.
  Apply by April 1 with Form OPT-7, DD-214, and disability documentation to the local municipal
  assessor. https://vetunlock.com/benefits/maine/standard-property-tax

## Known limitations

None — all six target fields for this row were sourced and populated.
