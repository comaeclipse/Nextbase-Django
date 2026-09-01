# Carlisle, PA Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Carlisle Barracks — U.S. Army War College).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Cumberland County seat; home to the U.S. Army War College and Dickinson College. 2020 Census place 20,118; density ~3,709/sq mi. Source: https://en.wikipedia.org/wiki/Carlisle,_Pennsylvania |
| Coordinates | Borough centroid 40.2025, -77.1950 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 6.0% = PA 6% + 0% county (only Philadelphia +2% / Allegheny +1% add local sales tax in PA). Source: PA DOR / Tax Foundation. |
| Cost of living | CostOfLiving=99 from BEA RPP cache, Harrisburg-Carlisle, PA MSA (25420) 2024 all-items 98.650. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI ~$294,946, 2026 (+5.6% YoY; Zillow city page 403'd, from search snapshot — verify exact date at import). Source: https://www.zillow.com/home-values/30760/carlisle-pa/ |
| VA access | Cumberland County VA Clinic (CBOC, Lebanon VAMC system), Mechanicsburg ~15 mi E; nearest VAMC Lebanon ~45 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/lebanon-health-care/locations/cumberland-county-va-clinic/ |
| Politics and elections | Cumberland County (county proxy; Carlisle borough — a Dickinson College town + county seat — very likely leans more Democratic than the county, borough precinct returns not pulled). 2016 Trump two-party 59.47% (69,076/47,085); 2024 Trump two-party 54.78% (80,267/66,255); rep -4.7 / dem +4.7. Cumberland was one of few PA counties to shift toward Dems in 2024. Source: https://www.rightdatausa.com/election_results?y=2024&s=PA&c=041&t=P&d=all |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency PA0210200 (Carlisle Borough PD), 2024 annual violent rate 172.8/100k, / 359.1 * 100 = 48 -> "Low". Source: https://cde.ucr.cjis.gov/ (agency PA0210200). |
| LGBTQ | HRC MEI 2024 = 100/100 (also 100 in 2023) — Carlisle is a Pennsylvania "All-Star" perfect-score city with a local nondiscrimination ordinance. PA has no statewide LGBTQ nondiscrimination statute (protections via PHRC guidance; MAP mid-tier). CSV stores LGBTQ=100, LGBTQ_MEI=100. Sources: https://www.carlislepa.org/news_detail_T29_R626.php , https://www.hrc.org/resources/mei-state/pennsylvania |
| Climate | Humid continental (Koppen Dfa). Snow ~30 (NOAA 29.8 in); precip ~39 (38.8 in); Jan avg low 21; Jul avg high 86. SunnyDays 193 and summer humidity ~71 are Harrisburg proxies (secondary). Sources: https://en.wikipedia.org/wiki/Carlisle,_Pennsylvania , https://usclimatedata.com/climate/carlisle/pennsylvania/united-states/uspa2741 |
| Gas | AAA PA statewide regular ~$4.09, Aug 2026. Source: https://gasprices.aaa.com/?state=PA |
| Amenities | Walmart Supercenter #2574 (Y). No Costco in Carlisle (nearest Mechanicsburg ~15-18 mi E). Sources: https://www.walmart.com/store/2574-carlisle-pa |
| Base and defense context | DefenseHub=Y: Carlisle Barracks / U.S. Army War College. Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | PA does not tax retirement income, including military retired pay; Disabled Veterans Real Estate Tax Exemption fully exempts the primary residence of 100% P&T service-connected disabled veterans, subject to a need-based income test. Source: PA DMVA / PA Dept. of Revenue. |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Carlisle, PA".
