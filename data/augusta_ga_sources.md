# Augusta, GA Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Fort Eisenhower / Fort Gordon). Geography: Augusta-Richmond County consolidated city-county (Census place GEOID 1304204).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Richmond County (consolidated with Augusta since 1996). 2020 Census consolidated balance 202,071; density 668/sq mi over 302.282 sq mi (2024 Gazetteer). Sources: https://en.wikipedia.org/wiki/Augusta,_Georgia , https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_13.txt |
| Coordinates | 2024 Gazetteer internal point 33.365531, -82.073422 (GEOID 1304204). |
| Taxes | Combined sales tax 8.5% = 4% GA + 3.5% Richmond + 1% special (2026). Source: https://www.salestaxhandbook.com/georgia/rates/augusta |
| Cost of living | CostOfLiving=92 from BEA RPP cache, Augusta-Richmond County MSA (12260) 2024 all-items 91.903. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $188,454 (city), ~Jul 2026. Source: https://www.zillow.com/home-values/10210/augusta-ga/ |
| VA access | In-city Charlie Norwood VA Medical Center (full VAMC), 950 15th St. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/augusta-health-care/ |
| Politics and elections | Richmond County (consolidated). 2016 Clinton two-party 66.62%; 2024 Harris two-party 68.16%; rep -1.5 / dem +1.5. Sources: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Georgia , 2024 county returns (cross-check GA SoS). |
| Crime (TCI) | Open violent-crime proxy: GBI "2024 Crime Statistics Summary" Richmond County (all agencies; primary agency Richmond County SO — appropriate for the consolidated city-county) = 1,202 violent offenses (murder 47, rape 115, robbery 204, agg assault 836) over 205,931 = 583.7/100k, ÷ 359.1 × 100 = 163 → "High". Property (bonus) 7,556. Source: https://gbi.georgia.gov/document/document/2024-crime-statistics-summary/download |
| LGBTQ | HRC MEI = 28 (Augusta-Richmond County). State policy: MAP Georgia "Negative" (-0.75/49). Sources: https://www.hrc.org/resources/mei-state/georgia , https://www.mapresearch.org/equality_maps/profile_state/GA |
| Climate | NOAA 1991-2020 normals station USW00003820 (Augusta Bush Field): ANN-PRCP 44.09 in → 44; ANN-SNOW 0.80 in → 1; Jan TMIN 35.3°F → 35; Jul TMAX 94.1°F → 94. SunnyDays 222 (BestPlaces, secondary); summer humidity 74 (currentresults, secondary). Source: NCEI normals API (USW00003820). |
| Gas | AAA Augusta-Aiken metro regular ~$3.70, 2026-08-31. Source: https://gasprices.aaa.com/?state=GA |
| Amenities | Walmart present (Y). Costco #1102 in-city (Y), 825 Cabela Dr. Sources: https://www.walmart.com/store-directory/ga/augusta , https://www.costco.com/warehouse-locations/augusta-ga-1102.html |
| Base and defense context | DefenseHub=Y: Fort Eisenhower (Army Cyber Center of Excellence, Army Cyber Command HQ, NSA Georgia), adjacent SW. TechHub=N under the conservative civilian-tech standard (cyber/defense cluster noted). Derived defense_hub recomputed post-import. Source: https://home.army.mil/eisenhower/ |
| Veterans benefits (state-owned, not imported) | GA TY2026 exempts up to $65,000 military retirement pay regardless of age; disabled-veteran homestead exemption (adjusted annually). Sources: https://veterans.georgia.gov/military-retirement-income-tax-exemption , https://veterans.georgia.gov/disabled-veteran-homestead-tax-exemption |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Augusta, GA".
