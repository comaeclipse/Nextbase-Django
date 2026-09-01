# Jacksonville, NC Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Camp Lejeune / MCAS New River).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Onslow County seat. Census Reporter ACS 2024 1-year: 70,843 residents, ~1,452/sq mi (48.8 sq mi land, post-2020 annexation). Source: https://censusreporter.org/profiles/16000US3734200-jacksonville-nc/ |
| Coordinates | City centroid 34.7597, -77.4097 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 7.0% = 4.75% NC + 2.25% Onslow. Source: https://www.ncdor.gov/taxes-forms/sales-and-use-tax/sales-and-use-tax-rates/current-sales-and-use-tax-rates |
| Cost of living | CostOfLiving=92 from BEA RPP cache, Jacksonville, NC MSA (27340) 2024 all-items 92.085. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $234,147, through Jun 2026. Source: https://www.zillow.com/home-values/39134/jacksonville-nc/ |
| VA access | In-city Jacksonville 4 VA Clinic (CBOC, Fayetteville NC Coastal system); nearest VA medical center is Fayetteville VAMC (~80 mi). Naval Medical Center Camp Lejeune is DoD, not VA. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/fayetteville-coastal-health-care/locations/jacksonville-4-va-clinic/ |
| Politics and elections | Onslow County (county-level). 2016 Trump two-party 67.94%; 2024 Trump two-party 68.15%; rep +0.2 / dem -0.2. Sources: https://en.wikipedia.org/wiki/Onslow_County,_North_Carolina , NC State Board of Elections. |
| Crime (TCI) | Open violent-crime proxy: NC SBI "Crime in North Carolina 2024" (Table 5) Jacksonville PD = 174 violent offenses (murder 2, rape 16, robbery 15, agg assault 141) over ACS 2024 place population 70,843 = 245.6/100k, ÷ 359.1 × 100 = 68 → "Low". Property (bonus) 1,331 (~1,879/100k, near national) — violent-only proxy is the low driver. Approximate comparison. Source: https://www.ncsbi.gov/Services/Crime-Statistics/Crime-in-North-Carolina-Annual-Summaries/2024-Annual-Summary.aspx |
| LGBTQ | Not HRC MEI-scored (only larger NC cities + Fayetteville are). State policy: MAP North Carolina "Fair". CSV stores "Not Rated". Sources: https://reports.hrc.org/municipal-equality-index-2025 , https://www.mapresearch.org/equality_maps/profile_state/NC |
| Climate | NOAA 1991-2020 normals station USW00093727 (New River MCAF, in-city): ANN-PRCP 56.51 in → 57; ANN-SNOW 0.60 in → 1; Jan TMIN 35.2°F → 35; Jul TMAX 89.3°F → 89. SunnyDays 214, summer humidity 76 (timeanddate, secondary). Source: NCEI normals API (USW00093727). |
| Gas | AAA NC statewide regular ~$3.76, early Aug 2026 (refresh at import). Source: https://gasprices.aaa.com/?state=NC |
| Amenities | Walmart present (Y). No Costco (nearest Wilmington ~50 mi). Sources: https://www.walmart.com/store-directory/nc/jacksonville , https://www.storelocators.com/store-lists/costco/north-carolina |
| Base and defense context | DefenseHub=Y: Marine Corps Base Camp Lejeune complex + MCAS New River. Derived defense_hub recomputed post-import. Source: https://en.wikipedia.org/wiki/Marine_Corps_Air_Station_New_River |
| Veterans benefits (state-owned, not imported) | NC exempts military retirement pay (Session Law 2021-180, 20+ yrs / medical retirement); $45,000 disabled-veteran property exclusion. Sources: https://www.ncdor.gov/ , https://www.milvets.nc.gov/benefits-services/veterans-property-tax-relief |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Jacksonville, NC".
