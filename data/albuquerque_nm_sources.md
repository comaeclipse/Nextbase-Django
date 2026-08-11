# Albuquerque, NM Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 43); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Albuquerque 2024 violent crime rate: 1,182.1 per 100,000, FBI 2024 data (229% above the national
  average; murder rate 18.4/100k, 3.0x the national average). Violent crime down 10.3% year over year.
  https://www.homesnacks.com/nm/albuquerque-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1182.1 / 359.1 * 100 = 329.1, stored as 329 (integer).

## Elections (county: Bernalillo)

- Two-party math, Bernalillo County, NM:
  - 2016: Trump 94,698 (34.48% of all votes); Clinton 143,417 (52.22% of all votes). Two-party total
    238,115. Trump two-party share 39.77%, Clinton 60.23%.
  - 2024: Trump 118,762 (38.21% of all votes); Harris 184,117 (59.23% of all votes). Two-party total
    302,879. Trump two-party share 39.21%, Harris 60.79%.
  - `rep_vote_share_change_pp` = 39.21 − 39.77 = **-0.6**
  - `dem_vote_share_change_pp` = 60.79 − 60.23 = **+0.6**
  - Net: essentially unchanged, very slightly more Democratic by strict two-party math. The row's
    pre-existing `election_change` ("7% more Democratic") points the same direction but a much larger
    magnitude — flagged, not reconciled.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_New_Mexico
    (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_New_Mexico
    (section 10)

## tags / description

- Tags: `["Mountains", "History", "Culture"]`.
- History/Culture: Old Town has been Albuquerque's cultural center since the city's founding in 1706,
  with 100+ museums, shops, galleries, and historic architecture.
  https://www.tripadvisor.com/Attractions-g60933-Activities-Albuquerque_New_Mexico.html
- Mountains: the Sandia Peak Tramway is a 2.7-mile ride to the Sandia Mountains' 10,378-foot summit.
  https://www.tripadvisor.com/Attractions-g60933-Activities-Albuquerque_New_Mexico.html
- The Albuquerque International Balloon Fiesta (500+ balloons, 9 days each October) is the world's
  largest balloon festival. https://www.acg.aaa.com/connect/blogs/5c/travel/albuquerque-international-balloon-fiesta-guide
- Description written from the same facts above.

## veterans_benefits

- New Mexico exempts military retirement pay up to $30,000/year currently; new legislation removes that
  cap entirely for military retirees and surviving spouses for taxable years beginning on/after January
  1, 2026 (full exemption). Active-duty pay for NM resident service members is fully exempt regardless.
  https://www.gettaxreliefnow.com/main-article/military-tax-guide-new-mexico-2025-key-benefits-rules
- All honorably discharged veterans get a $10,000 reduction in taxable property value regardless of
  disability; a 100% service-connected disability rating brings full property tax exemption (no
  income/value cap); starting the 2026 tax year, 10-99% ratings get a proportional exemption.
  https://usmilitary.org/veteran-benefits-state/new-mexico/

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Kirtland Air Force Base (6th-largest USAF base) and Sandia National Laboratories (the state's single largest employer) are both located in Albuquerque — a major, well-documented defense/national-security presence independent of the tracked System High and L3Harris postings.

Sources:
- NationalToday.com, Kirtland AFB feature, 2026-04-15 — https://nationaltoday.com/
- Wikipedia, "Sandia National Laboratories" — https://en.wikipedia.org/wiki/Sandia_National_Laboratories
- NukeWatch.org, Kirtland AFB dossier — https://nukewatch.org/
