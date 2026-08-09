# Norfolk, VA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 60); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Norfolk 2024 violent crime rate: 469.5 per 100,000, FBI UCR 2024 data (30.78% above the national
  average). https://www.homesnacks.com/va/norfolk-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 469.5 / 359.1 * 100 = 130.7, stored as 131 (integer).

## Elections (independent city: Norfolk) — discrepancy noted

- Virginia's independent cities (including Norfolk) are their own election-reporting jurisdictions,
  separate from any surrounding county; Wikipedia's Virginia results table is titled "By county and
  independent city" and lists Norfolk as its own row, which was used directly.
- Two-party math, City of Norfolk, VA:
  - 2016: Trump 21,552 (25.85% of all votes); Clinton 57,023 (68.38% of all votes). Two-party total
    78,575. Trump two-party share 27.43%, Clinton 72.57%.
  - 2024: Trump 24,377 (28.34% of all votes); Harris 59,941 (69.69% of all votes). Two-party total
    84,318. Trump two-party share 28.92%, Harris 71.08%.
  - `rep_vote_share_change_pp` = 28.92 − 27.43 = **+1.5**
  - `dem_vote_share_change_pp` = 71.08 − 72.57 = **-1.5**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "2% more
    Democratic." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county and independent city" section, fetched via the MediaWiki parse API for
  the specific section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Virginia
    (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Virginia
    (section 9)

## tags / description

- Tags: `["Military", "Coastal", "History"]`.
- Military/Coastal: Naval Station Norfolk is the world's largest naval base, homeport to the U.S.
  Navy's Fleet Forces Command with 75 ships and 134 aircraft across 4,300 acres of Hampton Roads
  waterfront. https://www.military.com/base-guide/naval-station-norfolk
- History: established in 1917 for WWI operations, rapidly expanded in WWII as a key Atlantic
  embarkation point. https://encyclopediavirginia.org/entries/naval-station-norfolk/
- Description written from the same facts above.

## veterans_benefits

- Virginia allows military retirees to subtract up to $40,000 of retirement pay from state taxable
  income starting the 2025 tax year, no age requirement; the cap is scheduled to be removed entirely
  starting the 2026 tax year. Medal of Honor recipients get a full exemption.
  https://usmilitary.org/veteran-benefits-state/virginia/
- Veterans with a 100% permanent and total service-connected disability are exempt from property taxes
  on their primary residence (up to one acre) and one vehicle.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Virginia

## Known limitations

None — all six target fields for this row were sourced and populated.
