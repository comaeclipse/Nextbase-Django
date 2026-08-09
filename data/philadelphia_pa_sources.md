# Philadelphia, PA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 51); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Philadelphia 2024 violent crime rate: 908.69 per 100,000 (14,078 violent crimes), FBI UCR data.
  https://plaincrime.com/city/philadelphia-pa
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 908.69 / 359.1 * 100 = 253.0, stored as 253 (integer).

## Elections (county: Philadelphia — city and county are coterminous)

- Two-party math, Philadelphia County, PA:
  - 2016: Trump 108,748 (15.32% of all votes); Clinton 584,025 (82.30% of all votes). Two-party total
    692,773. Trump two-party share 15.70%, Clinton 84.30%.
  - 2024: Trump 144,311 (20.00% of all votes); Harris 568,571 (78.81% of all votes). Two-party total
    712,882. Trump two-party share 20.24%, Harris 79.76%.
  - `rep_vote_share_change_pp` = 20.24 − 15.70 = **+4.5**
  - `dem_vote_share_change_pp` = 79.76 − 84.30 = **-4.5**
  - Directionally consistent with the row's pre-existing `election_change` value of "3% less Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Pennsylvania
    (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Pennsylvania
    (section 10)

## tags / description

- Tags: `["History", "Culture", "Arts"]`.
- History/Culture: Independence National Historical Park preserves Independence Hall (Declaration of
  Independence and Constitution drafted there) and the Liberty Bell.
  https://www.visitphilly.com/things-to-do/attractions/independence-hall/
- Arts: the Philadelphia Museum of Art's 72-step entrance ("Rocky Steps") and one of the largest Rodin
  collections outside Paris sit on the Benjamin Franklin Parkway.
  https://totalrocky.com/filming-locations/the-philadelphia-museum-of-art/
- Description written from the same facts above.

## veterans_benefits

- Pennsylvania fully exempts military retirement pay, Survivor Benefit Plan annuities, and VA
  disability compensation from state income tax, with no age or income limit.
  https://militaryretirementcalc.com/states/pennsylvania-military-retirement
- A veteran with a 100% permanent service-connected disability (or TDIU, blindness, paraplegia, or loss
  of two or more limbs) and wartime service qualifies for a full property tax exemption on their
  primary residence, covering county, township, and school district taxes.
  https://usmilitary.org/veteran-benefits-state/pennsylvania/

## Known limitations

None — all six target fields for this row were sourced and populated.
