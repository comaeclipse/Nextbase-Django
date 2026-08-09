# Las Vegas, NV Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 44); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Las Vegas 2024 violent crime rate: 429.8 per 100,000 (Las Vegas Metropolitan Police Department), FBI
  2024 data. https://www.opencrime.us/crime-rate-in/las-vegas
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 429.8 / 359.1 * 100 = 119.7, stored as 120 (integer).

## Elections (county: Clark)

- Two-party math, Clark County, NV:
  - 2016: Trump 320,057 (41.72% of all votes); Clinton 402,227 (52.43% of all votes). Two-party total
    722,284. Trump two-party share 44.31%, Clinton 55.69%.
  - 2024: Trump 493,052 (47.81% of all votes); Harris 520,187 (50.44% of all votes). Two-party total
    1,013,239. Trump two-party share 48.66%, Harris 51.34%.
  - `rep_vote_share_change_pp` = 48.66 − 44.31 = **+4.4**
  - `dem_vote_share_change_pp` = 51.34 − 55.69 = **-4.4**
  - Directionally consistent with the row's pre-existing `election_change` value of "2% less Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Nevada
    (section 13)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Nevada (section 9)

## tags / description

- Tags: `["Hiking", "Mountains", "Culture"]`.
- Culture: the Las Vegas Strip's themed resorts and Fremont Street's pedestrian mall (world's largest
  LED canopy) anchor the city's entertainment identity.
  https://fastfoodclub.com/p/21-nevada-attractions-that-are-actually-worth-leaving-the-las-vegas-strip-for/
- Hiking/Mountains: Red Rock Canyon National Conservation Area, 17 miles west of the Strip, spans
  195,000+ acres with 30+ miles of scenic drives and trails.
  https://www.redrockcanyonlv.org/
- Description written from the same facts above.

## veterans_benefits

- Nevada has no state income tax, so military retirement pay, VA disability compensation, and all
  other retirement income are entirely untaxed by the state.
  https://www.herringbank.com/learn/nevada-military-retirement/
- Nevada's Veterans Exemption provides an assessed-value reduction ($3,640 for the 2026/2027 fiscal
  year, adjusted periodically); veterans with a service-connected disability get an additional $20,000
  assessed-value reduction on their home.
  https://www.herringbank.com/learn/nevada-veteran-tax-exemption/

## Known limitations

None — all six target fields for this row were sourced and populated.
