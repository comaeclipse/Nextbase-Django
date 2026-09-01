# Del Rio, TX Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Laughlin AFB — 47th Flying Training Wing, the Air Force's largest pilot-training wing).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Val Verde County seat; twin city with Ciudad Acuna, Mexico. 2020 Census place 34,673; density ~1,750/sq mi. Source: https://en.wikipedia.org/wiki/Del_Rio,_Texas |
| Coordinates | City centroid 29.3708, -100.8800 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 8.25% = 6.25% TX + 0.5% county + 1.5% city (TX cap). Source: https://www.avalara.com/taxrates/en/state-rates/texas/cities/del-rio.html |
| Cost of living | CostOfLiving=88 from BEA RPP cache, Texas nonmetropolitan portion (48999) 2024 all-items 87.835 (Del Rio is a micropolitan area, not a BEA MSA). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $209,607, ~2026 (down ~0.7% YoY). Source: https://zillow.com/del-rio-tx/home-values |
| VA access | Del Rio VA Clinic (CBOC, VA South Texas Veterans Health Care System), in-city; nearest VAMC Audie L. Murphy (San Antonio) ~145 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/south-texas-health-care/locations/ |
| Politics and elections | Val Verde County (county proxy; Del Rio is the great majority of the county). 2016 Clinton two-party 54.16%; 2024 Trump two-party 63.43% (official Val Verde canvass Trump 9,162 / Harris 5,282); rep +17.6 / dem -17.6. Flipped D->R. Sources: https://www.texascounties.net/statistics/presidentialelection2016.htm , https://valverdecounty.texas.gov/DocumentCenter/View/8424/General-Election-2024-Official-Election-Results |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency TX2330100 (Del Rio PD), 2024 annual violent rate 170.9/100k, / 359.1 * 100 = 48 -> "Low". Property ~1,900/100k. Source: https://cde.ucr.cjis.gov/ (agency TX2330100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP Texas "Negative". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/texas , https://www.lgbtmap.org/equality-maps/texas |
| Climate | Semi-arid hot steppe (Koppen BSh). Snow ~1; annual precip ~20; Jan avg low 41; Jul/Aug avg high 97. SunnyDays 254 and summer humidity ~50 are secondary (usclimatedata/BestPlaces; NOAA normals carry no sunny-days/humidity element). Sources: https://usclimatedata.com/climate/del-rio/texas/united-states/ustx0346 , https://en.climate-data.org/north-america/united-states-of-america/texas/del-rio-1555/ |
| Gas | AAA TX statewide regular ~$3.63, late-Aug 2026 (Del Rio not separately surveyed). Source: http://tx-aaa.iprsoftware.com/ |
| Amenities | Walmart Supercenter #447 (Y). No Costco (nearest San Antonio ~155 mi). Sources: https://www.walmart.com/store/447-del-rio-tx , https://www.storelocators.com/store-lists/costco/texas |
| Base and defense context | DefenseHub=Y: Laughlin AFB (47th Flying Training Wing). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | TX has no state income tax (military retirement untaxed); disabled-veteran homestead exemption scaled by rating, full for 100%/totally disabled. Source: https://comptroller.texas.gov/taxes/property-tax/exemptions/ |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Del Rio, TX".
