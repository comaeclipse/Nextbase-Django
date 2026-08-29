# Yuma, AZ Sources

Retrieved: 2026-08-27.

| Field | Source and note |
| --- | --- |
| Identity, population, density | Yuma city is in Yuma County. Census Reporter ACS 2024 1-year profile reports 103,561 residents and 855.3 people per square mile; CSV rounds density to 855. Source: https://censusreporter.org/profiles/16000US0485540-yuma-az/ |
| Coordinates | Census place centroid from the repo pace-derived geography bundle: lat 32.516286, lon -114.521782. |
| Taxes | City of Yuma sales-tax guidance lists combined general retail transaction privilege tax of 8.412%. Arizona state income tax is state-owned and not written through the city importer. Source: https://www.yumaaz.gov/business/sales-tax-information |
| Cost of living | BEA 2024 regional price parity cache in `data/sources/rpp/MARPP_MSA_2008_2024.csv` lists the Yuma MSA all-items RPP at 92.706; CSV rounds to 93. |
| Housing | Zillow's Yuma home-values page reports a typical home value / ZHVI of $296,776, updated 2026-07-31. Source: https://www.zillow.com/home-values/28065/yuma-az/ |
| VA access | VA's Yuma VA Clinic page lists outpatient care at 3111 S 4th Ave, Yuma. Source: https://www.va.gov/southern-arizona-health-care/locations/yuma-va-clinic/ and https://www.va.gov/find-locations/facility/vha_678GB |
| Veterans benefits | Arizona military/veteran benefit summary from MyArmyBenefits: state income tax exemption for military retirement and SBP payments, plus property-tax relief for eligible disabled veterans. Source: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Arizona |
| Politics and elections | Yuma County 2016 and 2024 presidential results were checked against Yuma County election result pages and Arizona official 2024 election results. CSV uses rounded winner shares and stores the two-party Republican share movement from 50.57% in 2016 to 60.33% in 2024. Sources: https://www.yumacountyaz.gov/government/voter-election-services/election-results, https://azsos.gov/elections/election-information/2024-election-info, and https://results.arizona.vote/ |
| Crime | AreaVibes reports Yuma violent crime at 424 per 100,000 residents. The importer-facing TCI stores the index against the FBI 2024 national violent-crime baseline of 359.1, rounded to 118. Sources: https://www.areavibes.com/yuma-az/crime/ and https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/crime-trend |
| Cannabis | Arizona adult-use marijuana is legal under Arizona Department of Revenue / adult-use program guidance. Source: https://azdor.gov/transaction-privilege-tax/adult-use-marijuana |
| LGBTQ | HRC MEI 2025 was checked and no Yuma municipal score was found. CSV stores `Not Rated`; the state policy score uses Movement Advancement Project's Arizona equality profile score of 8.75/49. Sources: https://www.hrc.org/resources/municipal-equality-index and https://www.advancingacceptance.com/equality-map-profiles/AZ-summary.pdf |
| Climate | NOAA/NCEI 1991-2020 monthly normals for station USW00003145 report annual precipitation of 3.28 inches, January normal low of 47.9 F, and July normal high of 106.7 F; CSV rounds to 3, 48, and 107. BestPlaces reports 0 inches of snow and 308 sunny days. Timeanddate reports mid-summer humidity around 32%. Sources: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00003145&format=json&units=standard&includeAttributes=false, https://www.bestplaces.net/climate/city/arizona/yuma, and https://www.timeanddate.com/weather/usa/yuma/climate |
| Gas | AAA Arizona gas-prices page reported Yuma regular current average of $4.408 on 2026-08-27; CSV rounds to $4.41. Source: https://gasprices.aaa.com/?state=AZ |
| Amenities | `has_walmart=Y` because Walmart's Yuma store directory lists multiple Yuma locations. `has_costco=N` because Costco's Arizona location sitemap did not list Yuma. Sources: https://www.walmart.com/store-directory/az/yuma and https://www.costco.com/warehouse-locations/az.html |
| Base and defense context | `DefenseHub=Y` because Yuma is anchored by Marine Corps Air Station Yuma and Yuma Proving Ground, both present in repo installation coordinate caches (`data/marine_corps_installations_coordinates.json` and `data/army_installations_coordinates.json`). Sources: https://www.mcasyuma.marines.mil/ and https://home.army.mil/yuma/ |
| Description and tags | Description and tags were written from the sourced facts above: base-adjacent defense presence, in-city VA clinic, lower-cost desert setting, Colorado River recreation, retail access, Arizona military-retirement tax treatment, and extreme summer heat. |

Post-import follow-up plan:

- Run `scripts/import-csv.ts data/yuma_az.csv --dry-run` from this branch only.
- After this source artifact merges to `master`, run the live import from `master`.
- After live import, run proximity, VHA/weather enrichment, `scripts/recompute-defense-hub.ts`, `scripts/verify-location-completeness.ts --name "Yuma, AZ"`, and map/runtime checks.
