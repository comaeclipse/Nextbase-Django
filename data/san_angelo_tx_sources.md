# San Angelo, TX Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Goodfellow AFB — 17th Training Wing).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Tom Green County seat. Census Reporter ACS 2024 1-year 99,661; density ~1,659/sq mi. Source: https://censusreporter.org/profiles/16000US4864472-san-angelo-tx/ |
| Coordinates | City centroid 31.44, -100.45 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 8.25% = 6.25% TX + 0.5% county + 1.5% city (TX cap). Source: https://www.avalara.com/taxrates/en/state-rates/texas/cities/san-angelo.html |
| Cost of living | CostOfLiving=92 from BEA RPP cache, San Angelo MSA (41660) 2024 all-items 92.453. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $198,398, ~mid-2026. Source: https://www.zillow.com/home-values/54294/san-angelo-tx/ |
| VA access | Colonel Charles and JoAnne Powell VA Clinic (CBOC, West Texas VA HCS), in-city. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/west-texas-health-care/locations/ |
| Politics and elections | Tom Green County (county-level). 2016 Trump two-party 75.00%; 2024 Trump two-party 74.33%; rep -0.7 / dem +0.7. Sources: https://www.texascounties.net/statistics/presidentialelection2016.htm , https://www.texascounties.net/statistics/presidentialelection2024.htm |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency TX2260100 (San Angelo PD), 2024 annual violent rate 224.2/100k, / 359.1 * 100 = 62 -> "Low" (lowest in this batch). Property ~2,514/100k. Source: https://cde.ucr.cjis.gov/ (agency TX2260100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP Texas "Negative". CSV stores "Not Rated". Sources: https://reports.hrc.org/municipal-equality-index-2024 , https://www.lgbtmap.org/equality-maps/profile_state/TX |
| Climate | usclimatedata NOAA-based normals (KSJT Mathis Field): Jan low ~33, Jul high ~95, ~21 in rain, ~2 in snow. SunnyDays 250, summer humidity 50 (secondary). Source: https://usclimatedata.com/climate/san-angelo/texas/united-states/ustx1199 |
| Gas | AAA San Angelo metro regular ~$3.64, 2026-08-31. Source: https://gasprices.aaa.com/?state=TX |
| Amenities | Walmart Supercenters present (Y). No Costco. Sources: https://www.walmart.com/store-directory/tx/san%20angelo , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Goodfellow AFB (17th Training Wing, ISR + DoD firefighter training). Derived defense_hub recomputed post-import. Source: https://www.goodfellow.af.mil/ |
| Veterans benefits (state-owned, not imported) | TX no income tax; disabled-veteran homestead exemptions (total for 100%); Hazlewood tuition. Sources: https://comptroller.texas.gov/taxes/property-tax/exemptions/ , https://tvc.texas.gov/ |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "San Angelo, TX".
