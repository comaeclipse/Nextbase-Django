# Indian Trail, NC Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 38). Pre-patch scan showed `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, and `veterans_benefits` missing (`description` already had a
pre-existing value and was correctly excluded from this patch). `tci` is additionally left **blank**
in this patch — see below — so only `rep_vote_share_change_pp`, `dem_vote_share_change_pp`, `tags`,
and `veterans_benefits` were actually written, via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci — left blank, documented gap

- AreaVibes' Indian Trail crime page states the figures come from the FBI UCR program but also
  explicitly qualifies: "Indian Trail crime rates are not available from the FBI crime report" and the
  data shown is "estimated and not officially reported by any agency," because the town falls below the
  FBI's direct coverage threshold. https://www.areavibes.com/indian+trail-nc/crime/
- Per the skill's Quality Rules, `tci` is left NULL rather than computed from a self-disclaimed,
  non-FBI estimate — consistent with the pattern already established for other small
  towns/suburbs in this backfill (Malabar FL, Kuna ID).

## Elections (county: Union)

- Two-party math, Union County, NC:
  - 2016: Trump 66,707 (63.10% of all votes); Clinton 34,337 (32.48% of all votes). Two-party total
    101,044. Trump two-party share 66.02%, Clinton 33.98%.
  - 2024: Trump 86,271 (61.91% of all votes); Harris 51,168 (36.72% of all votes). Two-party total
    137,439. Trump two-party share 62.77%, Harris 37.23%.
  - `rep_vote_share_change_pp` = 62.77 − 66.02 = **-3.3**
  - `dem_vote_share_change_pp` = 37.23 − 33.98 = **+3.3**
  - Directionally consistent with the row's pre-existing `election_change` value of "1% less Republican"
    (legacy import, larger magnitude; left untouched).
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_North_Carolina
    (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_North_Carolina
    (section 10)

## tags

- Tags: `["Suburban", "Small Town", "Family Friendly"]`.
- Indian Trail is a rapidly growing Charlotte suburb (~10 miles southeast of the city) in Union County,
  population roughly 45,000, up from 1,942 in 1990; described as offering "a rural feel," with most
  residents owning homes and highly-rated public schools serving many families and young professionals.
  https://en.wikipedia.org/wiki/Indian_Trail,_North_Carolina

## veterans_benefits

- North Carolina fully exempts military retirement pay and Survivor Benefit Plan payments from state
  income tax, with no dollar cap, for retirees who served at least 20 years or were medically retired.
  https://militaryretirementcalc.com/states/north-carolina-military-retirement
- A veteran with a 100% permanent and total service-connected disability rating can exclude the first
  $45,000 of their home's assessed value from property taxes, with no income limit. (Note: NC Senate
  Bill 660 has proposed raising this to $75,000/$125,000/up to $500,000 or full value across 2025-2027,
  but was not confirmed as enacted law as of this research date, so the current $45,000 figure is the
  one recorded here.) https://usmilitary.org/veteran-benefits-state/north-carolina/

## Known limitations

- `tci` intentionally left blank — see dedicated section above.
- `description` was already populated pre-patch and correctly left untouched.
- `scripts/verify-location-completeness.ts` also flags this row as missing `lgbtq_mei_score` and
  `defense_hub_manual`/`defense_hub`, out of scope for issue #29 (belong to issue #26).

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **NULL (left unset — insufficient evidence either way)**

No installation or defense-contractor facility found in or near this Charlotte suburb. Left NULL as no evidence either way.

Sources:
- No qualifying source found; absence of evidence documented after searching DoD installation lists and Union County/Charlotte-region economic development pages.

## defense_hub_manual revision (issue #20, retrieved 2026-08-19)

Determination: NULL (revised research, still left unset). Indian Trail sits inside an unusually strong regional aerospace-manufacturing cluster: Union County officially describes precision/aerospace manufacturing as a core industry and calls itself the largest geographic aerospace cluster in North Carolina, reporting approximately $1.4 billion in aerospace investment since 2002 and more than 18,000 aerospace/aircraft-manufacturing jobs in the Charlotte-Union County region as of 2025. ATI Allvac is currently undertaking a $200 million aerospace-materials expansion in nearby Monroe, adding 70 jobs. However, this research did not establish a current military installation or a substantial defense-specific prime contractor physically in Indian Trail itself — the evidence is aerospace-manufacturing-cluster strength, not a defense-specific anchor. Per the repo's conservative standard, broad regional aerospace activity alone should not be converted into a defense_hub_manual = true without a military or defense-contractor anchor. This closes out research on all 10 of the original issue #20 "left NULL" cities: Indian Trail joins Bend, Bellevue, Odessa, and Pierre as a defensible researched-NULL, while Binghamton, Florence, Grand Junction, Warren, and North Platte were promoted to TRUE in this round.

No DB write was made for this revision; `defense_hub_manual` remains NULL, matching the 2026-08-11 determination above.

Sources:
- Union County, NC Economic Development — https://www.unioncountync.gov/Home/Components/News/News/2060/1509
- Economic Development Partnership of North Carolina, ATI Allvac Monroe expansion — https://edpnc.com/news/cir_pz/southwest/
