# Cheyenne, WY Source Notes (Cohort A backfill, issue #29) — FINAL CITY OF THIS COHORT

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 65); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Cheyenne 2024 violent crime rate: 328.5 per 100,000 (214 violent crimes), FBI 2024 data, cross-checked
  across sources for internal consistency (214 crimes / 328.5 rate implies a population base
  consistent with Cheyenne's size). https://www.homesnacks.com/wy/cheyenne-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill, and the same baseline
  documented in this repo's existing Casper, WY sources.md for cross-city consistency within the
  state).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 328.5 / 359.1 * 100 = 91.5, stored as 91 (integer).

## Elections (county: Laramie) — discrepancy noted

- Two-party math, Laramie County, WY:
  - 2016: Trump 24,847 (60.65% of all votes); Clinton 11,573 (28.25% of all votes). Two-party total
    36,420. Trump two-party share 68.22%, Clinton 31.78%.
  - 2024: Trump 28,063 (64.72% of all votes); Harris 14,153 (32.64% of all votes). Two-party total
    42,216. Trump two-party share 66.48%, Harris 33.52%.
  - `rep_vote_share_change_pp` = 66.48 − 68.22 = **-1.7**
  - `dem_vote_share_change_pp` = 33.52 − 31.78 = **+1.7**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "4% more
    Republican." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Wyoming (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Wyoming (section 8)

## tags / description

- Tags: `["History", "Culture", "Music"]`.
- History/Culture: Cheyenne Frontier Days, "the world's largest outdoor rodeo and western
  celebration," founded 1887, held the last full week of July; centers on Depot Plaza, in front of the
  1886 Union Pacific depot (now the Cheyenne Depot Museum).
  https://www.cheyenne.org/events/cheyenne-frontier-days/
- Music/Culture: Depot Plaza hosts "Fridays on the Plaza," a free weekly summer concert series, plus
  the newly restored (2019) Wyoming State Capitol and the free Wyoming State Museum.
  https://wanderlog.com/place/details/285572/cheyenne-depot-plaza
- Description written from the same facts above.

## veterans_benefits

- Wyoming has no state income tax, so military retirement pay and all other retirement income are
  entirely untaxed by the state (consistent with this repo's existing Casper, WY sources.md for the
  same statewide policy).
- Veterans with a compensable VA service-connected disability (any rating, regardless of time of
  service), who have been Wyoming residents for the preceding three years, qualify for a property tax
  exemption reducing assessed valuation by $6,000 annually (doubled from $3,000 effective January 1,
  2025 — this current $6,000 figure matches what this repo's existing Casper, WY sources.md already
  documented for Natrona County, confirming statewide consistency); the exemption can be applied toward
  vehicle licensing fees instead of real property. Laramie County's application deadline is typically
  late May for the current tax year.
  https://www.laramiecountywy.gov/County-Government/Elected-Officials/County-Assessor/Veterans-Exemptions
  https://www.wyomingnews.com/news/local_news/laramie-county-assessor-reminds-eligible-veterans-about-property-tax-exemption/article_b52bb455-ff4c-4827-ae38-4cc33d6636b4.html

## Known limitations

None — all six target fields for this row were sourced and populated.

---

**This completes issue #29's ~59-city cohort.** See the final wrap-up comment on the issue for a
project-wide summary.
