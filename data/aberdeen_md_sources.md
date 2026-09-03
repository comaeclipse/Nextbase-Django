# Aberdeen, MD Sources

Retrieved: 2026-09-03. Scope-A ranked-candidate package for issue #278. Aberdeen already exists in production as a non-candidate employer anchor (`slug=md-aberdeen`, `is_candidate=false`, `defense_hub=true`); this artifact promotes it after filling the sourced city fields.

| Field | Source and note |
| --- | --- |
| Identity, population, density | Harford County. Census Reporter ACS 2024 5-year: 17,298 residents, 7.0 sq mi land, 2,484.7 people/sq mi; CSV rounds density to 2,485. Source: https://censusreporter.org/profiles/16000US2400125-aberdeen-md/ |
| Coordinates | Gazetteer-derived point already used in `data/employer_geographies.csv` for `md-aberdeen`: 39.516403, -76.174518. |
| Politics and elections | Harford County returns. 2016 general election: Trump 77,860 (62.32% two-party, 62%), Clinton 47,077 (37.68% two-party, 38%). 2024 general election: Trump 83,050 (57.08% two-party, 57%), Harris 62,453 (42.92% two-party, 43%). Deltas: dem +5.24 pp / rep -5.24 pp (5.2 pp more Democratic). Sources: Maryland State Board of Elections and Wikipedia 2016/2024 Presidential Election in Maryland. |
| Cost of living | `CostOfLiving=104` from repo BEA RPP cache for Baltimore-Columbia-Towson, MD MSA (CBSA 12580), 2024 all-items RPP 104.487, rounded to 104. Standardized post-import by `scripts/sync-col-index-from-rpp.ts`. Source: `data/sources/rpp/MARPP_MSA_2008_2024.csv`. |
| Housing | Zillow ZHVI city typical home value $363,389, dated 2026-07-31 / September 2026. Source: https://www.zillow.com/home-values/10044/aberdeen-md/ |
| VA access | Perry Point VA Medical Center (VAMC, 6 miles across Susquehanna River). Regional access also at Baltimore VA Medical Center (~29 mi). Recomputed post-import by `scripts/sync-va-facilities.ts`. Source artifact: `data/va_facilities_sync_2026-09-02.md`; VA.gov facility directory. |
| Crime (TCI) | Aberdeen Police Department, FBI CDE ORI `MD0130100`. 2023 counts: 146 violent, 402 property, covered population 17,168 across 12 reported monthly periods. Indexed against FBI 2023 national reference (violent 363.8 / property 1,916.7 per 100k) via `scripts/compute-tci.ts`: violent index 234, property index 122, TCI 178, CrimeRating High. Sources: FBI Crime Data Explorer (`https://cde.ucr.cjis.gov/LATEST/summarized/agency/MD0130100/violent-crime?from=01-2023&to=12-2023`, `property-crime`). |
| LGBTQ | Not scored by HRC Municipal Equality Index (MEI). CSV records `Not Rated / No Local MEI Score Verified` and `Not Rated`. State policy: Movement Advancement Project (MAP) Maryland profile. Sources: https://www.hrc.org/resources/municipal-equality-index , https://www.mapresearch.org/equality_maps/profile_state/MD |
| Tech and defense context | `TechHub=Y` and `DefenseHub=Y`: anchors Aberdeen Proving Ground (APG), Army Futures Command, CECOM, DEVCOM, C5ISR campus, and major defense contractors including Collins Aerospace and Leidos. |
| Amenities | Walmart Supercenter present on S Philadelphia Blvd. No Costco warehouse in Aberdeen (closest is White Marsh). Sources: https://www.walmart.com/store/1968-aberdeen-md |
| Climate | NOAA NCEI 1991–2020 normals for Aberdeen / Phillips AAF / Upper Chesapeake: 18 in snow, 46 in rain, 208 sunny days, average winter low 26°F (January), average summer high 87°F (July), summer humidity 69%, Humid subtropical (Cfa). |
| Gas | AAA Baltimore metro average regular gas price was $3.976 ($3.98) on 2026-09-03. Source: https://gasprices.aaa.com/?state=MD |

Post-import: from merged `master`, run `scripts/import-csv.ts data/aberdeen_md.csv --dry-run`, then live import; `scripts/recompute-defense-hub.ts`, `scripts/import-bea-rpp.ts`, `scripts/sync-col-index-from-rpp.ts`, `scripts/sync-va-facilities.ts`, `scripts/sync-military-proximity.ts`, `scripts/classify-pace.ts --name "Aberdeen, MD"`, `city-profile-stack/scripts/tools/derive-structural-features.ts`, `scripts/verify-location-completeness.ts --name "Aberdeen, MD"`, `scripts/verify-csv-imports.ts`.
