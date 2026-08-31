# Killeen, TX Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Fort Cavazos / Fort Hood).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Killeen is in Bell County. Census Reporter ACS 2024 1-year: 160,618 residents, ~2,940/sq mi (54.6 sq mi land). Source: https://censusreporter.org/profiles/16000US4839148-killeen-tx/ |
| Coordinates | City centroid 31.1056, -97.7267 (Wikipedia; map crosswalk regenerates from the Census 2024 Gazetteer internal point). |
| Taxes | Combined sales tax 8.25% = 6.25% TX + 0.5% Bell County + 1.5% city (at the TX cap). Source: https://www.salestaxhandbook.com/texas/rates/killeen |
| Cost of living | CostOfLiving=91 from BEA RPP cache `data/sources/rpp/MARPP_MSA_2008_2024.csv`, Killeen-Temple MSA (28660) 2024 all-items 91.132. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI (typical home value) $220,742, ~Jun 2026. Source: https://www.zillow.com/home-values/5424/killeen-tx/ |
| VA access | In-city Killeen VA Clinic (CBOC); parent VAMC Olin E. Teague, Temple ~25 mi. `has_va`/distance recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/central-texas-health-care/locations/killeen-va-clinic/ |
| Politics and elections | Bell County (county-level). 2016 Trump two-party 57.93%; 2024 Trump two-party 58.24%; rep +0.3 / dem -0.3. Killeen city leans more Democratic than the county (down-ballot Killeen-area Democrats won 2024). Sources: https://www.texascounties.net/statistics/presidentialelection2016.htm , https://www.texascounties.net/statistics/presidentialelection2024.htm |
| Crime (TCI) | Open violent-crime proxy (same method as data/fayetteville_nc_sources.md): Killeen PD 2024 full-year NIBRS = 838 violent offenses (murder 20, rape 99, robbery 88, agg assault 631) over TX DPS covered population 161,968 = 517.4/100k, ÷ FBI 2024 national violent rate 359.1 × 100 = 144 → "Moderate" (bands Low<75, Moderate 75-149, High≥150). Property (bonus) 2,340. Approximate comparison, not a full FBI two-family index. Sources: https://killeentexas.gov/DocumentCenter/View/11705/December-2024-Crime-Statistics-PDF and https://cde.ucr.cjis.gov/ (agency TX). |
| LGBTQ | HRC MEI 2024 scorecard for Killeen = 46 (verified from the HRC per-city scorecard PDF). State policy: MAP Texas "Negative". Sources: https://www.hrc.org/resources/mei-state/texas and https://www.lgbtmap.org/equality-maps/profile_state/TX |
| Climate | usclimatedata NOAA-based normals: Jan low ~34°F, Aug high ~96°F, ~33 in rain, ~0 snow. SunnyDays 229 (WeatherSpark/secondary; NOAA normals carry no sunny-days element). Summer humidity 62% (weather-atlas July, secondary). Sources: https://usclimatedata.com/climate/killeen/texas/united-states/ustx0692 |
| Gas | AAA Killeen-Temple-Fort Hood metro regular ~$3.64, mid-Aug 2026 (refresh at import). |
| Amenities | Walmart Supercenters present (Y). No Costco (nearest Austin metro). Sources: https://www.walmart.com/store-directory/tx/killeen , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Fort Cavazos (formerly Fort Hood), III Armored Corps / 1st Cavalry Division, adjacent to/partly within Killeen. Derived defense_hub recomputed post-import. Source: https://en.wikipedia.org/wiki/Fort_Cavazos |
| Veterans benefits (state-owned, not imported by import-csv) | TX no income tax; rating-scaled disabled-veteran homestead exemption; 100% SC/IU total homestead exemption. Source: https://comptroller.texas.gov/taxes/property-tax/exemptions/ |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Killeen, TX".
