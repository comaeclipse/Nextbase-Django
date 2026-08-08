# Manchester, NH Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 41); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Manchester 2024 violent crime rate: 336.9 per 100,000, FBI 2024 data (population ~115,464).
  https://www.homesnacks.com/nh/manchester-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 336.9 / 359.1 * 100 = 93.8, stored as 94 (integer).

## Elections (county: Hillsborough) — discrepancy noted

- Two-party math, Hillsborough County, NH:
  - 2016: Trump 100,013 (46.70% of all votes); Clinton 99,589 (46.50% of all votes). Two-party total
    199,602. Trump two-party share 50.11%, Clinton 49.89%.
  - 2024: Trump 112,057 (47.80% of all votes); Harris 118,776 (50.66% of all votes). Two-party total
    230,833. Trump two-party share 48.55%, Harris 51.45%.
  - `rep_vote_share_change_pp` = 48.55 − 50.11 = **-1.6**
  - `dem_vote_share_change_pp` = 51.45 − 49.89 = **+1.6**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "4% more
    Republican." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section under general election results, fetched via the MediaWiki
  parse API for the specific section — the 2016 article has two distinct "By county" sections, one
  under the Republican primary and one under general election results; the general-election one
  (section 10) was used):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_New_Hampshire
    (section 10)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_New_Hampshire
    (section 8)

## tags / description

- Tags: `["Arts", "History", "Riverfront"]`.
- Arts: the Currier Museum of Art holds works by Sargent, O'Keeffe, Monet, Matisse, and Picasso, and
  offers guided tours of the Zimmerman House — the only Frank Lloyd Wright-designed house in New
  England open to the public. https://www.lonelyplanet.com/usa/new-england/new-hampshire/manchester/attractions/currier-museum-of-art/a/poi-sig/1539892/362053
- History/Riverfront: the Amoskeag Millyard's historic brick textile-mill buildings, once the industry
  declined, were repurposed into tech offices, research facilities, museums, and residential lofts along
  the Merrimack River. https://www.letsroam.com/things-to-do/manchester-nh
- Description written from the same facts above.

## veterans_benefits

- New Hampshire has no state income tax on earned income, wages, or retirement pay, so military
  retirement is completely tax-free at the state level (confirmed since the Interest and Dividends Tax
  was repealed for taxable periods beginning after December 31, 2024).
  https://usmilitary.org/veteran-benefits-state/new-hampshire/
- Wartime veterans get a property tax credit of $51-$750 (municipality sets the amount above the $51
  state minimum); surviving spouses of veterans killed on active duty may qualify for $700-$2,000;
  permanently/totally disabled veterans, double amputees, and paraplegics get a base credit of $700 on
  their primary residence. https://www.nhveterans.nh.gov/veterans-services/nh-state-benefits-veterans

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).
