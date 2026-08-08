# Boise, ID Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 24); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, safety-checked). No other column
touched.

## tci (Safety and Social Policy)

- Boise 2024 violent crime rate: 294 per 100,000, explicitly FBI UCR-sourced ("This data reflects the
  2024 calendar year and was released from the FBI in September, 2025"), per AreaVibes.
  https://www.areavibes.com/boise-id/crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 294 / 359.1 * 100 = 81.9, stored as 82 (integer).

## Elections (county: Ada) — large discrepancy noted

- Two-party math, Ada County, ID:
  - 2016: Trump 93,752 (47.91% of all votes); Clinton 75,677 (38.68% of all votes). Two-party total
    169,429. Trump two-party share 55.34%, Clinton 44.66%.
  - 2024: Trump 143,759 (53.36% of all votes); Harris 116,116 (43.10% of all votes). Two-party total
    259,875. Trump two-party share 55.32%, Harris 44.68%.
  - `rep_vote_share_change_pp` = 55.32 − 55.34 = **0.0** (rounds to zero; essentially unchanged)
  - `dem_vote_share_change_pp` = 44.68 − 44.66 = **0.0**
  - **This is a large discrepancy** from the row's pre-existing `election_change` value of "6% more
    Republican." Both major parties' vote totals in Ada County roughly grew in proportion between 2016
    and 2024 (consistent with the county's fast population growth), so the two-party share barely moved
    even though raw vote totals for both candidates rose substantially. As with Costa Mesa/Bridgeport,
    this is flagged rather than reconciled — `election_change`'s original methodology/geography is
    undocumented and out of scope to investigate here; only the two new pp columns were added.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Idaho (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Idaho (section 9)

## tags / description

- Tags: `["Hiking", "Biking", "Parks"]`.
- Biking/Parks: the Boise River Greenbelt is a 25-mile paved bike/pedestrian path linking 850+ acres of
  riverside parks (Barber Park, Municipal Park, Julia Davis Park, Ann Morrison Park, Kathryn Albertson
  Park). https://visitidaho.org/things-to-do/rail-to-trail/boise-greenbelt/
- Hiking: the Ridge to Rivers trail system offers 190+ miles of interconnected foothill trails,
  including the Table Rock Trail and Hull's Gulch Reserve.
  https://www.fleetfeet.com/s/meridian/news/exploringtrailsaroundidaho
- Description written from the same facts above.

## veterans_benefits

- Idaho's Retirement Benefits Deduction (official state tax page) lets qualifying retired service
  members — those classified as disabled, age 62+, or under 62 with sufficient earned income requiring
  a federal return — subtract military retirement pay from state taxable income, up to an annually
  recalculated cap; the page states "each year the state recalculates the maximum allowed" without
  giving the exact figure. A third-party summary cites approximately $40,536 for a recent tax year,
  indexed to the Social Security maximum benefit.
  https://tax.idaho.gov/taxes/income-tax/individual-income/popular-credits-and-deductions/idaho-retirement-benefits-deduction/
  https://militaryretirementcalc.com/states/idaho-military-retirement
- A veteran with a 100% service-connected disability rating (or individual unemployability) gets a
  property tax reduction of up to $1,500/year with no income limit; other disabled veterans (10%+) may
  qualify for a smaller reduction varying by county. Apply with the county assessor between January 1
  and April 15. https://vetcalc.org/veteran-benefits/idaho/

## Known limitations

None of the six target fields were left blank, though the exact current-year dollar cap for the
military retirement deduction could not be pinned down from the primary state source (only a
third-party approximation) — flagged for a future refresh if precision matters.
