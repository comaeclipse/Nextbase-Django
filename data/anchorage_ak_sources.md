# Anchorage, AK Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

This row (`locations_location` id 7) is a legacy-seed row that already had population, housing, tax,
climate, VA, and 2016/2024 election winner/percent fields populated. This patch backfills only the
fields tracked by issue #29: `tci`, `rep_vote_share_change_pp`, `dem_vote_share_change_pp`, `tags`,
`description`, `veterans_benefits`. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed), not a full CSV re-import, so no other
column was touched.

## tci (Safety and Social Policy)

- Method: violent crime rate per 100,000 indexed to the FBI 2024 national violent-crime baseline
  (=100), lower is safer, per the skill's documented methodology.
- Anchorage 2024 violent crime rate: 1,014.8 per 100,000 (2,912 violent crimes, reporting population
  286,958), FBI UCR-derived, per PlainCrime's Anchorage city profile.
  https://plaincrime.com/city/anchorage-ak
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000, from the FBI CDE "UCR Summary of
  Reported Crimes in the Nation, 2024" (same baseline document already used for Dallas, TX and Casper,
  WY in this repo, for cross-city consistency).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1014.8 / 359.1 * 100 = 282.56, stored as 283 (integer).

## Elections — rep_vote_share_change_pp / dem_vote_share_change_pp (resolved 2026-08-25, issue #55)

The 2026-08-08 Cohort A pass left these blank because Alaska does not publish a ready-made
borough presidential rollup for 2016. That gap is now closed with a same-geography reconstruction
documented in `data/sources/elections/anchorage_ak_presidential_2016_2024.md`.

Summary (Municipality of Anchorage, two-party shares):

| Year | DEM votes | REP votes | DEM two-party % | REP two-party % | Source |
| --- | ---: | ---: | ---: | ---: | --- |
| 2016 | 53,969 | 61,083 | 46.908 | 53.092 | OE precinct CSV + Census borough spatial join + district Absentee/Early apportionment |
| 2024 | 64,781 | 62,925 | 50.726 | 49.274 | Wikipedia borough table (certified returns) |

- `rep_vote_share_change_pp` = 49.274 − 53.092 = **-3.8**
- `dem_vote_share_change_pp` = 50.726 − 46.908 = **+3.8**
- `election_change` = `3.8 pp more Democratic since 2016`
- Borough two-party winners/percents corrected on the row: 2016 Trump/53, 2024 Harris/51
  (legacy values were statewide-flavored and incorrectly listed 2024 as Trump/54).
- `city_politics` = `Municipality-level: Mixed / Swing` (2024 Dem two-party share 50.7%).

Apply via `scripts/apply-anchorage-vote-deltas.ts` (`--dry-run` first).

## tags / description (Economic Hubs and Lifestyle Tags)

- Tags stored: `["Military", "Fishing", "Hiking", "Mountains", "Arts", "Culture"]`.
- Military: Anchorage is adjacent to Joint Base Elmendorf-Richardson (JBER).
  https://mybaseguide.com/things-to-do-anchorage-alaska
- Hiking/Mountains: Chugach State Park (approx. 495,000 acres) borders the city.
  https://mybaseguide.com/things-to-do-anchorage-alaska
- Fishing: year-round fishing and salmon runs in local lakes/rivers, per the same source and the
  Alaska Outdoors Supersite Anchorage fishing page.
  https://alaskaoutdoorssupersite.com/anchorage-fishing/211-anchorage-local-fishing
- Arts/Culture: Anchorage Museum and Alaska Aviation Museum cited as core attractions.
  https://mybaseguide.com/things-to-do-anchorage-alaska
- Description: "Anchorage is Alaska's largest city and home to Joint Base Elmendorf-Richardson,
  bordered by the 495,000-acre Chugach State Park with year-round salmon fishing, hiking, and coastal
  trail access." Sourced from the same JBER/Chugach State Park facts above; written as a short factual
  summary, not marketing copy.

## veterans_benefits (Veterans Affairs)

- Alaska has no individual income tax, so military retirement pay is not state-taxed.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Alaska
- Veterans with a VA disability rating of 50% or greater who own and occupy their home as a primary
  residence receive a property tax exemption on the first $150,000 of assessed value; the exemption
  transfers to a surviving spouse age 60 or older. (Municipality of Anchorage's own page confirms local
  administration of this state-authorized exemption.)
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Alaska
  https://www.muni.org/Departments/Mayor/Pages/DisabledVeteranPropertyTaxExemption.aspx

## Known limitations

- 2016 borough totals are reconstructed (official precinct + district Absentee/Early apportionment),
  not a Division of Elections published borough table. Cross-check vs Akashic’s borough series
  differs by <0.1 pp on the two-party Republican share; see the elections sources note.
- `county` on this row remains the legacy label `Alaska` (not `Anchorage Municipality`); out of
  scope for the vote-delta patch.
