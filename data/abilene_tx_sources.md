# Abilene, TX Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Dyess AFB — B-1B, C-130J).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Taylor County seat (city spans Taylor + a small Jones slice). Census Reporter ACS 2024 1-year 130,033; density ~1,219/sq mi. Source: https://censusreporter.org/profiles/16000US4801000-abilene-tx/ |
| Coordinates | City centroid 32.450, -99.750 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 8.25% = 6.25% TX + 2.0% local (TX cap). Source: https://www.salestaxhandbook.com/texas/rates/abilene |
| Cost of living | CostOfLiving=90 from BEA RPP cache, Abilene MSA (10180) 2024 all-items 90.364. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $199,958 (region 23394), ~Jun 2026. Source: https://www.zillow.com/home-values/23394/abilene-tx/ |
| VA access | Abilene VA Clinic (CBOC, West Texas VA HCS), in-city; nearest VAMC Big Spring ~90-100 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/west-texas-health-care/locations/abilene-va-clinic/ |
| Politics and elections | Taylor County (county-level). 2016 Trump two-party 76.75%; 2024 Trump two-party 75.18%; rep -1.6 / dem +1.6. Sources: https://www.texascounties.net/statistics/presidentialelection2016.htm , https://www.texascounties.net/statistics/presidentialelection2024.htm |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency TX2210100 (Abilene PD), 2024 = 553 violent offenses / covered pop 130,275 = 425/100k (annual rate 426.8/100k via CDE monthly), / 359.1 * 100 = 119 -> "Moderate". Property ~1,772/100k. Source: https://cde.ucr.cjis.gov/ (agency TX2210100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP Texas "Negative". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/texas , https://www.lgbtmap.org/equality-maps/profile_state/TX |
| Climate | NOAA 1991-2020 normals station USW00013962 (Abilene Regional): annual snow 6.00 -> 6; annual precip 26.54 -> 27; Jan low 33.7 -> 34; Jul high 96.4 -> 96. SunnyDays 243, summer humidity 50 (secondary). Source: NCEI normals API (USW00013962). |
| Gas | AAA Abilene metro regular ~$3.61, 2026-08-31. Source: https://gasprices.aaa.com/?state=TX |
| Amenities | Walmart Supercenters present (Y). No Costco. Sources: https://www.walmart.com/store-directory/tx/abilene , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Dyess AFB (7th Bomb Wing B-1B; 317th Airlift Wing C-130J), in city limits. Derived defense_hub recomputed post-import. Source: https://www.dyess.af.mil/ |
| Veterans benefits (state-owned, not imported) | TX no income tax; disabled-veteran homestead exemptions (total for 100%). Source: https://comptroller.texas.gov/taxes/property-tax/exemptions/ |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Abilene, TX".
