# Corpus Christi, TX Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Naval Air Station Corpus Christi + Corpus Christi Army Depot).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Nueces County seat. Census Reporter ACS 2024 1-year 317,314; density ~1,907/sq mi. Source: https://censusreporter.org/profiles/16000US4817000-corpus-christi-tx/ |
| Coordinates | City centroid 27.8006, -97.3964 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 8.25% = 6.25% TX + 2.0% local (TX cap). Source: https://www.salestaxhandbook.com/texas/rates/corpus-christi |
| Cost of living | CostOfLiving=93 from BEA RPP cache, Corpus Christi MSA (18580) 2024 all-items 92.671. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $218,988, ~mid-2026. Source: https://www.zillow.com/home-values/38025/corpus-christi-tx/ |
| VA access | Corpus Christi VA Clinic (CBOC, VA Texas Valley Coastal Bend HCS), in-city; nearest VAMC San Antonio ~140 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/texas-valley-health-care/locations/corpus-christi-va-clinic/ |
| Politics and elections | Nueces County (county-level; historically swing). 2016 Trump two-party 50.78%; 2024 Trump two-party 55.79%; rep +5.0 / dem -5.0. Source: https://en.wikipedia.org/wiki/Nueces_County,_Texas |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency TX1780200 (Corpus Christi PD), 2024 annual violent rate 874.4/100k, / 359.1 * 100 = 243 -> "High". Property ~3,048/100k. Source: https://cde.ucr.cjis.gov/ (agency TX1780200). |
| LGBTQ | HRC MEI 2025 = 53 (verified from the HRC 2025 scorecard PDF). State policy MAP Texas "Negative". Sources: HRC MEI 2025 Corpus Christi scorecard; https://www.mapresearch.org/equality-maps/profile_state/TX |
| Climate | NOAA 1991-2020 normals station USW00012924 (Corpus Christi Intl): annual precip 35.74 in -> 36; Jan avg low 48.0 -> 48; Jul avg high 93.7 -> 94; snow 0. SunnyDays 223, summer humidity 74 (secondary). Source: NCEI normals API (USW00012924). |
| Gas | AAA Corpus Christi metro regular ~$3.75, ~2026-08-20. Source: https://gasprices.aaa.com/?state=TX |
| Amenities | Walmart Supercenters present (Y). No Costco (nearest San Antonio). Sources: https://www.walmart.com/store-directory/tx/corpus-christi , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: NAS Corpus Christi (primary Navy flight training) + Corpus Christi Army Depot (largest DoD helicopter overhaul). Derived defense_hub recomputed post-import. Sources: https://www.cnrse.navy.mil/Installations/NAS-Corpus-Christi/ , https://home.army.mil/ccad/ |
| Veterans benefits (state-owned, not imported) | TX no income tax; disabled-veteran homestead exemptions (total for 100%). Source: https://comptroller.texas.gov/taxes/property-tax/exemptions/ |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Corpus Christi, TX".
