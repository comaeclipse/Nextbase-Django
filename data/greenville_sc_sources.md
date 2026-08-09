# Greenville, SC Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 54); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Greenville 2024 violent crime rate: 644.4 per 100,000 (473 violent crimes), FBI UCR data.
  https://plaincrime.com/city/greenville-sc
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 644.4 / 359.1 * 100 = 179.4, stored as 179 (integer).

## Elections (county: Greenville)

- Two-party math, Greenville County, SC:
  - 2016: Trump 127,832 (59.41% of all votes); Clinton 74,483 (34.62% of all votes). Two-party total
    202,315. Trump two-party share 63.19%, Clinton 36.81%.
  - 2024: Trump 158,541 (60.21% of all votes); Harris 100,074 (38.01% of all votes). Two-party total
    258,615. Trump two-party share 61.30%, Harris 38.70%.
  - `rep_vote_share_change_pp` = 61.30 − 63.19 = **-1.9**
  - `dem_vote_share_change_pp` = 38.70 − 36.81 = **+1.9**
  - Directionally consistent with the row's pre-existing `election_change` value of "4% less Republican"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_South_Carolina
    (section 10)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_South_Carolina
    (section 9)

## tags / description

- Tags: `["Parks", "Riverfront", "Arts"]`.
- Parks/Riverfront: Falls Park on the Reedy — a top-rated U.S. park — features the 345-foot Liberty
  Bridge over the Reedy River Falls; the nearly 20-mile Swamp Rabbit Trail runs along the river.
  https://www.visitgreenvillesc.com/things-to-do/attractions/downtown/falls-park-on-the-reedy/
- Arts: the Peace Center performing arts venue hosts music, theater, and dance.
  https://www.greenville.com/falls-park-on-the-reedy/
- Description written from the same facts above.

## veterans_benefits

- Since the 2022 tax year, South Carolina fully exempts all military retirement pay from state income
  tax (including SBP, RCSBP, RSFPP), no age/income/earned-income requirement; VA disability
  compensation is untaxed. https://usmilitary.org/veteran-benefits-state/south-carolina/
- Veterans with a 100% total and permanent service-connected disability get a full property tax
  exemption (bill to zero, no value cap) on their homestead and up to 5 acres, plus exemption from
  property tax on up to two private vehicles. https://claim.vet/blog/south-carolina-veterans-benefits/

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).
