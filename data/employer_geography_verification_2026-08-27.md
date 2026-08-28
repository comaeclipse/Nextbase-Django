# Employer geography rollout verification — 2026-08-27

Issues #157 and #158; prevention PR #159. Code prerequisites #160 and #164;
reviewed data packages #161 and #162. Every production write used a detached
checkout of merged origin/master. The primary checkout's unrelated work was not
modified. See `sources/employer-geography/verification_2026-08-27.json` for
merged-commit/artifact hashes, row evidence and non-target snapshot hashes.

## Applied

- Four anchors now have sourced Census centroid and boundary provenance:
  Santa Isabel #200, Bedford #270, Egg Harbor Township #351 and Harrison Township #394.
  Their identities, employer counts and manual/researched fields remain unchanged.
- Existing Boston and Detroit memberships remain; Egg Harbor has no New York edge.
  Seven rejected cross-state anchors retain null geography and their employer links.
  Canonical CSVs cannot replay those rejected points or metro mappings.
- Added nullable population_unavailable_reason, then imported Midland #617 as
  ga-columbus-midland, a non-candidate neighborhood under Columbus #126.
  Parent pointer and active municipal containment edge agree.
- Employer row #191 linked automatically to Midland. Its stored 2026-08-25 snapshot
  remains 54 onsite / zero hybrid; no counts were copied onto Columbus plant records.
- VA refresh wrote only the four corrected ids and Midland. Military refresh wrote
  181 pairs for each, 905 total. The hub refresh changed only Midland null → true;
  Columbus's existing true/manual-true state is unchanged.

## Verification

- Full before/after snapshots match for all non-target location fields/rows,
  employer records except Midland's expected link/timestamp, existing relationships,
  and non-target military rows. The four targets changed only reviewed geography,
  provenance, VA fields and update timestamps.
- The actual application SQL returns Columbus Pratt & Whitney 54 once, with a
  single rolled_up_from entry for Midland. Midland is absent from Columbus's
  elsewhere-in-metro result. The two existing Columbus plant records are untouched.
- All ten hierarchy checks pass. Targeted Census audit: seven checked, zero unchecked,
  no cross-state suspects. Only Eglin, Fort Campbell and Midland remain review findings;
  Midland resolves to its sourced containing city Columbus, as expected. The two
  installation dispositions are retained in the correction sources, not auto-cleared.
- Live browser: Bedford shows Middlesex and its 1-mile VA hospital; Egg Harbor shows
  Atlantic with no New York metro employment. After one stale cache response,
  Columbus shows “54 openings · incl. Midland”; elsewhere lists Fort Benning only.
- Live map renders 165 curated markers and no Midland marker. Georgia API returns
  five candidates including Columbus and excludes #617.
- Latest code: 303 unit tests pass, typecheck and production webpack build pass,
  lint zero errors and four pre-existing warnings. Scoped transaction/cleanup tests
  ran in isolated PGlite; an additional test exercised the actual importer and CSV
  against all 75 copied production column definitions.

## Explicit limits and pending data

**Midland's pace is still needs_review / geography_unresolved.** The completeness
verifier reports only pace_category missing. The existing pace resolver uses a
place gazetteer/name lookup and cannot resolve this GNIS community; it does not use
Midland's verified own point. No guessed classification, population, density, housing
or local political/crime data was added. The geography/linking task is verified;
Midland is not a fully researched candidate or complete lifestyle profile.

Seven rejected geography rows remain unresolved. The installation review decisions
are not building-level employer certifications. The military distance inventory is
not a claim of exhaustive local installation coverage, especially in Puerto Rico.
Posting counts are the stored dated snapshot, not a fresh claim of live vacancies;
other employers' presence markers must not be described as measured vacancies.

## Execution correction

The first Midland import failed before SQL execution because #160's identifier
validator rejected election_2016-style names. No child or employer link was written.
PR #164 accepts digits after the first identifier character and constructs the exact
SQL in dry-run too. It passed regression and actual-import isolated tests, merged,
and the successful production retry ran from master commit 5dceaea.

Rollback must restore only scoped captured fields/relationships and recompute their
derived distances. Do not delete employer postings or restore a whole DB snapshot.
Local full prior snapshots remain under the execution worktree's backups/ directory.
