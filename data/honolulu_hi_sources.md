# Honolulu, HI Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 21); pre-patch scan confirmed all six target fields were
genuinely NULL/empty before this patch. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, safety-checked against overwriting
already-populated fields). No other column touched.

## tci (Safety and Social Policy)

- Honolulu 2024 violent crime rate: 185.2 per 100,000 (15 murders, rate 1.5/100k), FBI 2024 data.
  https://www.hawaiihealthmatters.org/indicators/index/view?indicatorId=522&localeId=599 (Hawaii Health
  Matters, sourcing Honolulu County FBI/state UCR data)
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 185.2 / 359.1 * 100 = 51.6, stored as 52 (integer).

## Elections (county: Honolulu — city and county are coterminous)

- Two-party math, City & County of Honolulu, HI:
  - 2016: Trump 90,326 (31.61% of all votes); Clinton 175,696 (61.48% of all votes). Two-party total
    266,022. Trump two-party share 33.96%, Clinton 66.04%.
  - 2024: Trump 130,489 (38.28% of all votes); Harris 204,301 (59.93% of all votes). Two-party total
    334,790. Trump two-party share 38.98%, Harris 61.02%.
  - `rep_vote_share_change_pp` = 38.98 − 33.96 = **+5.0**
  - `dem_vote_share_change_pp` = 61.02 − 66.04 = **-5.0**
  - Directionally consistent with the row's pre-existing `election_change` value of "2% less Democratic"
    (legacy import, smaller magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Hawaii
    (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Hawaii
    (section 8)

## tags / description

- Tags: `["Military", "Beaches", "Hiking"]`.
- Military: Joint Base Pearl Harbor-Hickam (the largest Navy-Air Force installation, formed by a 2010
  merger) and the Pearl Harbor National Memorial are on Oahu near Honolulu.
  https://www.military.com/base-guide/joint-base-pearl-harbor-hickam
- Beaches: Waikiki Beach is a 2-mile stretch of white sand within Honolulu.
  https://truewindhealingtravel.com/honolulu-travel-highlights/
- Hiking: the Diamond Head summit trail, built as part of a historic coastal defense system, overlooks
  Waikiki. https://truewindhealingtravel.com/honolulu-travel-highlights/
- Description written from the same facts above.

## veterans_benefits

- Hawaii fully exempts military retirement pay (and SBP/RCSBP/RSFPP survivor annuities) from state
  income tax across all branches. https://militaryretirementcalc.com/states/hawaii-military-retirement
- Hawaii has no statewide veteran property tax exemption (administered by county); in Honolulu County a
  totally service-connected disabled veteran's home is exempt from real property tax except the county
  minimum tax (~$300/year for 2025-2026); a general $100,000 home exemption applies to all
  owner-occupied properties statewide.
  https://www.veteranpcs.com/blog/hawaii-veteran-property-tax-exemptions-2026

## Known limitations

None — all six target fields for this row were sourced and populated.
