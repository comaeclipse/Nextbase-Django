# St. Charles, MO Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 34); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- St. Charles 2024 violent crime rate: 134.5 per 100,000 (97 violent crimes: 68 aggravated assault, 13
  robbery, 3 murder, 13 rape), FBI UCR 2024 data, 62% below the national average.
  (Search-aggregated summary citing FBI UCR data; see also PlainCrime's St. Charles profile, Safety
  Grade A.) https://plaincrime.com/city/st-charles-mo
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 134.5 / 359.1 * 100 = 37.5, stored as 37 (integer). This is among the lowest TCI values computed
  in this backfill.

## Elections (county: St. Charles) — magnitude discrepancy noted

- Two-party math, St. Charles County, MO:
  - 2016: Trump 121,650 (59.87% of all votes); Clinton 68,626 (33.78% of all votes). Two-party total
    190,276. Trump two-party share 63.94%, Clinton 36.06%.
  - 2024: Trump 130,588 (57.42% of all votes); Harris 92,226 (40.56% of all votes). Two-party total
    222,814. Trump two-party share 58.61%, Harris 41.39%.
  - `rep_vote_share_change_pp` = 58.61 − 63.94 = **-5.3**
  - `dem_vote_share_change_pp` = 41.39 − 36.06 = **+5.3**
  - Same direction as the row's pre-existing `election_change` ("2% less Republican"), but a much larger
    magnitude (5.3 pp vs. 2%) — flagged, not reconciled (same pattern as Boston's discrepancy earlier).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Missouri
    (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Missouri
    (section 8)

## tags / description

- Tags: `["History", "Riverfront", "Culture"]`.
- History/Culture: Historic Main Street is Missouri's first and largest nationally registered historic
  district, 14 blocks of 1800s storefronts. https://www.discoverstcharles.com/things-to-do/attractions/top-10-reasons-to-visit/
- Riverfront: Frontier Park (16 acres on the Missouri River) marks where Lewis and Clark's Corps of
  Discovery departed in 1804; the Lewis & Clark Boat House and Nature Center is at its south end.
  https://www.discoverstcharles.com/things-to-do/outdoors-recreation/parks/frontier-park/
- Description written from the same facts above.

## veterans_benefits

- Missouri fully exempts military retirement pay from state income tax for tax years beginning January
  1, 2024 (the prior income-based phase-out was eliminated), covering active-duty, Reserve, and
  National Guard retirement. https://usmilitary.org/veteran-benefits-state/missouri/
- Missouri has no general property tax exemption for ordinary 100% disabled veterans — the full
  constitutional homestead exemption applies only to former Prisoners of War with a total
  service-connected disability. Most 100% service-connected disabled veterans instead claim the
  income-tested Missouri Property Tax Credit ("circuit breaker"), up to $1,100 for homeowners ($750 for
  renters), subject to income limits.
  https://www.gettaxreliefnow.com/main-article/military-tax-guide-missouri-2025-exemptions-and-credits

## Known limitations

None — all six target fields for this row were sourced and populated.
