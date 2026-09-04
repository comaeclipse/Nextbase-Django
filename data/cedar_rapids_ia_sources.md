# Cedar Rapids, IA Sources

Retrieved: 2026-09-03. Scope-A ranked-candidate package for issue #278. Cedar Rapids already exists in production as a non-candidate employer anchor (`slug=ia-cedar-rapids`, `is_candidate=false`, `defense_hub=true`); this artifact promotes it after filling the sourced city fields.

| Field | Source and note |
| --- | --- |
| Identity, population, density | Linn County. Census Reporter ACS 2024 1-year: 137,917 residents, 74.6 sq mi land, 1,847.9 people/sq mi; CSV rounds density to 1,848. Source: https://censusreporter.org/profiles/16000US1912000-cedar-rapids-ia/ |
| Coordinates | Gazetteer-derived point already used in `data/employer_geographies.csv` for `ia-cedar-rapids`: 41.964190, -91.679170. |
| Politics and elections | Linn County returns. 2016 general election: Clinton 58,935 (54.91% two-party, 55%), Trump 48,390 (45.09% two-party, 45%). 2024 general election: Harris 66,358 (55.03% two-party, 55%), Trump 54,237 (44.97% two-party, 45%). Deltas: dem +0.11 pp / rep -0.11 pp (essentially unchanged). Sources: Iowa Secretary of State, Linn County Auditor, and Wikipedia 2016/2024 Presidential Election in Iowa. |
| Cost of living | `CostOfLiving=89` from repo BEA RPP cache for Cedar Rapids, IA MSA (CBSA 16300), 2024 all-items RPP 88.963, rounded to 89. Standardized post-import by `scripts/sync-col-index-from-rpp.ts`. Source: `data/sources/rpp/MARPP_MSA_2008_2024.csv`. |
| Housing | Zillow ZHVI city typical home value $214,766, dated 2026-07-31. Source: https://www.zillow.com/home-values/40428/cedar-rapids-ia/ |
| VA access | Cedar Rapids VA Clinic (outpatient CBOC, 2 miles). Regional medical center access at Iowa City VA Health Care System (~25 mi south). Recomputed post-import by `scripts/sync-va-facilities.ts`. Source artifact: `data/va_facilities_sync_2026-09-02.md`; VA.gov facility directory. |
| Crime (TCI) | Cedar Rapids Police Department, FBI CDE ORI `IA0570100`. 2023 counts: 413 violent, 3,988 property, covered population 135,777 across 12 reported monthly periods. Indexed against FBI 2023 national reference (violent 363.8 / property 1,916.7 per 100k) via `scripts/compute-tci.ts`: violent index 84, property index 153, TCI 118, CrimeRating Moderate. Sources: FBI Crime Data Explorer (`https://cde.ucr.cjis.gov/LATEST/summarized/agency/IA0570100/violent-crime?from=01-2023&to=12-2023`, `property-crime`). |
| LGBTQ | Scored 100/100 on the Human Rights Campaign (HRC) Municipal Equality Index (MEI) 2024. State policy: Movement Advancement Project (MAP) Iowa profile. Sources: https://www.hrc.org/resources/municipal-equality-index , https://www.mapresearch.org/equality_maps/profile_state/IA |
| Tech and defense context | `TechHub=Y` and `DefenseHub=Y`: major aerospace electronics, communications, and avionics center anchored by Collins Aerospace (RTX) headquarters/campus and hundreds of defense openings. |
| Amenities | Walmart Supercenter present (#1528 / #2716). No Costco warehouse in Cedar Rapids (closest is Coralville ~22 mi south). Sources: https://www.walmart.com/store/1528-cedar-rapids-ia , https://www.costco.com/warehouse-locations/coralville-ia-1148.html |
| Climate | NOAA NCEI 1991–2020 normals for Eastern Iowa Airport (CID): 31 in snow, 36 in rain, 197 sunny days, average winter low 13°F (January), average summer high 84°F (July), summer humidity ~70%, Humid continental (Dfa). |
| Gas | AAA Cedar Rapids metro average regular gas price was $3.851 ($3.85) on 2026-09-03. Source: https://gasprices.aaa.com/?state=IA |

Post-import: from merged `master`, run `scripts/import-csv.ts data/cedar_rapids_ia.csv --dry-run`, then live import; `scripts/recompute-defense-hub.ts`, `scripts/import-bea-rpp.ts`, `scripts/sync-col-index-from-rpp.ts`, `scripts/sync-va-facilities.ts`, `scripts/sync-military-proximity.ts`, `scripts/classify-pace.ts --name "Cedar Rapids, IA"`, `city-profile-stack/scripts/tools/derive-structural-features.ts`, `scripts/verify-location-completeness.ts --name "Cedar Rapids, IA"`, `scripts/verify-csv-imports.ts`.

Apply result (2026-09-03): NOAA 1991–2020 monthly and hourly moisture normals both matched `USW00014990` at 5.9 miles. The source-backed pace classifier auto-approved `suburban`.
