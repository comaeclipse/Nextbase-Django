# Panama City, FL Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Tyndall AFB + Naval Support Activity Panama City / NSWC).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Bay County seat. Census Reporter ACS place 34,979; density ~986/sq mi (Hurricane Michael 2018 reduced population). 2020 Census 32,939. Source: https://censusreporter.org/profiles/16000US1254700-panama-city-fl/ |
| Coordinates | City centroid 30.2233, -85.5347 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 7.0% = 6% FL + 1% Bay County surtax. Source: https://floridarevenue.com/taxes/taxesfees/Pages/discretionary.aspx |
| Cost of living | CostOfLiving=97 from BEA RPP cache, Panama City-Panama City Beach MSA (37460) 2024 all-items 97.296. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $286,249, ~Jul 2026. Source: https://www.zillow.com/home-values/46978/panama-city-fl/ |
| VA access | Panama City Beach VA Clinic (CBOC, Gulf Coast Veterans HCS), ~10 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/gulf-coast-health-care/locations/panama-city-beach-va-clinic/ |
| Politics and elections | Bay County (county-level). 2016 Trump two-party 74.05%; 2024 Trump two-party 73.94%; rep -0.1 / dem +0.1. Sources: https://en.wikipedia.org/wiki/Bay_County,_Florida , https://enr.electionsfl.org/BAY/3729/Summary/ |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency FL0030100 (Panama City PD), 2024 annual violent rate 649.5/100k, / 359.1 * 100 = 181 -> "High". Property ~2,191/100k. Source: https://cde.ucr.cjis.gov/ (agency FL0030100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP Florida "Negative". CSV stores "Not Rated". Sources: https://reports.hrc.org/municipal-equality-index-2024 , https://mapresearch.org/equality-profiles/fl/ |
| Climate | NOAA 1991-2020 normals station USC00086842 (Panama City 5N): annual precip 61.27 in -> 61; Jan avg low 42.6 -> 43; Jul avg high 91.1 -> 91; snow 0. SunnyDays 237, summer humidity 75 (secondary). Source: NCEI normals API (USC00086842). |
| Gas | AAA Panama City metro regular ~$3.69, 2026-08-31. Source: https://gasprices.aaa.com/?state=FL |
| Amenities | Walmart Supercenter present (Y). No Costco in-city (nearest Panama City Beach status unverified). Sources: https://www.walmart.com/store/3075-panama-city-fl , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: NSA Panama City / NSWC in city limits; Tyndall AFB (325th Fighter Wing, F-35 rebuild) ~12 mi east. Derived defense_hub recomputed post-import. Sources: https://www.navsea.navy.mil/Home/Warfare-Centers/NSWC-Panama-City/ , https://www.tyndall.af.mil/ |
| Veterans benefits (state-owned, not imported) | FL no income tax; homestead + disabled-veteran exemptions (full homestead for 100% P&T). Source: https://floridavets.org/benefits-services/housing/ |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Panama City, FL".
