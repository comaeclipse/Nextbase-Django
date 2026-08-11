# Raleigh, NC Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 37). Pre-patch scan showed `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, and `veterans_benefits` missing — `description` already had a
pre-existing value and was correctly excluded from this patch. Applied via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No
other column touched.

## tci (Safety and Social Policy)

- Raleigh 2024 violent crime rate: 488.85 per 100,000 (2,386 violent crimes: murder, rape, robbery,
  aggravated assault), FBI UCR data, confirmed by multiple independent sources.
  https://plaincrime.com/city/raleigh-nc
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 488.85 / 359.1 * 100 = 136.1, stored as 136 (integer).

## Elections (county: Wake)

- Two-party math, Wake County, NC:
  - 2016: Trump 196,082 (37.16% of all votes); Clinton 302,736 (57.38% of all votes). Two-party total
    498,818. Trump two-party share 39.31%, Clinton 60.69%.
  - 2024: Trump 236,735 (36.22% of all votes); Harris 402,984 (61.66% of all votes). Two-party total
    639,719. Trump two-party share 37.01%, Harris 62.99%.
  - `rep_vote_share_change_pp` = 37.01 − 39.31 = **-2.3**
  - `dem_vote_share_change_pp` = 62.99 − 60.69 = **+2.3**
  - Directionally consistent with the row's pre-existing `election_change` value of "5% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_North_Carolina
    (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_North_Carolina
    (section 10)

## tags

- Tags: `["Arts", "Culture", "Tech Hub"]`.
- Arts/Culture: the North Carolina Museum of Natural Sciences — the state's most-visited museum, the
  largest natural history museum in the Southeast, and a Smithsonian affiliate — sits in downtown
  Raleigh next to the State Capitol. https://www.visitraleigh.com/things-to-do/museums/museum-guide/north-carolina-museum-of-natural-sciences/
- Tech Hub: Raleigh anchors the Research Triangle, a major research/technology metro alongside Durham
  and Chapel Hill. https://www.ebsco.com/research-starters/geography-and-cartography/raleigh-north-carolina

## veterans_benefits

- Same statewide North Carolina benefit summary as Indian Trail, NC (see
  `data/indian_trail_nc_sources.md` for full citations): military retirement pay + SBP fully exempt
  from state income tax (no cap, 20+ years or medical retirement); 100% P&T disabled veterans exclude
  the first $45,000 of home assessed value from property tax, no income limit.

## Known limitations

None of the five fields this patch targeted were left blank. `description` was intentionally left
untouched (already populated pre-patch). `scripts/verify-location-completeness.ts` flags this row as
missing `defense_hub_manual`/`defense_hub`, out of scope for issue #29 (belongs to issue #26).

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **FALSE (hard veto)**

Vetoed. Only a single small L3Harris office (1 onsite posting) is tracked in Raleigh, with no military installation within 60+ miles. The Research Triangle's defense-adjacent activity is diffuse (RTP-area contractor offices, university research) rather than concentrated in Raleigh itself, and doesn't rise to the level of a retiree-relevant defense hub for the city.

Sources:
- Raleigh Today (raltoday.6amcity.com), largest-employers roundup — https://raltoday.6amcity.com/
- Raleigh Chamber, major employers page — https://www.raleighchamber.org/
- Economic Development Partnership of NC (edpnc.com), defense sector page — https://www.edpnc.com/
