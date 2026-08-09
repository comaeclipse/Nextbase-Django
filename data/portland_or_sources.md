# Portland, OR Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 50); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Portland (OR) 2024 violent crime rate: 720.1 per 100,000 (4,487 violent crimes: 2,998 aggravated
  assault, 1,105 robbery, 67 murder, 317 rape; reporting population 623,066), FBI UCR data.
  https://plaincrime.com/city/portland-or
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 720.1 / 359.1 * 100 = 200.5, stored as 201 (integer). (Note: the search-aggregated "920% higher
  than the national average" comparator quoted alongside this figure does not check out arithmetically
  against 720.1/359.1 — that comparator was ignored; the 720.1/100k Portland figure itself is
  independently corroborated as FBI-sourced.)

## Elections (county: Multnomah)

- Two-party math, Multnomah County, OR:
  - 2016: Trump 67,954 (17.03% of all votes); Clinton 292,561 (73.30% of all votes). Two-party total
    360,515. Trump two-party share 18.85%, Clinton 81.15%.
  - 2024: Trump 70,759 (17.08% of all votes); Harris 325,927 (78.68% of all votes). Two-party total
    396,686. Trump two-party share 17.84%, Harris 82.16%.
  - `rep_vote_share_change_pp` = 17.84 − 18.85 = **-1.0**
  - `dem_vote_share_change_pp` = 82.16 − 81.15 = **+1.0**
  - Directionally consistent with the row's pre-existing `election_change` value of "6% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Oregon
    (section 13)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Oregon (section 9)

## tags / description

- Tags: `["Arts", "Parks", "Culture"]`.
- Arts/Culture: Powell's City of Books, the world's largest independent bookstore (four floors, over a
  million volumes), anchors the Pearl District.
  https://travel.usnews.com/Portland_OR/Things_To_Do/Powell_s_City_of_Books_52556/
- Parks: Washington Park hosts the Portland Japanese Garden (5.5 acres, established 1963) and the
  International Rose Test Garden, plus the Oregon Zoo and Hoyt Arboretum.
  https://explorewashingtonpark.org/150th-anniversary/japanese-garden/
- Description written from the same facts above.

## veterans_benefits

- Oregon currently exempts only the portion of military/federal pension income based on service before
  October 1, 1991 from state income tax (pay for service on/after that date is taxed). Pending
  legislation (HB2050) would fully exempt federal retirement pay for disabled veterans and reserve/
  National Guard members for tax years beginning on/after January 1, 2026, but was not confirmed
  enacted as of this research date, so the current partial-exemption rule is what's recorded here.
  https://www.oregon.gov/dor/programs/individuals/pages/military.aspx
- Oregon offers a property tax exemption of $26,303 or $31,565 (varies) on the assessed value of a
  disabled veteran's (or surviving spouse's) homestead; Oregon has no state sales tax.
  https://www.militarytransitiontoolkit.com/blog/or-veteran-tax-benefits-2025

## Known limitations

None — all six target fields for this row were sourced and populated.
