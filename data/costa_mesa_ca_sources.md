# Costa Mesa, CA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 14), already had population/housing/tax/climate/VA/election
winner fields populated. This patch backfills only: `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, `description`, `veterans_benefits`, via a single-row parameterized
SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

## Elections (county: Orange) — IMPORTANT discrepancy noted

- Two-party math, Orange County, CA:
  - 2016: Trump 507,148 (42.35% of all votes); Clinton 609,961 (50.94% of all votes). Two-party total
    1,117,109. Trump two-party share 45.40%, Clinton 54.60%.
  - 2024: Trump 654,815 (47.06% of all votes); Harris 691,731 (49.72% of all votes). Two-party total
    1,346,546. Trump two-party share 48.63%, Harris 51.37%.
  - `rep_vote_share_change_pp` = 48.63 − 45.40 = **+3.2**
  - `dem_vote_share_change_pp` = 51.37 − 54.60 = **-3.2**
  - This reflects Orange County's well-documented rightward trend from 2016 to 2024 in two-party terms
    (Harris still carried the county in 2024, but by a much narrower two-party margin than Clinton did
    in 2016).
  - Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
    section):
    - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_California
      (section 15)
    - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_California
      (section 13)
- **Discrepancy**: this row's pre-existing (legacy, unmodified) `election_change` field already read
  "8% more Democratic" — the **opposite direction** from the +3.2 pp Republican shift computed here by
  strict two-party county math. The legacy field's methodology/geography/vintage is undocumented (it
  may reflect a different comparison, such as city-level Costa Mesa returns rather than county returns,
  or a different pair of election years, or non-two-party percentages). Per the skill's explicit
  strict-two-party-math requirement and its instruction to leave low-confidence values undisturbed
  rather than reconcile them silently, `election_change` was **not** modified in this patch — only
  `rep_vote_share_change_pp` / `dem_vote_share_change_pp` were added, computed independently per the
  documented methodology above. This conflict should be flagged for follow-up (see Known limitations).

## tci (Safety and Social Policy)

- Costa Mesa 2024 violent crime rate: 738 per 100,000 (791 violent crimes), FBI UCR-derived (105.4%
  above the national average), per AreaVibes (data released by the FBI September 2025).
  https://www.areavibes.com/costa+mesa-ca/crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 738 / 359.1 * 100 = 205.5, stored as 206 (integer).

## tags / description

- Tags: `["Arts", "Culture", "Beaches", "Shopping"]` (all four already used elsewhere in this dataset's
  tag vocabulary).
- Arts/Culture: Costa Mesa is branded Orange County's "City of the Arts"; the Segerstrom Center for the
  Arts has hosted 13M+ visitors since 1986, and South Coast Plaza runs a public sculpture/art-walk tour.
  https://www.scfta.org/ , https://www.southcoastplaza.com/art-tour/
- Shopping: South Coast Plaza is a 250+ designer-retailer destination mall.
  https://www.visitcalifornia.com/places-to-visit/costa-mesa/
- Beaches: Costa Mesa is minutes from Orange County's Pacific beaches.
  https://www.visitcalifornia.com/places-to-visit/costa-mesa/
- Description written from the same facts above.

## veterans_benefits

- California excludes up to $20,000 of military retired pay from state income tax beginning tax year
  2025 (returns filed after Jan 1, 2026), for filers under $125,000 (single/HoH) or $250,000 (joint)
  income; VA disability compensation is untaxed. https://veteranlife.com/military-benefits/california-military-retirement-tax
- A veteran with a 100% VA service-connected disability rating (or 100% via individual unemployability)
  qualifies for California's Disabled Veterans' Property Tax Exemption: $180,671 off assessed value for
  the 2026 lien date, or $271,009 for low-income households (income under $81,131); a partial rating
  below 100% does not qualify. https://vareadyapp.com/states/california.html

## Known limitations

- Flagging the `election_change` direction conflict described above for a maintainer/future pass to
  investigate — it was left untouched in this patch since reconciling it is outside issue #29's scope
  (only the two new pp columns), but the discrepancy should not be silently ignored going forward.
- `scripts/verify-location-completeness.ts` also flags this row as missing `lgbtq_mei_score`. That
  field is out of scope for issue #29 (belongs to the broader issue #26 audit) and was not researched
  or populated here.
