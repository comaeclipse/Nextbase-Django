# Warren, MI Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 32); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Warren 2024 violent crime rate: 541.8 per 100,000 (736 violent crimes), FBI UCR 2024 data, per
  PlainCrime's Warren city profile. https://plaincrime.com/city/warren-mi
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 541.8 / 359.1 * 100 = 150.9, stored as 151 (integer).

## Elections (county: Macomb)

- Two-party math, Macomb County, MI:
  - 2016: Trump 224,665 (53.58% of all votes); Clinton 176,317 (42.05% of all votes). Two-party total
    400,982. Trump two-party share 56.03%, Clinton 43.97%.
  - 2024: Trump 284,660 (55.91% of all votes); Harris 214,977 (42.22% of all votes). Two-party total
    499,637. Trump two-party share 56.97%, Harris 43.03%.
  - `rep_vote_share_change_pp` = 56.97 − 56.03 = **+0.9**
  - `dem_vote_share_change_pp` = 43.03 − 43.97 = **-0.9**
  - Directionally consistent with the row's pre-existing `election_change` value of "2% more Republican"
    (legacy import, similar order of magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Michigan
    (section 12)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Michigan
    (section 9)

## tags / description

- Tags: `["Military", "Manufacturing", "History"]`.
- Military: the Detroit Arsenal in Warren is Michigan's only active-duty military installation and
  headquarters of the U.S. Army's Tank-automotive and Armaments Command (TACOM).
  https://home.army.mil/detroit/my-fort/newcomers
- Manufacturing/History: the Detroit Tank Arsenal built over 25,000 tanks for the Allies during WWII,
  established 1940 under Chrysler as the first mass-production tank plant in the U.S.
  https://en.wikipedia.org/wiki/Detroit_Arsenal_(Warren,_Michigan)
- Description written from the same facts above.

## veterans_benefits

- Michigan fully exempts military retirement pay from state income tax across all branches, reserve
  retirement, and National Guard retirement.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Michigan
- Veterans with a 100% permanent and total disability rating, individual unemployability (IU) rating,
  or VA specially adapted housing assistance qualify for a full property tax exemption; file Form 5107
  with the local assessor by December 31 (starting 2026, annual reapplication is no longer required).
  https://www.vetcalc.org/veteran-benefits/michigan/

## Known limitations

None — all six target fields for this row were sourced and populated.
