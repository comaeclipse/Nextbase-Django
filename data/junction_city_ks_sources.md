# Junction City, KS Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Fort Riley — 1st Infantry Division).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Geary County seat, adjoins Fort Riley. Population 22,331 (ACS 2024 5-year; 2020 Census 22,932); density ~1,934/sq mi. Source: https://censusreporter.org/profiles/16000US2035750-junction-city-ks/ |
| Coordinates | City centroid 39.0286, -96.8314 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 9.75% = 6.5% KS + 1.25% Geary County + 2.0% city (some CID/TDD parcels higher). Source: https://www.avalara.com/taxrates/en/state-rates/kansas/cities/junction-city.html |
| Cost of living | CostOfLiving=90 from BEA RPP cache, Manhattan, KS MSA (31740, includes Geary County) 2024 all-items 90.162. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI ~$233,813 (Zillow page 403'd; from search-index snapshot; cross-refs NeighborhoodScout $203k, Redfin median sale $189k). Verify exact ZHVI at import. Source: https://www.zillow.com/fort-riley-junction-city-ks/home-values/ |
| VA access | Lt. Gen. Richard J. Seitz VA Clinic (CBOC, VA Eastern Kansas HCS), in-city (~1 mi); nearest VAMC Colmery-O'Neil (Topeka) ~65 mi. (Irwin Army Community Hospital at Fort Riley is DoD/TRICARE, not VA.) Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/eastern-kansas-health-care/locations/lieutenant-general-richard-j-seitz-community-based-outpatient-clinic/ |
| Politics and elections | Geary County (county proxy; city is ~22k of ~35k county). 2016 Trump two-party 61.09%; 2024 Trump two-party 59.00%; rep -2.1 / dem +2.1 (third-party collapse). Source: https://en.wikipedia.org/wiki/Geary_County,_Kansas |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency KS0310100 (Junction City PD), 2024 annual violent rate 776.6/100k, / 359.1 * 100 = 216 -> "High". Source: https://cde.ucr.cjis.gov/ (agency KS0310100). |
| LGBTQ | Not HRC MEI-scored (9 KS cities scored, Junction City not among them). State policy MAP Kansas "Low". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/kansas , https://www.lgbtmap.org/equality-maps/profile_state/KS |
| Climate | Humid continental (Koppen Dfa). Snow ~17; precip ~34; Jan avg low ~19; Jul avg high ~91. Climate values are secondary station estimates (en.climate-data.org); SunnyDays 225 and summer humidity ~69 are secondary. Verify vs NCEI normals at weather sync. Source: https://en.climate-data.org/north-america/united-states-of-america/kansas/junction-city-17024/ |
| Gas | AAA KS statewide regular ~$3.80, 2026-08-31. Source: https://gasprices.aaa.com/?state=KS |
| Amenities | Walmart Supercenter #43 + Neighborhood Market #4626 (Y). No Costco (nearest Overland Park/Wichita ~120 mi). Sources: https://www.walmart.com/store/43-junction-city-ks , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: adjoins Fort Riley (1st Infantry Division). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | KS fully exempts military retirement pay; Kansas Homestead property-tax refund for disabled veterans; KS no longer taxes Social Security. Source: https://www.ksrevenue.gov |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Junction City, KS".
