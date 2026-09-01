# Clovis, NM Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Cannon AFB — 27th Special Operations Wing, AFSOC).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Curry County seat. 2020 Census place 38,567; density ~1,592/sq mi. ACS 2024 5-year ~37,942. Source: https://en.wikipedia.org/wiki/Clovis,_New_Mexico |
| Coordinates | City centroid 34.4047, -103.2053 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | NM Gross Receipts Tax combined ~7.9375% for Clovis. Source: https://www.tax.newmexico.gov/all-nm-taxes/current-historic-tax-rates-overview/gross-receipts-tax-rates/ |
| Cost of living | CostOfLiving=86 from BEA state-nonmetro RPP (already stored in location_cost_rpp as all_items_rpp 85.898 -> 86). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $178,144, ~2026. Source: https://www.zillow.com/home-values/30953/clovis-nm/ |
| VA access | Clovis VA Clinic (CBOC, Amarillo VA HCS), in-city; parent VAMC Amarillo ~100 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/amarillo-health-care/ |
| Politics and elections | Curry County (county-level). 2016 Trump two-party 74.33%; 2024 Trump two-party 71.70%; rep -2.6 / dem +2.6. Source: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_New_Mexico |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency NM0050100 (Clovis PD), 2024 annual violent rate 276.0/100k, / 359.1 * 100 = 77 -> "Moderate". Property ~1,632/100k. Source: https://cde.ucr.cjis.gov/ (agency NM0050100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP New Mexico "High". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/new-mexico , https://www.mapresearch.org/equality-maps/profile_state/NM |
| Climate | High plains (Köppen BSk, ~4,300 ft): usclimatedata Jan low ~25, Jul high ~91, rain ~18 in, snow ~10 in (secondary, reconcile to NOAA at weather sync). SunnyDays 265, July humidity 45 (secondary). Source: https://www.usclimatedata.com/climate/clovis/new-mexico/united-states/usnm0070 |
| Gas | AAA NM statewide regular ~$3.79, mid-Aug 2026. Source: https://gasprices.aaa.com/?state=NM |
| Amenities | Walmart Supercenter #821 (Y). No Costco (nearest Lubbock/Amarillo ~100 mi). Sources: https://www.walmart.com/store/821-clovis-nm , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Cannon AFB (27th Special Operations Wing, AFSOC) ~7 mi west. Derived defense_hub recomputed post-import. Source: https://www.cannon.af.mil/ |
| Veterans benefits (state-owned, not imported) | NM exempts up to $30,000 military retirement pay (NMSA 7-2-5.13; sunset removed 2024); 100% disabled-veteran property-tax waiver. Source: https://codes.findlaw.com/nm/chapter-7-taxation/nm-st-sect-7-2-5-13/ |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Clovis, NM".
