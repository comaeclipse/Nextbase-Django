# Milwaukee, WI Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 63); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Milwaukee 2024 violent crime rate: 1,430.9 per 100,000 (8,019 violent crimes), FBI 2024 data.
  https://www.homesnacks.com/wi/milwaukee-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1430.9 / 359.1 * 100 = 398.5, stored as 399 (integer).

## Elections (county: Milwaukee) — no measurable change

- Two-party math, Milwaukee County, WI:
  - 2016: Trump 126,069 (28.58% of all votes); Clinton 288,822 (65.48% of all votes). Two-party total
    414,891. Trump two-party share 30.38%, Clinton 69.62%.
  - 2024: Trump 138,022 (29.74% of all votes); Harris 316,292 (68.15% of all votes). Two-party total
    454,314. Trump two-party share 30.38%, Harris 69.62%.
  - `rep_vote_share_change_pp` = 30.38 − 30.38 = **0.0**
  - `dem_vote_share_change_pp` = 69.62 − 69.62 = **0.0**
  - Both parties' raw vote totals grew, but their two-party shares came out essentially identical to two
    decimal places. This is a mild discrepancy from the row's pre-existing `election_change` value of
    "2% more Democratic" — flagged for transparency (same pattern as Boise/Kuna and Ada County earlier
    in this backfill), `election_change` left untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Wisconsin
    (section 14)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Wisconsin
    (section 11)

## tags / description

- Tags: `["Arts", "Culture", "Coastal"]`.
- Arts/Coastal: the Milwaukee Art Museum's Santiago Calatrava-designed Burke Brise Soleil ("wings,"
  217 feet, unfolds twice daily) sits on a 24-acre Lake Michigan campus.
  https://mam.org/
- Culture: the Historic Third Ward hosts art galleries, boutiques, theaters, and the Milwaukee Public
  Market. https://www.milwaukeefoodtours.com/blog/what-are-milwaukees-top-places-to-visit-for-art-culture-and-history/
- Description written from the same facts above.

## veterans_benefits

- Wisconsin fully exempts military retirement pay (including SBP, RCSBP, RSFPP annuities) from state
  income tax regardless of branch, years of service, or retirement date; Social Security benefits are
  also untaxed. https://militaryretirementcalc.com/states/wisconsin-military-retirement
- Wisconsin offers a refundable property tax credit: a base credit of $400 for wartime-period veterans,
  and a full property tax exemption on the primary residence for veterans with a 100% service-connected
  disability (or individual unemployability) rating, extending to surviving spouses.
  https://vetcalc.org/veteran-benefits/wisconsin

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).
