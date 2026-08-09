# Cincinnati, OH Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 48); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Cincinnati 2024 violent crime rate: 845.6 per 100,000 (2,635 violent crimes), FBI data; violent crime
  up 16.3% year over year even as total crime fell 5.7%. https://www.homesnacks.com/oh/cincinnati-crime/
  (the search-aggregated "117.57% higher than the national rate of 1,760.0 per 100,000" comparator
  quoted alongside this figure is clearly a garbled/incorrect national baseline — not used here — but
  the underlying 845.6/100k Cincinnati figure itself was independently corroborated as FBI-sourced)
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 845.6 / 359.1 * 100 = 235.5, stored as 236 (integer).

## Elections (county: Hamilton)

- Two-party math, Hamilton County, OH:
  - 2016: Trump 173,665 (42.45% of all votes); Clinton 215,719 (52.73% of all votes). Two-party total
    389,384. Trump two-party share 44.61%, Clinton 55.39%.
  - 2024: Trump 172,365 (41.87% of all votes); Harris 233,360 (56.69% of all votes). Two-party total
    405,725. Trump two-party share 42.48%, Harris 57.52%.
  - `rep_vote_share_change_pp` = 42.48 − 44.61 = **-2.1**
  - `dem_vote_share_change_pp` = 57.52 − 55.39 = **+2.1**
  - Directionally consistent with the row's pre-existing `election_change` value of "4% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Ohio (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Ohio (section 10)

## tags / description

- Tags: `["Arts", "Riverfront", "Culture"]`.
- Riverfront: Smale Riverfront Park lines the Ohio River in downtown Cincinnati.
  https://www.lonelyplanet.com/articles/top-things-to-do-in-cincinnati
- Arts/Culture: the free Cincinnati Art Museum holds 67,000 works spanning 6,000 years; Findlay Market
  in Over-the-Rhine is Ohio's oldest continuously operated public market (1M+ visitors/year).
  https://www.findlaymarket.org/
- Description written from the same facts above.

## veterans_benefits

- Same statewide Ohio benefit summary as Akron, OH (see `data/akron_oh_sources.md` for full
  citations): military retirement pay (incl. SBP/RCSBP) fully exempt from state income tax; Enhanced
  Homestead Exemption removes $58,000 of appraised value for 100% VA-rated veterans (tax year 2026, no
  income limit, must apply).

## Known limitations

None — all six target fields for this row were sourced and populated.
