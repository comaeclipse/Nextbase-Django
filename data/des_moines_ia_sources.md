# Des Moines, IA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 22). Pre-patch scan showed only `tci`,
`rep_vote_share_change_pp`, `dem_vote_share_change_pp`, `tags`, and `veterans_benefits` missing —
`description` already had a pre-existing value ("Blending Midwest friendliness with a thriving job
market...") and was correctly **excluded** from this patch (the safety-checked
`scripts/_apply_cohort_a_patch.cjs` would have refused to run otherwise). Applied via a single-row
parameterized SQL UPDATE (transient helper, not committed). No other column touched.

## tci (Safety and Social Policy)

- Des Moines 2024 violent crime rate: 703.0 per 100,000 (1,471 violent crimes), FBI UCR 2024 data, per
  HomeSnacks (internally consistent: "95.82% higher than the national rate of 359.0" — 703.0/359.0 ≈
  1.96, checks out). https://www.homesnacks.com/ia/des-moines-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 703.0 / 359.1 * 100 = 195.7, stored as 196 (integer).

## Elections (county: Polk)

- Two-party math, Polk County, IA:
  - 2016: Trump 93,492 (40.38% of all votes); Clinton 119,804 (51.74% of all votes). Two-party total
    213,296. Trump two-party share 43.84%, Clinton 56.16%.
  - 2024: Trump 112,240 (43.70% of all votes); Harris 140,075 (54.54% of all votes). Two-party total
    252,315. Trump two-party share 44.48%, Harris 55.52%.
  - `rep_vote_share_change_pp` = 44.48 − 43.84 = **+0.6**
  - `dem_vote_share_change_pp` = 55.52 − 56.16 = **-0.6**
  - Net: essentially unchanged, very slightly more Republican by strict two-party math. The row's
    pre-existing `election_change` ("3% more Democratic") points the opposite direction — flagged for
    transparency (same pattern as Costa Mesa/Bridgeport/Malabar/Pensacola), `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Iowa (section 10)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Iowa (section 9)

## tags

- Tags: `["Arts", "Culture", "Parks"]`.
- Arts/Culture: the Pappajohn Sculpture Park (4.4 acres, 30+ sculptures, run by the Des Moines Art
  Center) is a free downtown cultural venue. https://desmoinesartcenter.org/visit/pappajohn-sculpture-park/
- Parks: Water Works Park offers trails and open green space.
  https://travel2next.com/things-to-do-des-moines/

## veterans_benefits

- Iowa fully exempts military retirement pay (and SBP payments) from state income tax with no cap;
  active-duty pay is also tax-free for Iowa residents.
  https://militaryretirementcalc.com/states/iowa-military-retirement
- A veteran rated 100% service-connected disabled (or 100% via individual unemployability) qualifies
  for the Disabled Veteran Homestead Tax Credit — a full 100% property tax exemption on the homestead,
  no income limit (applications on/after July 1, 2026 limit the homestead to one-half acre); other
  qualifying wartime/peacetime veterans get a flat $4,000 assessed-value reduction instead.
  https://www.veteranpcs.com/blog/iowa-veteran-property-tax-exemptions-2026

## Known limitations

None of the five fields this patch targeted were left blank. `description` was intentionally left
untouched (already populated pre-patch). `scripts/verify-location-completeness.ts` flags this row as
missing `defense_hub_manual`/`defense_hub`, out of scope for issue #29 (belongs to issue #26).

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Des Moines Air National Guard Base, home of the full flying/mission 132nd Wing, is located at Des Moines International Airport, with Camp Dodge nearby in Johnston — a genuine military-installation presence. (Note: Collins Aerospace's 7 tracked postings in Des Moines are remote-only and do not themselves count as physical presence under the hub formula; this TRUE rests on the ANG base, not the Collins postings.)

Sources:
- Wikipedia, "Des Moines Air National Guard Base" — https://en.wikipedia.org/wiki/Des_Moines_Air_National_Guard_Base
- 132nd Wing official site — https://www.132dwing.ang.af.mil/
- Wikipedia, "Camp Dodge" — https://en.wikipedia.org/wiki/Camp_Dodge
