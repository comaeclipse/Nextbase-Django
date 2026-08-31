# Alamogordo, NM Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Holloman AFB — 49th Wing, F-16 training, MQ-9).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Otero County seat. Census Reporter ACS 2024 5-year 31,307; density ~1,451/sq mi. 2020 Census 30,898. Source: https://censusreporter.org/profiles/16000US3501780-alamogordo-nm/ |
| Coordinates | City centroid 32.8995, -105.9603 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | NM Gross Receipts Tax combined ~8.19% for Alamogordo. Source: https://www.tax.newmexico.gov/businesses/gross-receipts-overview/ |
| Cost of living | CostOfLiving=86 from BEA state-nonmetro RPP (New Mexico nonmetro, matching the value assigned to Clovis in location_cost_rpp). Standardized post-import by import-bea-rpp.ts + sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $222,892, ~May 2026. Source: https://www.zillow.com/home-values/3340/alamogordo-nm/ |
| VA access | Alamogordo VA Clinic (CBOC, New Mexico VA HCS), in-city; nearest VAMC Albuquerque ~180 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/new-mexico-health-care/ |
| Politics and elections | Otero County (county-level). 2016 Trump two-party 65.99%; 2024 Trump two-party 63.79%; rep -2.2 / dem +2.2. Source: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_New_Mexico |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency NM0190100 (Alamogordo PD), 2024 annual violent rate 331.2/100k, / 359.1 * 100 = 92 -> "Moderate". Property ~2,844/100k. Source: https://cde.ucr.cjis.gov/ (agency NM0190100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP New Mexico "High". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/municipal-equality-index , https://www.lgbtmap.org/equality-maps/new_mexico |
| Climate | High-desert (Köppen BSk, ~4,300 ft): usclimatedata Jan low ~30, Jul high ~93, rain ~12 in, snow ~5 in (secondary; sources conflict, reconcile to NOAA at weather sync). SunnyDays 285, July humidity 40 (secondary). Source: https://usclimatedata.com/climate/alamogordo/new-mexico/united-states/usnm0002 |
| Gas | AAA NM statewide regular ~$4.01, 2026-08-31. Source: https://gasprices.aaa.com/?state=NM |
| Amenities | Walmart Supercenter present (Y). No Costco (nearest El Paso). Sources: https://www.walmart.com/store/finder?location=alamogordo%2C+nm , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Holloman AFB (49th Wing F-16 training, MQ-9, German Air Force training) ~7 mi SW. Derived defense_hub recomputed post-import. Source: https://www.holloman.af.mil/ |
| Veterans benefits (state-owned, not imported) | NM exempts up to $30,000 military retirement pay (NMSA 7-2-5.13; sunset removed 2024); 100% disabled-veteran property-tax waiver. Source: https://law.justia.com/codes/new-mexico/chapter-7/article-2/section-7-2-5-13-d-1 |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Alamogordo, NM".
