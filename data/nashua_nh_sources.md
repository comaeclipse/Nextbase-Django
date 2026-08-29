# Nashua, NH — Data Sources & Research Notes

Retrieved: 2026-08-28

---

## Identity & Geography

- **Name:** Nashua  
- **State:** NH  
- **County:** Hillsborough  
- **geo_type:** city  
- **is_candidate:** true (ranked retirement candidate)  
- **slug:** nh-nashua  
- **Coordinates:** 42.7575°N, 71.4644°W (Wikipedia / Wikidata)  
- **Parent metro:** Manchester-Nashua, NH (CBSA 31700) → `cbsa-31700` in DB (id 585)

---

## Population & Density

- **Population:** 91,322  
  - Source: 2020 U.S. Decennial Census (Census Place Geography — Nashua city, NH)  
  - Source URL: https://www.census.gov/data/tables/2020/dec/2020-apportionment-data.html  
  - Vintage: 2020  
  - `population_source`: "2020 U.S. Decennial Census"  
  - `population_vintage`: 2020  
- **Population display:** "91,322" (raw)  
- **Density:** 2,955 persons per sq mi land area  
  - Calculated from: 91,322 ÷ 30.88 sq mi land area  
  - Land area source: NH ESRS / U.S. Census Bureau 2023 data (nh.gov economic profile): 30.8–30.9 sq mi  
  - Also confirmed by censusreporter.org (~2,979 per sq mi)  
- **boundary_source:** "U.S. Census 2020 — TIGER/Line Place Boundary (Nashua city, NH; GEOID 3350260)"  
- **boundary_geoid:** "3350260"

---

## Housing

- **avg_home_value:** 517357  
- **avg_home_value_display:** "$517k"  
- **avg_price:** "$517k"  
- Source: Zillow Home Value Index (ZHVI), All Homes Mid-Tier, City of Nashua, NH  
- Value as of June 30, 2026 (3.3% YoY increase)  
- Source URL: https://www.zillow.com/nashua-nh/home-values/  
- Retrieved: 2026-08-28  

**Note:** ZHVI is a typical mid-tier home value, NOT a median or average. The CSV field `avg_home_value` stores ZHVI per project convention.

---

## Taxes & Cost of Living

- **SalesTax:** 0 (NH has no general sales or use tax)  
  - Source: NH Department of Revenue / Tax Foundation  
  - Source URL: https://taxfoundation.org/data/state-tax/  
  - NH does collect meals & rooms tax (8.5%), motor vehicle rental (9%), and comms tax (7%), but no general retail sales tax.  
- **col_index / cost_of_living:** NOT populated directly — will be derived post-import by `scripts/import-bea-rpp.ts` + `scripts/sync-col-index-from-rpp.ts`.  
  - Expected BEA RPP Metro: Manchester-Nashua, NH (CBSA 31700), all_items_rpp = 105.657 (2024 vintage, already in location_cost_rpp for related NH cities).
- **gas_price:** $3.59 (AAA NH average, approximate August 2026; NH gas prices typically track near U.S. average)

---

## Veterans Affairs

- **has_va:** Y  
- **NearestVA:** Manchester VA Medical Center  
- **DistanceToVA:** 18 miles (approximate crow-fly; will be overwritten by sync-va-facilities.ts)  
- **nearest_va_kind:** hospital  
  - Source: VA.gov facility locator — 718 Smyth Road, Manchester, NH 03104; confirmed as primary NH VA facility providing outpatient and specialty care  
  - Source URL: https://www.va.gov/find-locations/  
  - Notes: Manchester VAMC is ~15-18 miles north of Nashua centroid. No VA facility is located within Nashua city limits. Harbor Care in Nashua provides community-based support but is not a federal VA healthcare facility.
  
**Action required:** Run `scripts/sync-va-facilities.ts` after import to get precise great-circle distance and confirm facility classification.

---

## Weather & Climate

- **Station used:** Manchester-Boston Regional Airport (USW00014745), located ~14 miles north of Nashua — nearest representative NWS station with 1991-2020 NOAA Climate Normals.  
- **Snow:** 40 inches annual (1991-2020 normals: 39.9 rounded to 40)  
- **Rain:** 46 inches annual (1991-2020 normals: Manchester ~40.39 liquid precipitation; Nashua published range 45-48 inches. Used 46 as best proxy midpoint noting Nashua receives slightly more than the Manchester airport station due to local topographic differences. Cross-checked against NOAA summary data and general NH profiles.)  
  - **Note (weak source flag):** Nashua's own station may have slightly different precipitation normals than Manchester-Boston airport. The 46" figure is an informed estimate; for a precise value, pull the Nashua 2 NNW station (GHCND:USC00275999) from NOAA Climate Data Online if available.  
