# Wichita, KS Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 26); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check that refuses to
overwrite an already-populated column). No other column touched.

## tci (Safety and Social Policy)

- Wichita 2024 violent crime rate: 538.58 per 100,000 (2,130 violent crimes), FBI 2024 data, 53% above
  the national average. https://www.homesnacks.com/ks/wichita-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 538.58 / 359.1 * 100 = 149.9, stored as 150 (integer).

## Elections (county: Sedgwick) — discrepancy noted

- Two-party math, Sedgwick County, KS:
  - 2016: Trump 104,353 (55.28% of all votes); Clinton 69,627 (36.88% of all votes). Two-party total
    173,980. Trump two-party share 59.98%, Clinton 40.02%.
  - 2024: Trump 120,118 (56.09% of all votes); Harris 90,506 (42.26% of all votes). Two-party total
    210,624. Trump two-party share 57.03%, Harris 42.97%.
  - `rep_vote_share_change_pp` = 57.03 − 59.98 = **-3.0**
  - `dem_vote_share_change_pp` = 42.97 − 40.02 = **+3.0**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "2% more
    Republican." Flagged per the established pattern (Costa Mesa/Bridgeport/Boise/Kuna) rather than
    reconciled — `election_change` left untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Kansas
    (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Kansas (section 9)

## tags / description

- Tags: `["Arts", "Culture", "Parks"]`.
- Arts/Culture: the Old Town district (1800s brick warehouses, restaurants, galleries) and the Wichita
  Art Museum's American art collection. https://www.visitwichita.com/about-wichita/wichita-distinct-districts/old-town-district/
- Parks: Botanica: The Wichita Gardens, 20 acres and 30 themed garden areas on the Arkansas River.
  https://www.visitwichita.com/things-to-do/attractions/botanica-the-wichita-gardens/
- Description written from the same facts above.

## veterans_benefits

- Military retired pay included in federal AGI is not taxed by Kansas.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Kansas
- Veterans with a service-connected disability rating may claim an additional state income tax
  exemption ($2,320 for tax year 2025+); those with 50%+ disability may claim a homestead refund if
  their home is valued at $350,000 or less and household income is $56,450 or less. Beginning July 1,
  2026, veterans with a 100% total/permanent disability (or individual unemployability) are exempt from
  Kansas sales tax on up to $24,000/year in purchases (excluding tobacco, e-cigarettes, alcohol, motor
  vehicles). https://www.kovs.ks.gov/veteran-services/state-veterans-benefits-guide

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `tech_hub`/`defense_hub_manual`,
out of scope for issue #29 (belongs to issue #26).
