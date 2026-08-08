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

## Elections — rep_vote_share_change_pp / dem_vote_share_change_pp (left blank, documented gap)

- Alaska has no counties; the state reports presidential returns only by precinct (442 precincts) and
  aggregates for public releases only by state house/senate district, not by borough. The Anchorage
  house districts do not map 1:1 onto the Municipality of Anchorage borough boundary for older
  (pre-2022) redistricting cycles, so a house-district aggregation would not be a clean same-geography
  comparison across 2016 and 2024.
- 2024 borough-level total **was** found and is usable context, but no reliable, accessible 2016
  borough-level aggregate could be found for a same-geography two-party comparison:
  - 2024 (Municipality of Anchorage, borough-level, from Wikipedia's sourced results table): Trump
    62,925 votes (47.35%), Harris 64,781 votes (48.74%) of 132,899 total votes cast in the borough.
    Two-party share: Trump 49.3%, Harris 50.7%.
    https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Alaska
  - 2016: the state's official 2016 general election summary report (elections.alaska.gov) publishes
    the presidential race only as a single statewide total (Trump 163,387/51.28%, Clinton
    116,454/36.55%) and breaks out only *down-ballot* legislative races by house district — it does not
    publish the presidential race by house district or by borough.
    https://www.elections.alaska.gov/results/16GENR/data/results.pdf
  - Wikipedia's 2016 Alaska presidential-election article has no borough/census-area results table
    (confirmed by inspecting all section headings — only two anecdotal "flipped" boroughs are named,
    with no vote totals).
    https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Alaska
  - Secondary attempts (uselectionatlas.org, rrhelections.com, politico.com, nytimes.com,
    web.archive.org mirrors) were either blocked (403) or unreachable from this environment.
  - The Anchorage Daily News's 2024 post-election analysis confirms only the qualitative trend
    ("reliably red" through 2016, Trump "beat Clinton by several points" in 2016, flipped to Biden in
    2020, Harris "more than a one-point lead" in 2024) without exact 2016 percentages — not usable as a
    quantitative source.
    https://www.adn.com/politics/2024/11/22/turnout-ballot-splitting-and-a-blue-anchorage-3-takeaways-from-alaskas-election-results/
- Per the skill's Quality Rules ("if a field cannot be sourced reliably, leave it blank and add it to
  the known gaps list") and the mandate to use the same geography/denominator for both years,
  `rep_vote_share_change_pp` and `dem_vote_share_change_pp` are left **blank** for Anchorage rather than
  computed from mismatched geographies or invented. This is a documented gap, not an oversight.
- `election_change` ("3% more Republican") and the pre-existing `election_2016`/`election_2024`/percent
  fields were already populated on this row before this patch and were not modified.

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

- `rep_vote_share_change_pp` / `dem_vote_share_change_pp` left blank — see Elections section above.
  Revisit if a reliable borough-level 2016 presidential aggregate becomes accessible (e.g., a
  precinct-to-borough crosswalk applied to the official 2016 precinct-level results file, which was not
  attempted in this pass due to the volume of manual precinct aggregation required).
- `city_politics`, `election_2016`, `election_2016_percent`, `election_2024`, `election_2024_percent`,
  and `election_change` were already populated on this row (legacy values, old label vocabulary e.g.
  `city_politics = "Center"`) and were intentionally left untouched — out of scope for this patch.
