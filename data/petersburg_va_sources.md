# Petersburg, VA Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Fort Gregg-Adams / Fort Lee, in adjacent Prince George County).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Independent city (own county-equivalent, FIPS 51730; "County" join value = Petersburg). 2020 Census place 33,458; density ~1,472/sq mi. Source: https://www.census.gov/quickfacts/fact/table/petersburgcityvirginia |
| Coordinates | City centroid 37.23, -77.405 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 5.3% = 4.3% VA + 1.0% local (no regional transportation add-on). Source: https://www.sale-tax.com/PetersburgVA |
| Cost of living | CostOfLiving=98 from BEA RPP cache, Richmond, VA MSA (40060) 2024 all-items 97.858 (Petersburg is in the Richmond MSA). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $244,724, 2026-08-31. Source: https://www.zillow.com/home-values/13265/petersburg-va/ |
| VA access | Richmond VA Medical Center (McGuire), Central Virginia VA HCS, ~18 mi crow-fly (nearest is a VAMC; no closer CBOC identified). Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/richmond-health-care/locations/ |
| Politics and elections | Petersburg city returns (independent city; strongly Democratic, majority-Black). 2016 Clinton two-party 89.23%; 2024 Harris two-party 72.35%; rep +16.9 / dem -16.9. NOTE: 2024 total turnout was ~34% below 2016/2020 — the two-party share is robust but absolute counts warrant re-verification against VA Dept of Elections certified results. Source: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Virginia |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency VA1190000 (Petersburg PD), 2024 annual violent rate 1,070.4/100k, / 359.1 * 100 = 298 -> "High" (VA State Police "Crime in Virginia 2024" corroborates ~1,044/100k, highest big-city rate in VA; homicides fell 23->11). Property ~2,964/100k. Source: https://cde.ucr.cjis.gov/ (agency VA1190000). |
| LGBTQ | Not HRC MEI-scored (not to be confused with St. Petersburg, FL). State policy MAP Virginia "Fair" (downgraded from High in 2025). Sources: https://reports.hrc.org/municipal-equality-index-2024 , https://mapresearch.org/equality-profiles/va/ |
| Climate | Petersburg 1991-2020 normals: annual precip 46.99 -> 47; Jan avg low 28.3 -> 28; Jul avg high 89.3 -> 89. Snow 11, SunnyDays 210, summer humidity 70 (Richmond RIC secondary proxies; Petersburg COOP has no snow/humidity element — reconcile at weather sync). Source: https://en.wikipedia.org/wiki/Petersburg,_Virginia |
| Gas | AAA VA statewide regular ~$3.86, 2026-08-31. Source: https://gasprices.aaa.com/state-gas-price-averages/ |
| Amenities | Walmart Supercenter #2160 (Y). No Costco (nearest Richmond metro). Sources: https://www.walmart.com/store/2160-petersburg-va , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Fort Gregg-Adams (formerly Fort Lee, Army sustainment/logistics center) adjacent in Prince George County. Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | VA subtracts up to $40,000 military retirement pay for TY2025+ (age-55 restriction removed TY2023); full property-tax exemption for 100% P&T disabled veterans. Sources: https://www.tax.virginia.gov/ , https://www.dvs.virginia.gov/ |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Petersburg, VA".
