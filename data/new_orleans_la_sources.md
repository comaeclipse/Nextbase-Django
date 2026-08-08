# New Orleans, LA Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 28); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- New Orleans 2024 violent crime rate: 1,361.1 per 100,000 (4,957 violent crimes), explicitly FBI
  UCR-sourced (279.13% above the national average), per HomeSnacks.
  https://www.homesnacks.com/la/new-orleans-crime/
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 1361.1 / 359.1 * 100 = 379.0, stored as 379 (integer). This is a materially high TCI value,
  flagged here for visibility (similar to Little Rock, AR earlier in this backfill).

## Elections (parish: Orleans)

- Louisiana uses parishes rather than counties; the row's existing `county` field ("Orleans") maps
  directly to Orleans Parish, so parish-level presidential returns were used.
- Two-party math, Orleans Parish, LA:
  - 2016: Trump 24,292 (14.65% of all votes); Clinton 133,996 (80.81% of all votes). Two-party total
    158,288. Trump two-party share 15.35%, Clinton 84.65%.
  - 2024: Trump 24,119 (15.16% of all votes); Harris 130,749 (82.16% of all votes). Two-party total
    154,868. Trump two-party share 15.57%, Harris 84.43%.
  - `rep_vote_share_change_pp` = 15.57 − 15.35 = **+0.2**
  - `dem_vote_share_change_pp` = 84.43 − 84.65 = **-0.2**
  - Net: essentially unchanged, very slightly more Republican. The row's pre-existing `election_change`
    ("1% more Democratic") points the opposite direction at a similarly tiny magnitude — flagged, not
    reconciled (same pattern as Malabar/Pensacola earlier).
- Sources (Wikipedia "By parish" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Louisiana
    (section 9)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Louisiana
    (section 9)

## tags / description

- Tags: `["Music", "Culture", "History"]`.
- Music: Preservation Hall and Frenchmen Street (Marigny neighborhood) anchor New Orleans' traditional
  jazz scene. https://www.neworleans.com/things-to-do/music/
- Culture/History: the French Quarter's Jackson Square, St. Louis Cathedral, and the Louisiana State
  Museums' Cabildo (where the Louisiana Purchase was signed) and Presbytere (exhibits on Mardi Gras and
  Hurricane Katrina). https://www.explorelouisiana.com/areas/french-quarter-area
- Description written from the same facts above.

## veterans_benefits

- Louisiana does not tax military retirement pay; active-duty service members stationed outside
  Louisiana for 120+ consecutive days may exempt up to $50,000 of military pay.
  https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Louisiana
- Veterans with a 50-69% service-connected disability rating get an additional property tax exemption
  on the next $2,500 of assessed valuation (beyond the base homestead exemption); 70-99% get the next
  $4,500; a 100% rating is exempt from all ad valorem property taxation.
  https://vetaffairs.la.gov/benefits/state

## Known limitations

None — all six target fields for this row were sourced and populated.
