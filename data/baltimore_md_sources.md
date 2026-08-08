# Baltimore, MD Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 30); pre-patch scan confirmed all six target fields were
genuinely NULL/empty (this row's `election_change` was already null/blank pre-patch, and remains so —
out of scope for this patch's field bundle). Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Baltimore 2024 violent crime rate: 1,606.2 per 100,000 (9,101 violent crimes), FBI UCR 2024 data, per
  PlainCrime's Baltimore city profile. https://plaincrime.com/city/baltimore-md
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1606.2 / 359.1 * 100 = 447.3, stored as 447 (integer). This is the highest TCI computed so far
  in this backfill; flagged for visibility.

## Elections (Baltimore City, independent city — not Baltimore County)

- Maryland's Baltimore City is an independent city, legally and electorally distinct from the
  surrounding Baltimore County. Wikipedia's county results tables list both as separate rows; this row
  used the "Baltimore City" line specifically to match the curated location (the city, not the county).
- Two-party math, Baltimore City, MD:
  - 2016: Trump 25,205 (10.53% of all votes); Clinton 202,673 (84.66% of all votes). Two-party total
    227,878. Trump two-party share 11.06%, Clinton 88.94%.
  - 2024: Trump 27,984 (12.13% of all votes); Harris 195,109 (84.55% of all votes). Two-party total
    223,093. Trump two-party share 12.54%, Harris 87.46%.
  - `rep_vote_share_change_pp` = 12.54 − 11.06 = **+1.5**
  - `dem_vote_share_change_pp` = 87.46 − 88.94 = **-1.5**
  - No pre-existing `election_change` value existed on this row to compare against (it was already
    null before this patch and remains untouched — out of scope).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Maryland
    (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Maryland
    (section 8)

## tags / description

- Tags: `["History", "Coastal", "Arts"]`.
- Coastal/Arts: the Inner Harbor hosts the National Aquarium and historic ships including the USS
  Constellation (built 1854, the only surviving Civil War-era Navy ship).
  https://baltimore.org/what-to-do/museums-attractions/a-tour-of-baltimores-inner-harbor/
- History: Fort McHenry, three miles from the Inner Harbor, withstood the 1814 British bombardment that
  inspired Francis Scott Key to write the Star-Spangled Banner.
  https://baltimore.org/what-to-do/behind-the-ramparts-of-fort-mchenry/
- Description written from the same facts above.

## veterans_benefits

- Maryland excludes $12,500 of military retirement income for retirees under 55 and $20,000 for 55+;
  retirees 55+ may also qualify for the state's general pension exclusion (up to $39,500 for 2026), but
  the combined military + general exclusion cannot exceed the total pension received.
  https://militaryretirementcalc.com/states/maryland-military-retirement
- Veterans rated 100% permanently and totally disabled (or 100% unemployable) by the VA get a complete
  exemption from Maryland real property taxes on their primary home; many counties offer supplemental
  property tax credits for veterans with 50%+ disability ratings.
  https://veterans.maryland.gov/benefits-services/tax-exemptions

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `election_change` (text summary,
not part of issue #29's field bundle) — left blank rather than derived unilaterally, out of scope for
this patch.
