# Billings, MT Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 36); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Billings 2024 violent crime rate: 746.1 per 100,000 (911 violent crimes), FBI data, 107.82% above the
  national average. https://www.homesnacks.com/mt/billings-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 746.1 / 359.1 * 100 = 207.7, stored as 208 (integer).

## Elections (county: Yellowstone) — discrepancy noted

- Two-party math, Yellowstone County, MT:
  - 2016: Trump 40,920 (58.05% of all votes); Clinton 22,171 (31.45% of all votes). Two-party total
    63,091. Trump two-party share 64.86%, Clinton 35.14%.
  - 2024: Trump 50,460 (62.00% of all votes); Harris 28,392 (34.88% of all votes). Two-party total
    78,852. Trump two-party share 64.00%, Harris 36.00%.
  - `rep_vote_share_change_pp` = 64.00 − 64.86 = **-0.9**
  - `dem_vote_share_change_pp` = 36.00 − 35.14 = **+0.9**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "4% more
    Republican." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Montana (section 7)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Montana
    (section 10)

## tags / description

- Tags: `["Hiking", "History", "Riverfront"]`.
- Hiking/History: Pictograph Cave State Park, 5 miles south of downtown, has paved trails to three
  caves with 2,100-year-old prehistoric pictographs. https://en.wikipedia.org/wiki/Pictograph_Cave_(Billings,_Montana)
- Riverfront: the Yellowstone River, the longest undammed river in the lower 48, runs through Billings
  beneath the Rimrock sandstone bluffs. https://experiencelewisandclark.travel/billings-and-the-trailhead-to-yellowstone/
- Description written from the same facts above.

## veterans_benefits

- Working military retirees who are Montana residents may deduct up to 50% of their military
  retirement/survivor pay for the first five consecutive years after meeting eligibility (available to
  those who became residents after June 30, 2023, or were residents before receiving retired pay;
  exemption scheduled to expire tax year 2033). Active-duty pay is tax-free.
  https://revenue.mt.gov/news/tnycu/military-retirement-exemption-for-working-military-retirees-beginning-in-tax-year-2024
- Honorably discharged veterans with a 100% service-connected disability (or unmarried surviving
  spouse) may qualify for a reduced property tax rate through Montana's Disabled Veterans Assistance
  Program, subject to income limits.
  https://www.military.com/benefits/veteran-state-benefits/montana-state-veterans-benefits.html

## Known limitations

None — all six target fields for this row were sourced and populated.
