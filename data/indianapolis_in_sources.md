# Indianapolis, IN Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

Note: the DB row's `name` value is spelled `Indianopolis` (missing the second "a" — a pre-existing
legacy typo in `locations_location`, not introduced by this patch). This file uses "Indianapolis" for
readability except where quoting the exact stored value.

## Scope of this patch

Legacy-seed row (`locations_location` id 25); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, safety-checked) against `name =
'Indianopolis'`. No other column touched.

## tci (Safety and Social Policy)

- Indianapolis 2024 violent crime rate: 877.9 per 100,000 (7,819 violent crimes, reporting population
  890,685), FBI UCR data, 149% above the national average.
  (Search-aggregated summary citing FBI data; see also PlainCrime's Indianapolis profile independently
  reporting 878/100k.) https://plaincrime.com/city/indianapolis-in
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 877.9 / 359.1 * 100 = 244.4, stored as 244 (integer).

## Elections (county: Marion)

- Two-party math, Marion County, IN:
  - 2016: Trump 130,360 (35.53% of all votes); Clinton 212,899 (58.03% of all votes). Two-party total
    343,259. Trump two-party share 37.98%, Clinton 62.02%.
  - 2024: Trump 124,327 (35.08% of all votes); Harris 221,719 (62.57% of all votes). Two-party total
    346,046. Trump two-party share 35.93%, Harris 64.07%.
  - `rep_vote_share_change_pp` = 35.93 − 37.98 = **-2.1**
  - `dem_vote_share_change_pp` = 64.07 − 62.02 = **+2.1**
  - Directionally consistent with the row's pre-existing `election_change` value of "5% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Indiana (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Indiana (section 8)

## tags / description

- Tags: `["Arts", "Culture", "Parks", "Sports"]`.
- Arts/Culture/Parks: White River State Park (250 acres, downtown) hosts the Eiteljorg Museum, Indiana
  State Museum, and Indianapolis Zoo, about a mile from Monument Circle.
  https://www.visitindy.com/things-to-do/outdoor-recreation/white-river-state-park/
- Sports: the Indianapolis Motor Speedway, home of the Indy 500, is a short drive from downtown.
  https://www.visitindy.com/neighborhoods/speedway/
- Description written from the same facts above.

## veterans_benefits

- Indiana fully exempts both military retirement pay and active-duty pay from state income tax (the
  active-duty exemption effective with the 2024 tax year).
  https://www.in.gov/dor/files/ib27.pdf
- Under Indiana's new property tax credit system (HEA 1210, signed March 12, 2026, applying to 2026
  taxes payable in 2027): totally disabled veterans (100% rating or individual unemployability) get a
  full property tax exemption with no home-value cap; veterans rated 10-90% get fixed dollar credits;
  veterans must register with their county auditor by December 30, 2026 using State Form 12662.
  https://www.americanherohomeloans.com/indiana-property-tax-relief-veterans-2026/

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `tech_hub`, `defense_hub_manual`,
and `defense_hub`, out of scope for issue #29 (belong to issue #26).