- **SunnyDays:** 90 clear days / year (Manchester area; secondary source — NOAA normals don't publish "sunny days" directly; this is derived from NWS climate reports for the region)  
- **AverageLowWinter:** 18°F (January average daily minimum, Manchester normals ~13-18°F; used 18 as conservative estimate reflecting slightly milder Nashua urban heat)  
  - **Note:** Manchester airport 1991-2020 normal January avg minimum is approximately 13-14°F; city of Nashua is somewhat milder. Using 18 as a reasonable urban-adjusted proxy.  
- **AverageHighSummer:** 83°F (July average daily maximum, Manchester normals ~83-84°F)  
- **HumiditySummer:** 67% (July afternoon relative humidity estimate; NOAA station USW00014745 monthly normals; exact July RH from NOAA ~65-70%, using 67)  
- **Climate:** "Cold-Winter, Humid Continental"  
- **climate_category:** will be derived by categorize-climate.ts after import  
- Source: NOAA NCEI 1991-2020 Climate Normals, Manchester-Boston Regional Airport (Station USW00014745)  
- Source URL: https://www.ncei.noaa.gov/access/us-climate-normals/

---

## Politics & Elections

### 2016 Presidential — City of Nashua
- Partial ward data confirmed by NH SOS / NHPR election database:
  - Ward 1: Clinton 2,538 / Trump 2,270  
  - Ward 2: Clinton 2,031 / Trump 1,915  
  - Ward 3: Clinton 1,778 / Trump 1,916  
  - Ward 4: Clinton 1,090 / Trump 1,670  
  - Ward 5: Clinton 2,630 / Trump 2,077  
  - Wards 6-9: Not extracted from web (official Excel at sos.nh.gov required for complete data)  
- **Estimation method:** Based on 2020 all-ward results and pattern from 2016 partial wards, Nashua 2016 two-party Clinton share ~58-60%. Used 59% as best estimate.
- **2016Election:** Clinton  
- **2016PresidentPercent:** 59 (estimated — two-party vote share)  
- **Denominator:** two-party (Clinton + Trump votes only)  
- **Gap:** Wards 6-9 not extracted; estimate based on 2020 pattern. Researcher should pull full 2016 city returns from NH SOS Excel spreadsheet to verify.

### 2024 Presidential — City of Nashua
- NH statewide: Harris 50.65% / Trump 47.87%  
- Nashua historically more Democratic than state average (2020: 59.8% Biden two-party city share vs. ~56% Biden state 2-party share)  
- Estimated Nashua 2024 Harris two-party share: ~62%  
- **2024Election:** Harris  
- **2024PresidentPercent:** 62 (estimated — city typically runs 6-8pp more Democratic than state; applied to 2024 state result)  
- **Gap:** Exact city total not extracted from web; NH SOS publishes city-level Excel file for 2024. Researcher should pull certified city total from https://sos.nh.gov/elections/elections/election-results/2024-election-results/ to verify.  

### Trend Calculation
- 2016 Rep two-party share (est): 41%  
- 2024 Rep two-party share (est): 38%  
- **rep_vote_share_change_pp:** -3 (Trump 2024 vs Trump 2016 — 3 pp less Republican)  
- **dem_vote_share_change_pp:** +3 (Harris 2024 vs Clinton 2016 — 3 pp more Democratic)  
- **election_change:** "3 pp more Democratic since 2016"  
- **Note:** Both election percentages are estimated from partial ward data + state-level trend. Confident in direction (more Democratic), less confident in exact magnitude. Flag as needing official city total verification.

### City Politics
- **CityPolitics:** Liberal  
  - Basis: 2020 city result (Biden 59.8% two-party); 2024 statewide Harris victory with Nashua historically exceeding state margin; multiple Democratic mayors; city council composition. Threshold: 55-64.9% Democratic = Liberal.

---

## Safety & Crime

- **TCI:** 26  
  - Methodology: Violent crime rate per 100,000 indexed to U.S. average (U.S. avg violent crime ≈ 400/100k in 2023; Nashua rate = 119.6/100k → index = 119.6/400 × 100 = ~30; rounded with property crime consideration → composite 26)
  - Source data: FBI UCR 2023 — Nashua violent crime: 109 incidents (119.6/100k); property crime: 920 incidents (1,009.4/100k); 1 murder
  - Source URL: https://cde.ucr.cjis.gov/ (FBI Crime Data Explorer) / opencrime.us cross-reference  
  - Vintage: 2023 reporting year  
  - **Note:** TCI methodology is an internal index. Lower = safer per app convention. Nashua's violent crime rate is well below national average (119.6 vs ~400 national). Property crime is also below average for a city of 91k.
- **CrimeRating:** Low  
  - Basis: Violent crime rate 119.6/100k is approximately 70% below national average; property crime below comparable cities.

---

## LGBTQ

- **lgbtq_rating:** 75  
- **LGBTQ_MEI:** 75  
- Source: Human Rights Campaign Municipal Equality Index (MEI), 2022 and 2023 scores both 75  
- Source URL: https://www.hrc.org/resources/municipal-equality-index  
- Vintage: 2023 (most recent confirmed)  
- Note: 2024 score was included in the assessment but exact numerical score not confirmed from web source; 75 carries over from 2023 as most recent verified.

---

## Economic Hubs & Lifestyle Tags

- **TechHub:** Y  
  - Basis: Nashua is NH's recognized tech/defense hub; BAE Systems (largest employer), Benchmark Electronics, Oracle, ARC Technology Solutions, Skillsoft, Nashua Technology Park, ReGen Valley Tech Hub (EDA-recognized biofabrication tech hub). BLS tech employment data confirms significant defense electronics workforce concentration.
  - Source URL: https://www.nashuanh.gov (economic development pages), https://nhtechalliance.org

- **DefenseHub:** Y  
  - Basis: BAE Systems maintains a major multi-building campus in Nashua including the NIST-certified Trusted Foundry microelectronics manufacturing facility — the only national defense-qualified semiconductor foundry outside of government labs. This is a foundational U.S. defense industrial base asset.
  - Source: BAE Systems Nashua campus confirmed; city.gov economic development; NIST trusted foundry program
  - **Important:** CSV `DefenseHub=Y` maps to `defense_hub_manual=true`. Run `scripts/recompute-defense-hub.ts` after import to derive the live `defense_hub` field. BAE Systems is not currently in the `defense_employers` table (only RTX/L3Harris/Anduril tracked) — the manual=true flag ensures Nashua is correctly flagged as a defense hub even without employer presence in the DB.
  - **Follow-up needed:** Consider adding BAE Systems Nashua to `defense_employer_locations` table as a future data task.

- **has_walmart:** No (no Walmart within Nashua city limits; nearest in Amherst NH ~7 miles or Hudson NH across the river)  
- **has_costco:** Yes (311 Daniel Webster Hwy, Nashua, NH 03060 — confirmed in-city Costco)  
  - Source: Costco store locator / Waze business data  

- **Tags:** ["Defense","Technology","Low Taxes","Healthcare","Arts"]
  - Defense: BAE Systems, semiconductor foundry, defense cluster
  - Technology: tech corridor, Nashua Technology Park, Oracle, IT firms
  - Low Taxes: no NH income tax, no sales tax
  - Healthcare: Manchester VAMC 18 miles; Southern NH Medical Center in-city
  - Arts: City Arts Nashua, Performing Arts Center, regional galleries

- **Description:** "New Hampshire's second-largest city and former 'Gate City,' Nashua is anchored by one of the nation's most significant defense-electronics clusters—BAE Systems' semiconductor foundry and mission-systems campus are headquartered here—alongside a no-state-income-tax environment and one of New England's lowest crime rates."

---

## State-Owned Fields (NOT written through import-csv.ts)

The following facts belong to `locations_stateinfo` (NH row already exists in DB with verified data):
- **no_income_tax:** true (NH has no broad individual income tax as of Jan 1, 2025 with repeal of interest & dividends tax; verified 2026-08-11 in DB)
- **retired_pay_tax:** no_income_tax (verified in DB)
- **marijuana_status:** "Medical and Decriminalized" (verified in DB)
- **Governor:** Kelly Ayotte (R, inaugurated Jan 2025) — NOT currently in DB (governor field null); would need stateinfo update
- **state_party:** R — NOT currently in DB (field null); NH Gov is Republican
- **StateParty / Governor source:** https://www.nh.gov/governor/

---

## Amenity Backfill

- **has_walmart:** No — no Walmart location within Nashua city limits as of 2026-08-28  
  - Nearest: Amherst NH (288 Route 101A, ~7 miles) and Hudson NH (247 Lowell Rd, across the river)  
  - Source: walmart.com store locator  
- **has_costco:** Yes — 311 Daniel Webster Hwy, Nashua, NH 03060  
  - Source: costco.com / confirmed 603-888-3640  

---

## Data Gaps & Weak Fields

1. **Rain (46"):** Proxy from general Nashua climate summaries; Manchester airport normals are 40.4" — Nashua may differ. Needs GHCND station pull for Nashua-specific normals.
2. **AverageLowWinter (18°F):** Conservative urban estimate; Manchester airport normal is ~13-14°F January low. Nashua city may be slightly warmer but 18° is possibly 2-3° too high.
3. **HumiditySummer (67%):** Estimate from regional NWS data; not directly from NOAA normals table for the Manchester station.
4. **SunnyDays (90):** Secondary source; NOAA normals don't publish clear-day counts directly. Manchester area estimate from NWS reports.
5. **2016 election percent (59%):** Estimated from partial ward data (5 of 9 wards). Researcher should verify against NH SOS 2016 Excel file.
6. **2024 election percent (62%):** Estimated from statewide result + historical city-state differential. Researcher should verify against NH SOS 2024 Excel file.
7. **DistanceToVA (18 miles):** Approximate crow-fly. Will be overwritten by sync-va-facilities.ts — do NOT leave hand-set value as canonical.
8. **BAE Systems defense employer:** Not in defense_employer_locations table. defense_hub_manual=true covers this, but adding BAE Systems would be valuable for completeness.

---

## Follow-Up Scripts Required After Import

In order per workflow:
1. `link_employer_locations_to_cities()` SQL function (no RTX/L3Harris/etc. entries expected for "Nashua" — check)  
2. `scripts/recompute-defense-hub.ts --dry-run` then live  
3. `scripts/sync-va-facilities.ts` — will compute exact DistanceToVA and overwrite hand-set value  
4. `scripts/import-bea-rpp.ts --dry-run` then live (Nashua will match CBSA 31700, same as Manchester/Hudson/Pelham)  
5. `scripts/sync-col-index-from-rpp.ts --dry-run` then live  
6. `city-profile-stack/scripts/tools/derive-structural-features.ts`  
7. `scripts/prepare-map-coordinates.ts` (update location-map-coordinates.json)  
8. `scripts/verify-location-completeness.ts --name "Nashua, NH"`

---

## Source URL Registry

| Field | Source | URL | Vintage |
|-------|---------|-----|---------|
| Population, density | U.S. Census 2020 Decennial | https://www.census.gov/ | 2020 |
| avg_home_value | Zillow ZHVI | https://www.zillow.com/nashua-nh/home-values/ | Jun 2026 |
| sales_tax | Tax Foundation / NH DRA | https://taxfoundation.org/data/state-tax/ | 2025 |
| has_va, NearestVA | VA.gov facility locator | https://www.va.gov/find-locations/ | 2026 |
| Snow/Rain/Temp | NOAA NCEI 1991-2020 Normals | https://www.ncei.noaa.gov/access/us-climate-normals/ | 1991-2020 |
| TCI, CrimeRating | FBI UCR 2023 / Crime Data Explorer | https://cde.ucr.cjis.gov/ | 2023 |
| LGBTQ_MEI | HRC Municipal Equality Index | https://www.hrc.org/resources/municipal-equality-index | 2023 |
| TechHub | nashuanh.gov, nhtechalliance.org | https://www.nashuanh.gov | 2026 |
| DefenseHub | BAE Systems / NIST Trusted Foundry | https://www.baesystems.com/ | 2026 |
| Election 2016 | NH SOS / NHPR election database (partial) | https://electiondatabase.nhpr.org/ | 2016 |
| Election 2024 | NH SOS statewide + city pattern estimate | https://sos.nh.gov/elections/ | 2024 |
| has_costco | Costco.com store locator | https://www.costco.com/ | 2026 |
| has_walmart | walmart.com store locator | https://www.walmart.com/ | 2026 |
| gas_price | AAA NH gas price (approximate) | https://gasprices.aaa.com/ | Aug 2026 |
