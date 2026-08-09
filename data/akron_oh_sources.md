# Akron, OH Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 46); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Akron 2024 violent crime rate: 820.3 per 100,000 (1,544 violent crimes), FBI data, 128.50% above the
  national average, up 4% year over year. https://www.homesnacks.com/oh/akron-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 820.3 / 359.1 * 100 = 228.4, stored as 228 (integer).

## Elections (county: Summit) — discrepancy noted

- Two-party math, Summit County, OH:
  - 2016: Trump 112,026 (43.03% of all votes); Clinton 134,256 (51.57% of all votes). Two-party total
    246,282. Trump two-party share 45.49%, Clinton 54.51%.
  - 2024: Trump 125,910 (45.88% of all votes); Harris 145,005 (52.83% of all votes). Two-party total
    270,915. Trump two-party share 46.48%, Harris 53.52%.
  - `rep_vote_share_change_pp` = 46.48 − 45.49 = **+1.0**
  - `dem_vote_share_change_pp` = 53.52 − 54.51 = **-1.0**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "1% more
    Democratic." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Ohio (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Ohio (section 10)

## tags / description

- Tags: `["Hiking", "Arts", "History"]`.
- Hiking: Cuyahoga Valley National Park, Ohio's only national park (33,000 acres), borders Akron and
  includes the 60-foot Brandywine Falls. https://clevelandtraveler.com/visiting-stan-hywet-hall/
- Arts/History: Stan Hywet Hall & Gardens, the 65-room Tudor Revival estate of Goodyear Tire &
  Rubber Company founder F.A. Seiberling, with 70 acres of gardens; the Akron Art Museum holds modern
  and contemporary art. https://evendo.com/locations/ohio/cuyahoga-valley-national-park/attraction/stan-hywet-hall-gardens
- Description written from the same facts above.

## veterans_benefits

- Ohio fully exempts all military retirement pay from state income tax, including Survivor Benefit
  Plan and RCSBP annuities, with no income or age limits.
  https://militaryretirementcalc.com/states/ohio-military-retirement
- Veterans with a 100% VA disability rating (including individual unemployability) qualify for the
  Enhanced Homestead Exemption, removing $58,000 of appraised home value from property taxation for
  tax year 2026, no income limit; not automatic, must apply.
  https://www.aol.com/ohio-expands-property-tax-exemptions-020017216.html

## Known limitations

None — all six target fields for this row were sourced and populated.
