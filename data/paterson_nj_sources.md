# Paterson, NJ Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 42); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Paterson 2024 violent crime rate: 978.6 per 100,000, FBI 2024 UCR data (349.50% above the New Jersey
  state rate of 217.7). https://www.homesnacks.com/nj/paterson-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 978.6 / 359.1 * 100 = 272.5, stored as 273 (integer).

## Elections (county: Passaic)

- Two-party math, Passaic County, NJ:
  - 2016: Trump 72,902 (37.15% of all votes); Clinton 116,759 (59.50% of all votes). Two-party total
    189,661. Trump two-party share 38.44%, Clinton 61.56%.
  - 2024: Trump 100,954 (49.79% of all votes); Harris 95,156 (46.93% of all votes). Two-party total
    196,110. Trump two-party share 51.48%, Harris 48.52%.
  - `rep_vote_share_change_pp` = 51.48 − 38.44 = **+13.0**
  - `dem_vote_share_change_pp` = 48.52 − 61.56 = **-13.0**
  - This closely matches the row's pre-existing `election_change` value of "13% more Republican" — one
    of the cleanest agreements found in this backfill between the legacy field and the newly-computed
    strict two-party trend.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_New_Jersey
    (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_New_Jersey
    (section 8)

## tags / description

- Tags: `["History", "Hiking", "Riverfront"]`.
- History/Riverfront: Paterson Great Falls National Historical Park protects the 77-foot Great Falls of
  the Passaic River — the second-largest waterfall by volume east of the Mississippi — the site
  Alexander Hamilton chose in 1792 to found the first planned industrial city in the U.S.
  https://www.nps.gov/pagr
- Hiking: the park offers scenic pathways, an overlook, and hiking trails, all free to visit.
  https://gardenstatego.com/attractions/paterson-great-falls-national-historical-park/
- Description written from the same facts above.

## veterans_benefits

- New Jersey fully exempts military retirement pay (active duty, reserve, National Guard) from state
  income tax, with no age or income limit; honorably discharged veterans also get an additional $6,000
  New Jersey income tax exemption. https://militaryretirementcalc.com/states/new-jersey-military-retirement
- New Jersey offers a property tax credit of up to $6,000/year for veterans 65+ or permanently/totally
  disabled; 100% permanently and totally disabled veterans get a full property tax exemption.
  https://usmilitary.org/veteran-benefits-state/new-jersey/

## Known limitations

None — all six target fields for this row were sourced and populated.
