# Dayton, OH Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Wright-Patterson AFB — AFMC, AFRL, AFLCMC, NASIC).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Montgomery County seat. 2020 Census place 137,644; density 2,466/sq mi over 55.81 sq mi. Source: https://en.wikipedia.org/wiki/Dayton,_Ohio |
| Coordinates | City centroid 39.7593, -84.1917 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 7.5% = 5.75% OH + 1.75% Montgomery County (no city sales tax). Source: https://www.salestaxhandbook.com/ohio/rates/montgomery-county |
| Cost of living | CostOfLiving=93 from BEA RPP cache, Dayton-Kettering-Beavercreek MSA (19430) 2024 all-items 92.694. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $138,730, ~Jul 2026. Source: https://www.zillow.com/home-values/31184/dayton-oh/ |
| VA access | Dayton VA Medical Center (full VAMC), 4100 W Third St, in-city. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/dayton-health-care/locations/dayton-va-medical-center/ |
| Politics and elections | Montgomery County (county-level; central-city government is Democratic). 2016 Trump two-party 50.39%; 2024 Harris two-party 50.24% (county flipped to Harris); rep -0.6 / dem +0.6. Source: https://en.wikipedia.org/wiki/Montgomery_County,_Ohio |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency OH0570200 (Dayton Police Department), 2024 monthly rates summed to an annual violent rate of 1,348.1/100k, ÷ 359.1 × 100 = 375 → "High". Property (bonus) ~4,388/100k. Dayton's violent rate is among Ohio's highest; recorded honestly. Source: https://cde.ucr.cjis.gov/ (agency OH0570200). |
| LGBTQ | HRC MEI 2024 = 100 (Dayton). State policy: MAP Ohio "Low" (0.25/49). Sources: https://reports.hrc.org/municipal-equality-index-2024 , https://www.mapresearch.org/equality-maps/profile_state/OH |
| Climate | NOAA 1991-2020 normals, Dayton Intl USW00093815: ANN-PRCP 41.33 in → 41; ANN-SNOW 25.0 in → 25; Jan avg low 21.8°F → 22; Jul avg high 85.9°F → 86. SunnyDays 176 (currentresults, secondary); July humidity 71 (timeanddate, secondary). Source: NCEI normals API (USW00093815). |
| Gas | AAA OH statewide regular ~$4.06, ~2026-08-23 (record-high month; refresh at import). Source: https://gasprices.aaa.com/state-gas-price-averages/ |
| Amenities | Walmart Supercenters present (Y). Costco Centerville (Y, ~10 mi, Montgomery County metro). Sources: https://www.walmart.com/store/finder?location=Dayton%2C+OH , https://www.storeopeninghours.com/costco-centerville-oh |
| Base and defense context | DefenseHub=Y: Wright-Patterson AFB adjacent (~10 mi NE). TechHub=N (defense/aerospace R&D center, not a broad commercial tech hub). Derived defense_hub recomputed post-import. Source: https://en.wikipedia.org/wiki/Wright-Patterson_Air_Force_Base |
| Veterans benefits (state-owned, not imported) | OH fully exempts military retirement pay (no income/age limit); $58,000 Enhanced Homestead Exemption for 100% disabled veterans. Source: https://militaryretirementcalc.com/states/ohio-military-retirement |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Dayton, OH".
