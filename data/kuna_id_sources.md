# Kuna, ID Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 23). Pre-patch scan showed `tci`, `rep_vote_share_change_pp`,
`dem_vote_share_change_pp`, `tags`, and `veterans_benefits` missing (`description` already had a
pre-existing value and was correctly excluded from this patch). `tci` is additionally left **blank**
in this patch — see below — so only `rep_vote_share_change_pp`, `dem_vote_share_change_pp`, `tags`,
and `veterans_benefits` were actually written, via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, safety-checked). No other column
touched.

## tci — left blank, documented gap

- AreaVibes' Kuna crime page explicitly states "Kuna crime rates are not available from the FBI crime
  report" and that its 193/100k figure is a non-FBI demographic estimate ("estimated and not officially
  reported by any agency"). https://www.areavibes.com/kuna-id/crime/
- A separate search surfaced a different, unsourced "80 per 100,000" figure for Kuna with no clear
  citation trail — internally inconsistent with the AreaVibes figure and not independently verifiable.
- Ada County's other curated city in this dataset, Boise, has its own directly-reported FBI figure (see
  `data/boise_id_sources.md`), but reusing Boise's county-wide or city rate for Kuna would misrepresent
  a small, fast-growing bedroom suburb as having Boise's urban crime profile — not a valid substitute.
- Per the skill's Quality Rules, `tci` is left NULL for this row rather than computed from an
  unreliable, self-disclaimed estimate or a mismatched-geography substitute.

## Elections (county: Ada) — large discrepancy noted

- Kuna is in Ada County, same as Boise; see `data/boise_id_sources.md` for the full county-level
  two-party vote math (2016 vs 2024) and sources — reused verbatim here since it's the same county.
  - `rep_vote_share_change_pp` = **0.0** (essentially unchanged, rounds to zero)
  - `dem_vote_share_change_pp` = **0.0**
  - This is a large discrepancy from the row's pre-existing `election_change` ("6% more Republican" —
    identical text to Boise's, consistent with both rows sharing the same county-level legacy import).
    Flagged, not reconciled, same as Boise.

## tags

- Tags: `["Suburban", "Small Town", "Family Friendly"]`.
- Kuna is 19 miles southwest of Boise within the Boise MSA; grew from 6,436 residents (2000) to an
  estimated 32,665 (2026), a bedroom-community transition from its farm-town origins, with new
  subdivisions and master-planned communities described as appealing "to families and first-time
  buyers." https://www.ktvb.com/article/news/local/growing-idaho/kuna-population-explosion-mayor-joe-stear-growth-schools-fire-services/277-096af5b1-6b53-4125-946d-d65a4027f071

## veterans_benefits

- Same statewide Idaho benefit summary as Boise, ID (see `data/boise_id_sources.md` for full
  citations): Retirement Benefits Deduction for qualifying (disabled/62+/sufficient-earned-income)
  retired service members, annually recalculated cap (~$40,536 per a third-party estimate); $1,500/year
  property tax reduction for 100% SC-disabled or IU-rated veterans, smaller county-varying reduction for
  10%+ ratings, apply Jan 1 - Apr 15 with the county assessor.

## Known limitations

- `tci` intentionally left blank — see dedicated section above.
- `scripts/verify-location-completeness.ts` also flags this row as missing `lgbtq_mei_score`, out of
  scope for issue #29 (belongs to issue #26).
