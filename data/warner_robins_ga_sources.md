# Warner Robins, GA Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Robins AFB / Warner Robins Air Logistics Complex).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Houston County. Census Reporter ACS 2024 1-year: 85,856 residents, ~2,216/sq mi (38.7 sq mi land). Source: https://censusreporter.org/profiles/16000US1380508-warner-robins-ga/ |
| Coordinates | City centroid 32.6130, -83.6241 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 7.0% = 4% GA + 3% Houston County. Source: https://www.salestaxhandbook.com/georgia/rates/warner-robins |
| Cost of living | CostOfLiving=94 from BEA RPP cache, Warner Robins MSA (47580) 2024 all-items 93.789. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI ~$215,332 (city), Aug 2026 (Zillow blocked direct fetch; confirm exact city ZHVI at import). Source: https://www.zillow.com/warner-robins-ga/home-values/ |
| VA access | In-city Robins VA Clinic (CBOC, on Robins AFB; VA Dublin/Carl Vinson system); nearest VA medical center Carl Vinson VAMC, Dublin ~39 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/find-locations/facility/vha_557GG |
| Politics and elections | Houston County (county-level). 2016 Trump two-party 61.10%; 2024 Trump two-party 55.68%; rep -5.4 / dem +5.4. Sources: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Georgia , https://hhjonline.com/2024-general-election-results/ |
| Crime (TCI) | Open violent-crime proxy, COUNTY-LEVEL: GBI "2024 Crime Statistics Summary" does not break out Warner Robins PD, so the Houston County aggregate (611 violent offenses over 175,343) = 348.5/100k is used as a proxy, ÷ 359.1 × 100 = 97 → "Moderate". This is a county proxy (Warner Robins is <half of county pop) and is disclosed as such, consistent with the county-level politics fields; it aligns with the NeighborhoodScout city violent figure (~3.6/1,000). Property (bonus, county) 3,103. Source: https://gbi.georgia.gov/document/document/2024-crime-statistics-summary/download |
| LGBTQ | Not HRC MEI-scored. State policy: MAP Georgia "Negative" (-0.75/49). CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/georgia , https://www.mapresearch.org/equality_maps/profile_state/GA |
| Climate | usclimatedata / nearest NOAA station (Macon Regional): ~48 in rain, ~1 in snow, Jan low ~34°F, Jul high ~92°F. SunnyDays 223 (BestPlaces, secondary); summer humidity 70 (WeatherSpark, secondary). Reconcile to the Macon GHCN station in the weather sync. Source: https://www.usclimatedata.com/climate/warner-robins/georgia/united-states/usga1271 |
| Gas | AAA GA statewide regular ~$3.78, 2026-08-31 (refresh at import). Source: https://newsroom.acg.aaa.com/georgia-gas-price-average/ |
| Amenities | Walmart present (Y). No Costco (a Macon-Bibb warehouse is planned for summer 2027). Sources: https://www.walmart.com/store/1367-warner-robins-ga , https://www.13wmaz.com/article/news/local/macon/costco-project-in-macon-to-open-summer-2027/93-9ba1044c-396c-45d6-892a-838f408c4232 |
| Base and defense context | DefenseHub=Y: Robins AFB (78th Air Base Wing + Warner Robins Air Logistics Complex), adjacent. Derived defense_hub recomputed post-import. Source: https://www.robins.af.mil/ |
| Veterans benefits (state-owned, not imported) | GA TY2026 exempts up to $65,000 military retirement pay regardless of age; disabled-veteran homestead exemption. Sources: https://veterans.georgia.gov/military-retirement-income-tax-exemption , https://veterans.georgia.gov/disabled-veteran-homestead-tax-exemption |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Warner Robins, GA".
