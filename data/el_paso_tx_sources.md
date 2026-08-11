# El Paso, TX Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 58); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- El Paso 2024 violent crime rate: 278.4 per 100,000 (1,890 violent crimes, 20 homicides), FBI UCR
  data, 22.45% below the national average. https://www.homesnacks.com/tx/el-paso-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 278.4 / 359.1 * 100 = 77.5, stored as 78 (integer).

## Elections (county: El Paso)

- Two-party math, El Paso County, TX:
  - 2016: Trump 55,512 (25.71% of all votes); Clinton 147,843 (68.47% of all votes). Two-party total
    203,355. Trump two-party share 27.30%, Clinton 72.70%.
  - 2024: Trump 105,124 (41.79% of all votes); Harris 143,156 (56.91% of all votes). Two-party total
    248,280. Trump two-party share 42.34%, Harris 57.66%.
  - `rep_vote_share_change_pp` = 42.34 − 27.30 = **+15.0**
  - `dem_vote_share_change_pp` = 57.66 − 72.70 = **-15.0**
  - Closely matches the row's pre-existing `election_change` value of "12% less Democratic" — one of the
    cleaner agreements found in this backfill.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Texas (section 12)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Texas (section 10)

## tags / description

- Tags: `["Hiking", "Mountains", "Culture"]`.
- Hiking/Mountains: Franklin Mountains State Park (24,000-27,000 acres, 100+ miles of trails) is
  described as the most significant urban park in the country.
  https://tpwd.texas.gov/state-parks/franklin-mountains
- Culture: the Chamizal National Memorial (55 acres) hosts a cultural center, art gallery, theater, and
  amphitheater documenting the resolution of the US-Mexico border dispute; the El Paso Mission Trail has
  centuries-old Spanish missions. https://wnpa.org/explore-parks/chamizal
- Description written from the same facts above.

## veterans_benefits

- Texas has no state income tax, so military retirement pay and all other retirement income are
  entirely untaxed at the state level.
  https://militaryretirementcalc.com/states/texas-military-retirement
- Texas offers property tax exemptions ranging from $5,000 to $12,000 based on disability rating for
  veterans rated 10%+ disabled; a veteran with a 100% disability rating (or 65+) receives a full
  property tax exemption on their homestead.
  https://usmilitary.org/veteran-benefits-state/veteran-benefits-in-texas/

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated.
`scripts/verify-location-completeness.ts` flags this row as missing `defense_hub_manual`/`defense_hub`,
out of scope for issue #29 (belongs to issue #26).

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Fort Bliss, the U.S. Army's 2nd-largest post by land area with roughly 90,000 soldiers and family members and home to the 1st Armored Division, sits directly in El Paso — an overwhelming defense presence beyond the tracked Raytheon (7 onsite) posting.

Sources:
- Wikipedia, "Fort Bliss" — https://en.wikipedia.org/wiki/Fort_Bliss
- U.S. Army, Fort Bliss official site — https://home.army.mil/bliss/
