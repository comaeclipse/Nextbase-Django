# Pensacola, FL Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 18). The patch as applied wrote `tci`,
`rep_vote_share_change_pp`, `dem_vote_share_change_pp`, `tags`, `description`, and
`veterans_benefits`. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed). No other column touched.

**Correction (added after the fact, 2026-08-08):** the original pre-import scan for Pensacola listed
only `tci, rep_vote_share_change_pp, dem_vote_share_change_pp, tags` as missing — `description` and
`veterans_benefits` **already had pre-existing values** on this row. The patch script did not check
per-field existing values before writing at the time this ran (that safety check was added to
`scripts/_apply_cohort_a_patch.cjs` immediately after this was discovered, on the same city that
triggered noticing it — see Mobile, AL's sources.md for the first instance), so this row's
pre-existing `description` and `veterans_benefits` were overwritten by the text below without being
read or preserved first. The original text is not recoverable (no git history for DB content). The
replacement text is itself sourced and factual (see below), so the fields are not broken, but this was
a process error, not an intentional edit — flagged here and in the issue #29 progress comment for
visibility.

## tci (Safety and Social Policy)

- Pensacola crime-rate sources were inconsistent across secondary aggregators (46.7, 130.6, 231, and a
  clearly garbled ~522 figure all appeared across different pages/queries for nominally the same city).
  The most internally consistent and explicitly FBI-UCR-cited figure — cross-validated against its own
  raw crime count — is HomeSnacks' Pensacola page: **70 violent crimes in 2024**, population base
  implying a rate of **130.6 per 100,000**, explicitly labeled "FBI Uniform Crime Reporting (2024)" and
  internally consistent with its own stated "63.61% decrease vs. the national average of 359.0 per
  100,000" (130.6 / 359.0 ≈ 36.4%, i.e. 63.6% below — the arithmetic checks out, unlike the other
  sources checked). https://www.homesnacks.com/fl/pensacola-crime/
  - AreaVibes' Pensacola page (231/100k) was explicitly self-disclaimed as a non-FBI demographic
    estimate ("Pensacola crime rates are not available from the FBI crime report... estimated and not
    officially reported by any agency") and was rejected as a source for that reason.
    https://www.areavibes.com/pensacola-fl/crime/
  - crimeexplorer.com's 46.7/100k figure was a 2019-2023 five-year aggregate, not a 2024 single-year
    figure, and was rejected for vintage mismatch with the rest of this backfill.
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill; HomeSnacks' cited
  "359.0" national comparator is consistent with this to within rounding).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 130.6 / 359.1 * 100 = 36.4, stored as 36 (integer).

## Elections (county: Escambia)

- Two-party math, Escambia County, FL:
  - 2016: Trump 88,808 (57.60% of all votes); Clinton 57,461 (37.27% of all votes). Two-party total
    146,269. Trump two-party share 60.72%, Clinton 39.28%.
  - 2024: Trump 96,407 (59.23% of all votes); Harris 64,601 (39.69% of all votes). Two-party total
    161,008. Trump two-party share 59.88%, Harris 40.12%.
  - `rep_vote_share_change_pp` = 59.88 − 60.72 = **-0.8**
  - `dem_vote_share_change_pp` = 40.12 − 39.28 = **+0.8**
  - Net: essentially unchanged, very slightly more Democratic by strict two-party math. The row's
    pre-existing `election_change` ("1% more Republican") points the opposite direction at a similarly
    small magnitude — flagged for transparency (same pattern as Costa Mesa/Bridgeport, smaller scale),
    `election_change` left untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Florida
    (section 15)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Florida
    (section 13)

## tags / description

- Tags: `["Military", "Beaches", "History"]`.
- Military: Naval Air Station Pensacola, the "Cradle of Naval Aviation" and home of the Blue Angels
  flight demonstration team, hosts the National Naval Aviation Museum (150+ restored aircraft).
  https://www.visitpensacola.com/directory/national-naval-aviation-museum/
- Beaches: Pensacola Beach on the Santa Rosa barrier island fronts the Gulf of Mexico with white-sand
  shoreline. https://www.gulfshores.com/things-to-do/national-naval-aviation-museum/
- History: Pensacola's historic naval-aviation identity and downtown historic districts support the
  "History" tag alongside the museum fact above.
- Description written from the same facts.

## veterans_benefits

- Same statewide Florida benefit summary as Malabar, FL (see `data/malabar_fl_sources.md` for full
  citations): no state income tax (military retirement/VA disability entirely untaxed); 100% P&T
  disabled veterans get a full homestead exemption; partial ratings get a $5,000 reduction or an
  age-65+ percentage discount matching rating; deployed servicemembers get a pro-rated exemption. Apply
  by March 1.

## Known limitations

None of the six issue #29 target fields for this row were left blank — all were sourced and populated,
though `tci` required rejecting three lower-quality/inconsistent secondary sources before settling on a
fourth (see tci section above for the full trail). See the Correction note above re: `description` and
`veterans_benefits` being unintentionally overwritten. `scripts/verify-location-completeness.ts` also
flags this row as missing `lgbtq_mei_score`, out of scope for issue #29 (belongs to issue #26).
