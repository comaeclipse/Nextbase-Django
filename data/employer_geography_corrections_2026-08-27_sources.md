# Employer geography reconciliation — 2026-08-27

Scope: issue #157. This source package is phase 1; production application and verification follow after merge. Code prerequisites are merged PRs #159 and #160.

## Primary evidence and decisions

The saved `sources/employer-geography/corrections_2026-08-27.json` contains exact Census request URLs, retrieval times, and responses for each place, its centroid's county, and current CBSA point-in-polygon queries. We use TIGERweb's explicit CENTLAT/CENTLON, not a guessed street address. The three previously repaired coordinates are refined slightly to this consistent, directly sourced centroid convention; their correct counties are retained.

| Feed identity / preserved id | Census geography | County | Centroid latitude, longitude | Current CBSA |
|---|---|---|---|---|
| Bedford, MA / 270 | Bedford town, county subdivision 2501704615 | Middlesex | 42.4969409, -71.2782954 | 14460 Boston-Cambridge-Newton |
| Harrison Township, MI / 394 | Harrison charter township, subdivision 2609936820 | Macomb | 42.5880711, -82.8178312 | 19820 Detroit-Warren-Dearborn |
| Egg Harbor Township, NJ / 351 | Egg Harbor township, subdivision 3400120290 | Atlantic | 39.3786565, -74.6101758 | 12100 Atlantic City-Hammonton |
| Santa Isabel, PR / 200 | Santa Isabel zona urbana, place 7278145 | Santa Isabel Municipio | 17.9691494, -66.4050513 | **17620 Coamo Micro Area** |

Sources: [Census place/subdivision service](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer), [Census current CBSA service](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/CBSA/MapServer). Exact feature and spatial queries are preserved in the JSON evidence.

**Vintage correction:** the repository's pace-derived county crosswalk assigns Santa Isabel to 42180. The current Census CBSA polygon returns 17620 (Coamo). This package uses the current direct spatial result, not that stale derived crosswalk. It also rejects the original 10380 Isabela-area assignment. The legacy report is retained and explicitly labeled historical.

The feed names, slugs, ids, employer links, geo_type and candidate status remain unchanged. Santa Isabel's boundary GEOID denotes its zona urbana, not the entire municipio. Town/township GEOIDs above are ten-digit county-subdivision identifiers, not seven-digit Census place identifiers.

## Production snapshot and patch scope

At inspection, Santa Isabel, Harrison Township, and Egg Harbor Township had already received same-day coordinate/county changes, but their boundary_source was null. Bedford still pointed at Medford. The patch records these actual prior values, not the outdated issue table.

`employer_geography_corrections_2026-08-27.json` contains eleven explicit expected/replacement records. Four resolve/refine coordinates and provenance; seven assert the already-cleared cross-state records remain unresolved. The runner only updates county, latitude, longitude, boundary_geoid, boundary_source, and reviewed metro relationships. It preserves every location and employer id, posting count, manual flag and other researched field. Expected-state checks run inside a serializable transaction; an unexpected change aborts the batch. An already-applied batch is a no-op.

Existing Boston and Detroit relationships are retained. No current metro relation exists for Egg Harbor or Santa Isabel, and their correctly mapped CBSAs have no materialized shared-metro entity in this snapshot. The canonical metro CSV records their correct CBSA codes, but this correction does not create new metro containers outside the current candidate-plus-anchor policy. In particular, New York membership must not be restored for Egg Harbor.

Counts in the issue are not all vacancy counts: Bedford, Harrison Township, and Egg Harbor include `Onsite=1` attested-presence markers. Santa Isabel's Collins snapshot contains 10 onsite and 10 hybrid postings plus 29 remote postings; those counts and their dated provenance are untouched.

## Rejected and unresolved rows retained

The following ids retain their identity and linked employer records but have no asserted coordinates, county, boundary or metro membership:

- 324 Carson City, NV
- 367 Fort Johnson, LA
- 415 Kennedy Space Center, FL
- 421 Lake Suzy, FL
- 436 Marine Corps Base Kaneohe Bay, HI
- 455 Nimitz Hill, GU
- 502 Schriever Afb, CO

These were cleared in [PR #156](https://github.com/comaeclipse/Nextbase-Django/pull/156). This package does not guess replacement coordinates. Their canonical location/metro records carry `GeoResolutionStatus=unresolved` and a reason, with rejected geography blank. The updated importers skip them. The original twenty-one affected location/metro CSV records are retained in `sources/employer-geography/superseded_rows_2026-08-27.json`, and the original narrative report is preserved as historical evidence.

## Review-only installation dispositions

- **Eglin Air Force Base, FL / 352: retain, no automatic change.** A differently named Census subdivision is not evidence that the installation point is wrong. Eglin's reservation and cantonment geography covers a broad area; see the [Air Force environmental assessment](https://www.eglin.af.mil/Portals/56/documents/eglin_docs/Eglin%20Cantonment%20EA.pdf?ver=JRTjeoxn7z1ZCXA_VGSoVA%3D%3D). The selected employer point is not being certified as a particular building or facility address.
- **Fort Campbell, KY / 364: retain, no automatic change.** The installation spans Kentucky and Tennessee; a Tennessee county at a Kentucky-labeled installation point is not sufficient to invalidate it. See the [Army installation history](https://home.army.mil/campbell/units/history). No exact employer building location is asserted here.

These remain visible review findings; no broad classifier or distance threshold suppresses them.

## Apply and verify after merge

Run the reviewed patch with `scripts/apply-geography-patches.ts data/employer_geography_corrections_2026-08-27.json --dry-run`, inspect the expected state, and then apply from merged master. Do not replay the entire employer location CSV as a field-only repair.

Refresh VA and military proximity for ids `200,270,351,394` using `--ids`; run the scoped hub preview. Inspect coordinate-dependent satellite data and invalidate stale records where appropriate. Run `verify-geo-hierarchy.ts`, the report-only geography audit, and direct row/relationship/employer checks. Confirm no source replay can restore the rejected geography. Seven unresolved rows remain intentional gaps, not completed geography.
