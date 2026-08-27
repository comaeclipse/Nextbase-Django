# Midland, Georgia — community within Columbus

Retrieved 2026-08-27 for issue #158. This is a non-candidate geography, not a researched retirement-city addition. Phase 1 is source artifacts and dry-run; production import follows only from merged master. Code prerequisite: PR #160, including its population-reason migration.

## Identity and geographic evidence

- **USGS GNIS feature 318098:** Midland, Populated Place, GA, Muscogee County. The National Map service returned -84.82715626894138, 32.57486696455997; CSV rounds to six decimal places. [Exact GNIS query](https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/3/query?where=gaz_id%3D318098&outFields=gaz_id%2Cgaz_name%2Cgaz_featureclass%2Cstate_alpha%2Ccounty_name&returnGeometry=true&outSR=4326&f=json).
- **Census point-in-polygon:** the GNIS reference point falls in Columbus city, GEOID 1319000, and Muscogee County, 13215. [Exact Census query](https://geocoding.geo.census.gov/geocoder/geographies/coordinates?benchmark=Public_AR_Current&vintage=Current_Current&format=json&x=-84.827156&y=32.574867).
- **No Census Midland place:** current TIGERweb Incorporated Places and Census Designated Places queries for `STATE='13' AND BASENAME LIKE 'Midland%'` both return zero features.
- **Current CBSA:** the reference point intersects 17980, Columbus, GA-AL Metro Area, in the Census CBSA polygon layer. This agrees with the existing Columbus metro entity.

All five request URLs, retrieval timestamps and complete JSON responses are saved in `sources/employer-geography/midland_ga_2026-08-27.json`. GNIS describes a named point, not a legal boundary; point containment does not prove the complete extent of every informal use of “Midland.” The hierarchy records this sourced community reference point within Columbus and makes no claim about a Harris County extension.

## CSV policy

The row uses `GeoType=neighborhood`, `IsCandidate=No`, and `ParentSlug=ga-columbus`, yielding **ga-columbus-midland**. Existing Columbus is id 126. ParentSource records the containment evidence. The importer must create both parent_geo_id and the municipal_containment relationship atomically.

Population, PopulationSource, PopulationVintage, BoundaryGeoid, density and housing are blank. `PopulationUnavailableReason` explains that no defensible population boundary is available. ZCTA 31820 is a mailing-area proxy and is deliberately not used. `BoundarySource` describes the GNIS point explicitly; 318098 is not a Census GEOID and is not put into BoundaryGeoid.

No VA distance, local election result, crime rating, tax estimate or climate value is written. VA and base proximity are recomputed from Midland's own point. Wider-jurisdiction elections/crime remain labeled context through the inheritance registry. This addition must not appear in ranked candidate lists or map output.

## Employer attribution and limits

The live employer table at research time contains Pratt & Whitney row 191, `city=Midland`, `state=GA`, `location_id=NULL`, 54 onsite and zero hybrid postings, dated 2026-08-25. [RTX careers source](https://careers.rtx.com/global/en/search-results). This is the stored dated snapshot, not a claim that 54 openings remain available indefinitely.

The enabled location AFTER INSERT trigger links previously unlinked exact city/state matches. Verify that it links row 191 to the new child. The municipal containment closure then rolls the count up to Columbus, with the originating neighborhood named. Do not directly assign the same count to Columbus or copy it onto either of its two existing plant records.

The [Georgia announcement](https://gov.georgia.gov/press-releases/2026-02-24/rtxs-pratt-whitney-announces-new-200m-columbus-expansion-cuts-ribbon) supports Pratt & Whitney's Columbus operation and expansion. The exact association of all Midland postings with either Columbus Engine Center or Columbus Forge remains an inference; no building-level attribution is added by this CSV.

## Post-merge verification

1. From merged master, run the population-reason migration, then the CSV dry-run and import. No `--allow-incomplete` bypass.
2. Verify ga-columbus-midland is non-candidate, has own coordinates and a documented unavailable population, and has both a parent pointer and active municipal_containment edge to Columbus.
3. Verify employer linkage and the current snapshot count; run scoped VA, military and hub updates for the new child, including Columbus in the hub preview. Columbus remains true; the child is promoted by actual employer presence.
4. Run hierarchy and row-completeness checks, and confirm pace is sourced or explicitly pending rather than guessed.
5. Verify a fresh Columbus page displays the local roll-up once with “incl. Midland,” with no duplicate under “Elsewhere in the metro.” Verify candidate/map exclusion.

No explicit metro edge is necessary for Columbus's local employer roll-up: municipal containment is the controlling relationship. The verified 17980 mapping is retained in this source record for a future scoped metro refresh.
