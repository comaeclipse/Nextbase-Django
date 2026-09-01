# Enid, OK Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Vance AFB — 71st Flying Training Wing, undergraduate pilot training).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Garfield County seat. 2020 Census place 51,308; density ~694/sq mi. FBI 2024 covered pop 50,382. Source: https://en.wikipedia.org/wiki/Enid,_Oklahoma |
| Coordinates | City centroid 36.4006, -97.8814 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 9.10% = 4.5% OK + 0.35% Garfield County + 4.25% city. Source: https://www.avalara.com/taxrates/en/state-rates/oklahoma/cities/enid.html |
| Cost of living | CostOfLiving=84 from BEA RPP cache, Enid MSA (21420) 2024 all-items 84.269 (lowest col_index in this batch). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $113,496 (lowest home value in this batch), ~mid-2026. Source: https://www.zillow.com/home-values/11328/enid-ok/ |
| VA access | Enid VA Clinic (CBOC, Oklahoma City VA HCS), in-city; nearest VAMC Oklahoma City ~90 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/oklahoma-city-health-care/locations/enid-va-clinic/ |
| Politics and elections | Garfield County (county-level). 2016 Trump two-party 78.45%; 2024 Trump two-party 77.39%; rep -1.1 / dem +1.1. Sources: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Oklahoma , https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Oklahoma |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency OK0240100 (Enid PD, distinct from North Enid PD OK0241600), 2024 annual violent rate 537.9/100k, / 359.1 * 100 = 150 -> "High". Property ~2,406/100k. Source: https://cde.ucr.cjis.gov/ (agency OK0240100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP Oklahoma "Negative". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-see-your-cities-scores , https://www.lgbtmap.org/equality_maps/profile_state/OK |
| Climate | NOAA 1991-2020 normals station USC00342912 (Enid): annual snow 9.40 -> 9; annual precip 33.29 -> 33; Jan low 24.7 -> 25; Jul high 94.8 -> 95. SunnyDays 230, summer humidity 62 (secondary; COOP station carries no sunny-days/humidity element). Source: NCEI normals API (USC00342912). |
| Gas | AAA OK statewide regular ~$3.86, late-Aug 2026. Source: https://gasprices.aaa.com/?state=OK |
| Amenities | Walmart Supercenter #499 (Y). No Costco (nearest Oklahoma City ~90 mi). Sources: https://www.walmart.com/store/499-enid-ok , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Vance AFB (71st Flying Training Wing, undergraduate pilot training). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | OK fully exempts military retirement pay (SB 401, TY2022+); 100% P&T disabled-veteran full homestead + sales-tax exemption. Source: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Oklahoma#Taxes |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Enid, OK".
