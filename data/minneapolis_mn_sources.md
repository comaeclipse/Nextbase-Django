# Minneapolis, MN Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 33); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Minneapolis 2024 violent crime rate: 1,160.22 per 100,000 (4,911 violent crimes), FBI UCR 2024 data.
  https://www.beautifydata.com/united-states-crimes/fbi-ucr/2024/total-violent-and-property-crimes-per-city/minnesota/minneapolis
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1160.22 / 359.1 * 100 = 323.1, stored as 323 (integer).

## Elections (county: Hennepin)

- Two-party math, Hennepin County, MN:
  - 2016: Trump 191,770 (28.20% of all votes); Clinton 429,288 (63.13% of all votes). Two-party total
    621,058. Trump two-party share 30.88%, Clinton 69.12%.
  - 2024: Trump 197,244 (27.39% of all votes); Harris 502,710 (69.80% of all votes). Two-party total
    699,954. Trump two-party share 28.18%, Harris 71.82%.
  - `rep_vote_share_change_pp` = 28.18 − 30.88 = **-2.7**
  - `dem_vote_share_change_pp` = 71.82 − 69.12 = **+2.7**
  - Directionally consistent with the row's pre-existing `election_change` value of "7% more Democratic"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Minnesota
    (section 11)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Minnesota
    (section 10)

## tags / description

- Tags: `["Parks", "Arts", "Riverfront"]`.
- Parks: the Chain of Lakes Regional Park links five lakes (Lake Harriet, Bde Maka Ska, etc.) for
  boating, biking, and swimming. https://www.minneapolis.org/things-to-do/nature-outdoors/lakes/chain-of-lakes/
- Arts: the Walker Art Center holds modern/contemporary art and adjoins the Minneapolis Sculpture
  Garden (home of Spoonbridge and Cherry), one of the largest urban sculpture gardens in the country.
  https://travel.usnews.com/Minneapolis_MN/Things_To_Do/Walker_Art_Center_11354/
- Riverfront: Minnehaha Falls cascades 53 feet into the Mississippi River.
  https://www.visittheusa.com/destinations/minnesota/minneapolis/
- Description written from the same facts above.

## veterans_benefits

- Minnesota allows an unlimited subtraction for military retirement pay from state income tax (no
  age/income limits), covering traditional retirement, Reserve/Guard retirement, and SBP payments (file
  Form M1M). https://militaryretirementcalc.com/states/minnesota-military-retirement
- Disabled veterans get a market value exclusion rather than a flat exemption: 70-99% rating excludes
  $150,000, 100% P&T excludes $300,000; apply through the county assessor by December 15 for the
  following year's taxes. https://www.veteranpcs.com/blog/minnesota-veteran-property-tax-exemptions-2026

## Known limitations

None — all six target fields for this row were sourced and populated.
