# Jackson, MS Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 35). Pre-patch scan showed all six target fields missing.
This patch backfills five of the six: `rep_vote_share_change_pp`, `dem_vote_share_change_pp`, `tags`,
`description`, `veterans_benefits`. `tci` is deliberately left **blank** — see below. Applied via a
single-row parameterized SQL UPDATE (`scripts/_apply_cohort_a_patch.cjs`, transient/not committed,
permanent safety check). No other column touched.

## tci — left blank, documented gap

- AreaVibes' Jackson crime page explicitly states "Jackson crime rates are not available from the FBI
  crime report" and that its 295/100k figure is a non-FBI demographic estimate ("estimated and not
  officially reported by any agency"). https://www.areavibes.com/jackson-ms/crime/
- Other search-aggregated sources for Jackson returned wildly inconsistent figures across separate
  queries: 969.7/100k, a "158.6/100k, 49.3% above national average" figure whose own internal math
  doesn't check out against any plausible national baseline, and a HomeSnacks page that displayed
  "0.0/100k" as its headline number while its own detail table listed 1,181 raw violent crimes (72
  murders, 400 robberies, 709 aggravated assaults) — an internal contradiction on that page.
  https://www.homesnacks.com/ms/jackson/
- None of these sources is a clean, internally-consistent, explicitly-FBI-sourced single-year figure.
  Jackson's police department is known to have had gaps in UCR/NIBRS reporting to the FBI in recent
  years, which is consistent with AreaVibes' explicit disclaimer. Per the skill's Quality Rules, `tci`
  is left NULL rather than computed from an unreliable or self-contradictory source.

## Elections (county: Hinds)

- Two-party math, Hinds County, MS:
  - 2016: Trump 25,275 (26.69% of all votes); Clinton 67,594 (71.39% of all votes). Two-party total
    92,869. Trump two-party share 27.21%, Clinton 72.79%.
  - 2024: Trump 22,816 (26.28% of all votes); Harris 62,840 (72.37% of all votes). Two-party total
    85,656. Trump two-party share 26.64%, Harris 73.36%.
  - `rep_vote_share_change_pp` = 26.64 − 27.21 = **-0.6**
  - `dem_vote_share_change_pp` = 73.36 − 72.79 = **+0.6**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "1% less
    Democratic." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Mississippi
    (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Mississippi
    (section 10)

## tags / description

- Tags: `["Arts", "Culture", "Music"]`.
- Arts/Culture: the Mississippi Museum of Art holds the state's largest art collection (4,000+ works)
  and a 1.2-acre Art Garden; it has also acquired Frank Lloyd Wright's Fountainhead home in the Fondren
  neighborhood. https://visitmississippi.org/things-to-do/art-museums/
- Music/Culture: the Fondren District is a walkable arts/entertainment hub with independent galleries,
  restaurants, and the monthly "Fondren After 5" live-music/shopping event.
  https://www.visitjackson.com/blog/artful-itinerary/
- Description written from the same facts above.

## veterans_benefits

- Mississippi exempts military retired pay (active duty, reserve, National Guard) from state income
  tax; VA disability pension/compensation is also untaxed.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Mississippi
- Mississippi residents 65+ or disabled get an exemption on the first $7,500 of property taxes;
  honorably discharged totally disabled veterans, honorably discharged veterans age 90+, and surviving
  unremarried spouses of service members who died on active duty get a full exemption from all state
  property taxes. https://vadisabilitygroup.com/mississippi-state-benefits-for-100-disabled-veterans/

## Known limitations

- `tci` intentionally left blank — see dedicated section above.
