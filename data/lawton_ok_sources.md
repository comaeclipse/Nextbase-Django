# Lawton, OK Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Fort Sill — Army Fires Center of Excellence / Field Artillery).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Comanche County. 2020 Census place 90,381; density 1,110/sq mi over 81.44 sq mi. Source: https://en.wikipedia.org/wiki/Lawton,_Oklahoma |
| Coordinates | City centroid 34.6042, -98.3956 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 9.0% = 4.5% OK + 0.375% Comanche County + 4.125% city (2026). Source: https://www.salestaxhandbook.com/oklahoma/rates/lawton |
| Cost of living | CostOfLiving=86 from BEA RPP cache, Lawton MSA (30020) 2024 all-items 85.941 (lowest in this batch). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $141,667, ~Apr 2026. Source: https://www.zillow.com/home-values/46183/lawton-ok/ |
| VA access | In-city Lawton VA Clinic (CBOC, Oklahoma City VA system, on/near Fort Sill). Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/find-locations/facility/vha_635GA |
| Politics and elections | Comanche County (county-level). 2016 Trump two-party 62.60%; 2024 Trump two-party 61.89%; rep -0.7 / dem +0.7 (essentially unchanged). Sources: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Oklahoma , https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Oklahoma |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency OK0160100 (Lawton Police Department), 2024 monthly rates summed to an annual violent rate of 829.2/100k, ÷ 359.1 × 100 = 231 → "High". Property (bonus) ~2,714/100k. Source: https://cde.ucr.cjis.gov/ (agency OK0160100). |
| LGBTQ | Not HRC MEI-scored. State policy: MAP Oklahoma "Negative" (-6.75/49). CSV stores "Not Rated". Sources: https://www.hrc.org/resources/municipal-equality-index , https://www.mapresearch.org/equality_maps/profile_state/OK |
| Climate | usclimatedata NOAA-based normals: Jan low ~27°F, Jul high ~96°F, ~27 in rain, ~2 in snow. SunnyDays 247 (WeatherSpark, secondary); summer humidity 53 (WeatherSpark, secondary). Source: https://usclimatedata.com/climate/lawton/oklahoma/united-states/usok0307 |
| Gas | AAA Lawton regular ~$3.47, ~2026-08-07 (refresh at import). Source: https://gasprices.aaa.com/?state=OK |
| Amenities | Walmart Supercenters present (Y). No Costco (nearest OKC ~90 mi). Sources: https://www.walmart.com/store-directory/ok/lawton , https://www.costco.com/warehouse-locations/ok.html |
| Base and defense context | DefenseHub=Y: Fort Sill, Lawton's largest employer, annexed into city limits in 1998. Derived defense_hub recomputed post-import. Source: https://en.wikipedia.org/wiki/Fort_Sill |
| Veterans benefits (state-owned, not imported) | OK fully exempts military retirement pay (SB 401, TY2022+); 100% P&T disabled-veteran full homestead exemption + sales-tax exemption up to a cap. Sources: https://oksenate.gov/press-releases , https://oklahoma.gov/tax/individuals/filing-information/exemptions-deductions-and-credits/exemptions.html |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Lawton, OK".
