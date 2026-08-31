# Albany, GA Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Marine Corps Logistics Base Albany).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Dougherty County seat. 2020 Census place 69,647; density ~1,265/sq mi (55.064 sq mi land, 2024 Gazetteer). Source: https://www.census.gov/quickfacts/albanycitygeorgia |
| Coordinates | 2024 Gazetteer internal point 31.578117, -84.176224 (GEOID 1301052). |
| Taxes | Combined sales tax 8.0% = 4% GA + 4% Dougherty local. Source: https://www.salestaxhandbook.com/georgia/rates/dougherty-county |
| Cost of living | CostOfLiving=88 from BEA RPP cache, Albany, GA MSA (10500) 2024 all-items 87.669. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $127,635 (city; lowest in this batch), ~2026. Source: https://www.zillow.com/home-values/71623/albany-ga-31702/ |
| VA access | Albany VA Clinic (CBOC, VA Dublin HCS), on MCLB Albany; parent VAMC Carl Vinson (Dublin) ~138 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/dublin-health-care/locations/albany-va-clinic/ |
| Politics and elections | Dougherty County (county-level; majority-Black, strongly Democratic). 2016 Clinton two-party 69.50%; 2024 Harris two-party 70.64%; rep -1.1 / dem +1.1. Sources: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Georgia , https://app.enhancedvoting.com/results/public/dougherty-county-ga/elections/2024NovGen |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency GA0470100 (Albany PD), 2024 annual violent rate 944.6/100k, / 359.1 * 100 = 263 -> "High". Property ~2,178/100k. Source: https://cde.ucr.cjis.gov/ (agency GA0470100). |
| LGBTQ | Not HRC MEI-scored. State policy MAP Georgia "Negative". CSV stores "Not Rated". Sources: https://www.hrc.org/resources/municipalities , https://www.mapresearch.org/equality-profiles/ga |
| Climate | NOAA 1991-2020 normals station USW00013869 (SW Georgia Regional, KABY): annual precip 46.63 -> 47; Jan low 39.1 -> 39; Jul high 93.2 -> 93; snow 0. SunnyDays 217, summer humidity 74 (regional secondary). Source: NCEI normals API (USW00013869). |
| Gas | AAA Albany metro regular ~$3.66, 2026-08-31. Source: https://gasprices.aaa.com/?state=GA |
| Amenities | Walmart Supercenters present (Y). No Costco. Sources: https://www.walmart.com/store-directory/ga/albany , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: Marine Corps Logistics Base Albany (Marine Corps supply/maintenance). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | GA TY2026 exempts up to $65,000 military retirement pay regardless of age (HB 266); disabled-veteran homestead exemption ($126,526 for 2026). Sources: https://veterans.georgia.gov/military-retirement-income-tax-exemption , https://veterans.georgia.gov/disabled-veteran-homestead-tax-exemption |

Post-import: import from master; then import-bea-rpp.ts, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Albany, GA".
