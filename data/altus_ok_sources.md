# Altus, OK Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Altus AFB — 97th Air Mobility Wing, C-17/KC-46/KC-135 training).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Jackson County seat. 2020 Census place 18,729; density ~1,028/sq mi. Source: https://en.wikipedia.org/wiki/Altus,_Oklahoma |
| Coordinates | City centroid 34.638, -99.334 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 9.75% = 4.5% OK + 1.125% Jackson County + 4.125% city. Source: https://www.salestaxhandbook.com/oklahoma/rates/altus |
| Cost of living | CostOfLiving=84 from BEA RPP cache, Oklahoma nonmetropolitan portion (40999) 2024 all-items 83.576 (Altus is not in a BEA MSA). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI ~$100,088, ~2026 (most affordable in this batch). Source: https://www.zillow.com/home-values/ (Altus, OK region) |
| VA access | Altus VA Clinic (CBOC, Oklahoma City VA HCS), in-city (1604 N Main); nearest VAMC Oklahoma City ~119 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://marketplace.va.gov/facilities/altus |
| Politics and elections | Jackson County (county proxy). 2016 Trump two-party 80.2% (5,969/1,473); 2024 Trump two-party 79.7% (6,295/1,602); rep -0.5 / dem +0.5. Source: https://en.wikipedia.org/wiki/Jackson_County,_Oklahoma |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency OK0330100 (Altus PD), 2024 annual violent rate 295.5/100k, / 359.1 * 100 = 82 -> "Moderate". Source: https://cde.ucr.cjis.gov/ (agency OK0330100). |
| LGBTQ | Not HRC MEI-scored (6 OK cities scored, Altus not among them). State policy MAP Oklahoma "Negative". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/oklahoma |
| Climate | Humid subtropical bordering semi-arid (Cfa/BSk). Snow ~3; precip ~29 (usclimatedata Altus AFB); Jan avg low 24; Jul avg high 97. SunnyDays 246 and summer humidity ~52 are secondary. Source: https://www.usclimatedata.com/climate/altus-afb/oklahoma/united-states/usok0016 |
| Gas | AAA OK statewide regular ~$3.70, 2026-08-31. Source: https://gasprices.aaa.com/ |
| Amenities | Walmart Supercenter #479 (Y). No Costco (nearest Oklahoma City ~140 mi). Sources: https://www.walmart.com/store/479-altus-ok |
| Base and defense context | DefenseHub=Y: Altus AFB (97th Air Mobility Wing). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | OK fully exempts military retirement pay (SB 401, TY2022+); 100% P&T disabled vet: uncapped homestead ad-valorem exemption + sales-tax exemption ($25,000/yr cap). Sources: https://oksenate.gov/ (SB 401), https://oklahoma.gov/tax/helpcenter/exemptions.html |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Altus, OK".
