# Pascagoula, MS Sources

Retrieved: 2026-09-03. Scope-A ranked-candidate package for issue #278. Pascagoula already exists in production as a non-candidate employer anchor (`slug=ms-pascagoula`, `is_candidate=false`, `defense_hub=true`); this artifact promotes it after filling the sourced city fields.

| Field | Source and note |
| --- | --- |
| Identity, population, density | Jackson County. Census Reporter ACS 2024 5-year: 21,710 residents, 15.4 sq mi land, 1,411.9 people/sq mi; CSV rounds density to 1,412. Source: https://censusreporter.org/profiles/16000US2855360-pascagoula-ms/ |
| Coordinates | Gazetteer-derived point already used in `data/employer_geographies.csv` for `ms-pascagoula`: 30.360067, -88.556327. |
| Politics and elections | Jackson County returns. 2016 general election: Trump 33,629 (69.65% two-party, 70%), Clinton 14,657 (30.35% two-party, 30%). 2024 general election: Trump 36,376 (70.16% two-party, 70%), Harris 15,469 (29.84% two-party, 30%). Deltas: rep +0.52 pp / dem -0.52 pp (essentially unchanged). Sources: Mississippi Secretary of State and Wikipedia 2016/2024 Presidential Election in Mississippi. |
| Cost of living | `CostOfLiving=90` from repo BEA RPP cache for Gulfport-Biloxi, MS MSA (CBSA 25060), 2024 all-items RPP 90.006, rounded to 90. Standardized post-import by `scripts/sync-col-index-from-rpp.ts`. Source: `data/sources/rpp/MARPP_MSA_2008_2024.csv`. |
| Housing | Zillow ZHVI city typical home value $142,299, dated 2026-07-31. Source: https://www.zillow.com/pascagoula-ms/home-values/ |
| VA access | Biloxi VA Medical Center (VAMC, ~24 mi west; also Gulf Coast West VA Mobile Medical Unit). Recomputed post-import by `scripts/sync-va-facilities.ts`. Source artifact: `data/va_facilities_sync_2026-09-02.md`; VA.gov facility directory. |
| Crime (TCI) | Pascagoula Police Department, FBI CDE ORI `MS0300300`. 2023 counts: 48 violent, 888 property, covered population 21,492 across 12 reported monthly periods. Indexed against FBI 2023 national reference (violent 363.8 / property 1,916.7 per 100k) via `scripts/compute-tci.ts`: violent index 61, property index 216, TCI 138, CrimeRating Moderate. Sources: FBI Crime Data Explorer (`https://cde.ucr.cjis.gov/LATEST/summarized/agency/MS0300300/violent-crime?from=01-2023&to=12-2023`, `property-crime`). |
| LGBTQ | Not scored by HRC Municipal Equality Index (MEI). CSV records `Not Rated / No Local MEI Score Verified` and `Not Rated`. State policy: Movement Advancement Project (MAP) Mississippi profile. Sources: https://www.hrc.org/resources/municipal-equality-index , https://www.mapresearch.org/equality_maps/profile_state/MS |
| Tech and defense context | `TechHub=N` and `DefenseHub=Y`: major heavy naval shipbuilding center anchored by Huntington Ingalls Industries (HII) Ingalls Shipbuilding division, builder of U.S. Navy Arleigh Burke destroyers, San Antonio LPDs, and America-class amphibious assault ships. |
| Amenities | Walmart Supercenter present on Denny Ave. No Costco warehouse in Pascagoula (closest is Mobile, AL ~35 mi). Sources: https://www.walmart.com/store/1066-pascagoula-ms |
| Climate | NOAA NCEI 1991–2020 normals for coastal Mississippi: 0 in snow, 64 in rain, 219 sunny days, average winter low 42°F (January), average summer high 90°F (July), summer humidity 76%, Humid subtropical (Cfa). |
| Gas | AAA Biloxi-Gulfport-Pascagoula metro average regular gas price was $3.690 ($3.69) on 2026-09-03. Source: https://gasprices.aaa.com/?state=MS |

Post-import: from merged `master`, run `scripts/import-csv.ts data/pascagoula_ms.csv --dry-run`, then live import; `scripts/recompute-defense-hub.ts`, `scripts/import-bea-rpp.ts`, `scripts/sync-col-index-from-rpp.ts`, `scripts/sync-va-facilities.ts`, `scripts/sync-military-proximity.ts`, `scripts/classify-pace.ts --name "Pascagoula, MS"`, `city-profile-stack/scripts/tools/derive-structural-features.ts`, `scripts/verify-location-completeness.ts --name "Pascagoula, MS"`, `scripts/verify-csv-imports.ts`.
