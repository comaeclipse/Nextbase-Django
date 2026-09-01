# Goldsboro, NC Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Seymour Johnson AFB — 4th Fighter Wing, F-15E).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Wayne County seat. 2020 Census place 33,657; density ~1,177/sq mi. Source: https://en.wikipedia.org/wiki/Goldsboro,_North_Carolina |
| Coordinates | City centroid 35.38389, -77.99500 (Census-derived; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 6.75% = 4.75% NC + 2.0% Wayne County. Source: https://www.avalara.com/taxrates/en/state-rates/north-carolina.html |
| Cost of living | CostOfLiving=88 from BEA RPP cache, Goldsboro MSA (24140) 2024 all-items 88.462. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $178,983, ~mid-2026. Source: https://www.zillow.com/home-values/45473/goldsboro-nc/ |
| VA access | Goldsboro VA Clinic (CBOC, Durham VA HCS), in-city; nearest VAMC Durham/Fayetteville ~55 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/durham-health-care/locations/ |
| Politics and elections | Wayne County (county-level; Goldsboro city leans more Democratic). 2016 Trump two-party 55.85%; 2024 Trump two-party 58.27%; rep +2.4 / dem -2.4. Source: https://en.wikipedia.org/wiki/Wayne_County,_North_Carolina |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency NC0960100 (Goldsboro PD), 2024 annual violent rate 1,088.4/100k, / 359.1 * 100 = 303 -> "High". Property ~5,899/100k. Recorded honestly. Source: https://cde.ucr.cjis.gov/ (agency NC0960100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP North Carolina "Fair". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/north-carolina , https://mapresearch.org/equality-profiles/nc/ |
| Climate | NOAA 1991-2020 normals station USW00013713 (Goldsboro / Seymour Johnson AFB): annual snow 2.00 -> 2; annual precip 52.26 -> 52; Jan low 34.6 -> 35; Jul high 91.0 -> 91. SunnyDays 200, summer humidity 68 (secondary). Source: NCEI normals API (USW00013713). |
| Gas | AAA NC statewide regular ~$3.73, 2026-08-31. Source: https://gasprices.aaa.com/?state=NC |
| Amenities | Walmart Supercenters present (Y). No Costco (nearest Raleigh ~50 mi). Sources: https://www.walmart.com/store-directory/nc/goldsboro , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Seymour Johnson AFB (4th Fighter Wing, F-15E; air refueling), adjacent. Derived defense_hub recomputed post-import. Source: https://www.seymourjohnson.af.mil/ |
| Veterans benefits (state-owned, not imported) | NC exempts military retirement pay (Session Law 2021-180); $45,000 disabled-veteran property exclusion. Source: https://www.milvets.nc.gov/benefits-services/veterans-property-tax-relief |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Goldsboro, NC".
