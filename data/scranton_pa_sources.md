# Scranton, PA — Data Source Notes

**Retrieval Date:** 2026-07-23
**Prepared by:** Antigravity AI agent with human oversight

---

## Identity & Geography

| Field | Value | Source |
|:---|:---|:---|
| City | Scranton | — |
| State | PA | — |
| County | Lackawanna | Census QuickFacts |
| Population | 76,328 | U.S. Census 2020 Decennial (city/place) |
| Density | 3,016 per sq mi | Census QuickFacts (76,328 / 25.31 sq mi land area) |

**Sources:**
- U.S. Census Bureau QuickFacts: https://www.census.gov/quickfacts/scrantoncitypennsylvania
- Census Reporter ACS 5-Year: https://censusreporter.org/profiles/16000US4269000-scranton-pa/

**Note:** ACS 5-year estimate is 75,915; recent PEP estimates range 75,514–75,848. Used 2020 Decennial for consistency.

---

## Housing

| Field | Value | Source |
|:---|:---|:---|
| avg_home_value | 205,566 | Zillow ZHVI |
| avg_home_value_display | $205,566 | Zillow ZHVI |

**Data Vintage:** June 30, 2026
**Sources:**
- Zillow Home Values Scranton: https://www.zillow.com/scranton-pa/home-values/
- Zillow Research Data: https://www.zillow.com/research/data/

**Note:** ZHVI is a "typical home value" (mid-tier, SFR+Condo), not median sale price. 1-year trend: -2.8%. Lackawanna County ZHVI is higher at $248,475.

---

## Taxes & Cost of Living

| Field | Value | Source |
|:---|:---|:---|
| sales_tax | 6.0% | PA Dept of Revenue / Tax Foundation |
| income_tax | 3.07% | PA flat rate |
| col_index | 90 | AreaVibes / BestPlaces composite |
| cost_of_living | Low | Derived (90 < 95) |
| gas_price | $4.19 | AAA Metro Average (Scranton–WB–Hazleton) |

**Sources:**
- Tax Foundation Sales Tax Rates: https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/
- Tax Foundation State Income Tax: https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
- AreaVibes COL: https://www.areavibes.com/scranton-pa/cost-of-living/
- BestPlaces COL: https://www.bestplaces.net/cost_of_living/city/pennsylvania/scranton
- AAA Gas Prices: https://gasprices.aaa.com

**Note:** No local sales tax in Lackawanna County (only Philadelphia and Allegheny County add local). Scranton levies a local Earned Income Tax (EIT) for municipal operations but this is not captured in the `income_tax` field which represents state rate only. COL index sourced from consumer comparison sites (AreaVibes, BestPlaces); no COLI survey subscription data was used.

---

## Veterans Affairs

| Field | Value | Source |
|:---|:---|:---|
| has_va | No | VA.gov facility search |
| nearest_va | Wilkes-Barre VA Medical Center | VA.gov |
| distance_to_va | 19 miles | Driving distance via I-81 S |
| veterans_benefits | (see CSV) | PA DMVA |

**Sources:**
- Wilkes-Barre VA: https://www.va.gov/wilkes-barre-health-care/
- Scranton Vet Center (counseling only, not medical): https://www.va.gov/scranton-vet-center/
- PA DMVA Benefits: https://www.dmva.pa.gov/veteransaffairs/Pages/Benefits-and-Services.aspx
- PA Disabled Vets Tax Exemption: https://www.dmva.pa.gov/veteransaffairs/Pages/Tax-Exemption.aspx
- PA State Veterans Homes: https://www.dmva.pa.gov/veteransaffairs/Pages/Veterans-Homes.aspx

**Note:** Scranton has a Vet Center (readjustment counseling) and the Gino J. Merli Veterans' Center (PA state-operated long-term care home), but neither is a federal VA medical facility. The nearest VA Medical Center is Wilkes-Barre (19 mi driving, ~25–30 min). There is also a Tobyhanna VA Clinic ~24 mi east (on Tobyhanna Army Depot).

---

## Weather & Climate

| Field | Value | Source |
|:---|:---|:---|
| snow_annual | 45 | NOAA 1991–2020 Normals |
| rain_annual | 39 | NOAA 1991–2020 Normals |
| sun_days | 176 | NCDC Comparative Climatic Data |
| alw | 20 | NOAA 1991–2020 Normals (Jan mean min) |
| avg_high_summer | 85 | NOAA 1991–2020 Normals (Jul mean max) |
| humidity_summer | 71 | NOAA/NCEI Climatological Data |
| climate | Humid continental | Köppen Dfb/Dfa |
| climate_category | cold_snowy | Derived: snow_annual ≥ 30 |

**Station:** Wilkes-Barre/Scranton International Airport (KAVP, USW00014777)

**Sources:**
- NOAA NCEI U.S. Climate Normals: https://www.ncei.noaa.gov/products/us-climate-normals
- KAVP Climate Data: https://en.wikipedia.org/wiki/Wilkes-Barre/Scranton_International_Airport#Climate
- Sunshine Data: https://www.currentresults.com/Weather/US/average-annual-sunshine-by-city.php
- Humidity Data: https://www.currentresults.com/Weather/Pennsylvania/humidity-july.php

**Note:** Exact NOAA normals: snow 45.1", precip 38.72", Jan low 20.3°F, Jul high 84.6°F. Sun days (176) = 70 clear + 106 partly sunny. July humidity from secondary source (Current Results), not directly from NOAA normals station file.

---

## Politics & Elections

| Field | Value | Source |
|:---|:---|:---|
| state_party | D | Current PA governance |
| governor | D | Gov. Josh Shapiro (D) |
| city_politics | Moderately Liberal | Lackawanna County 2024 two-party Dem share 51.4% (threshold: 51–54.9%) |
| election_2016 | Clinton | Lackawanna County certified results |
| election_2016_percent | 50 | 49.79% total (rounded integer) |
| election_2024 | Harris | Lackawanna County certified results |
| election_2024_percent | 51 | 50.90% total (rounded integer) |
| rep_vote_share_change_pp | 0.39 | Two-party: 48.60% − 48.21% |
| dem_vote_share_change_pp | -0.39 | Two-party: 51.40% − 51.79% |
| election_change | 0.4 pp more Republican since 2016 | Near-zero shift |

### Raw Vote Counts (Lackawanna County)

**2016:**
- Clinton (D): 51,983
- Trump (R): 48,384
- Two-party total: 100,367
- Clinton two-party share: 51.79%
- Trump two-party share: 48.21%

**2024:**
- Harris (D): 59,510
- Trump (R): 56,261
- Two-party total: 115,771
- Harris two-party share: 51.40%
- Trump two-party share: 48.60%

**Sources:**
- Lackawanna County Official Certified Results: https://www.lackawannacounty.org/departments/elections_and_voter_registration/certified_election_results.php
- PA Dept of State Official Election Returns: https://www.electionreturns.pa.gov/
- MIT Election Data & Science Lab: https://electionlab.mit.edu/data

**Note:** Results are county-level (Lackawanna County). Scranton is Joe Biden's hometown and the city proper may lean more Democratic than the county. Mayor Paige Cognetti is a Democrat. The 0.4 pp Republican shift is essentially unchanged. City_politics classified as "Moderately Liberal" based on county-level two-party share; city-level precinct data was not obtained.

---

## Safety & Social

| Field | Value | Source |
|:---|:---|:---|
| tci | *(blank — gap)* | Conflicting consumer indices |
| crime | Moderate | Qualitative assessment |
| marijuana_status | Medical | PA Act 16 (2016) |
| lgbtq_rating | *(blank)* | Scranton not in HRC MEI |
| lgbtq_mei_score | *(blank)* | Scranton not in HRC MEI |
| lgbtq_state_policy_score | 17 | MAP PA tally (16.75/49, rounded) |
| tech_hub | N | Not a tech hub |
| defense_hub_manual | Y | Scranton Army Ammunition Plant + Tobyhanna Army Depot |

**Sources:**
- AreaVibes Crime: https://www.areavibes.com/scranton-pa/crime/ (index 77, "23% lower than average")
- BestPlaces Crime: https://www.bestplaces.net/crime/city/pennsylvania/scranton (violent 25.8 vs US 22.7; property 44.6 vs US 35.4)
- NeighborhoodScout Crime: https://www.neighborhoodscout.com/pa/scranton/crime ("safer than 23% of cities")
- CrimeGrade: https://crimegrade.org/safest-places-in-scranton-pa/ (C- grade)
- PA Medical Marijuana: https://www.health.pa.gov/topics/programs/Medical%20Marijuana/Pages/Medical%20Marijuana.aspx
- HRC MEI: https://www.hrc.org/resources/municipal-equality-index (Scranton not listed)
- MAP PA Profile: https://www.lgbtmap.org/equality-maps/profile_state/PA
- Scranton Army Ammunition Plant: https://www.army.mil/scranton
- Tobyhanna Army Depot: https://www.tobyhanna.army.mil/

### TCI Gap Explanation

TCI is intentionally left blank because consumer crime index sources gave contradictory signals:
- AreaVibes reports Scranton is "23% safer than average" (index ~77)
- NeighborhoodScout reports Scranton is "safer than only 23% of cities" (i.e., above-average crime)
- BestPlaces shows violent crime slightly above US average, property crime moderately above

These are proprietary indices with different methodologies. Per skill rules ("Do not mix proprietary crime index values"), TCI is left as a gap for later resolution with FBI UCR data.

### LGBTQ Gap Explanation

HRC Municipal Equality Index does not include Scranton. The 10 PA cities rated are: Allentown, Carlisle, Erie, Harrisburg, Lancaster, Philadelphia, Pittsburgh, Reading, State College, and Wilkes-Barre. Per skill rules, both LGBTQ and LGBTQ_MEI columns are left blank rather than guessed.

### Defense Hub

Scranton Army Ammunition Plant (SCAAP) is a major U.S. Army Joint Munitions Command facility operated by General Dynamics OTS, producing 155mm and 105mm artillery shells. Tobyhanna Army Depot (~20 mi away) is DoD's largest full-service C5ISR maintenance facility. `defense_hub_manual = Y` is set as a human judgment; `defense_hub` will be derived by recompute script.

---

## Tags & Description

**Tags:** Mountains, Hiking, Fishing, Healthcare, Culture, Arts, Golf

Tag justification:
- **Mountains**: Gateway to Pocono Mountains, Moosic Mountains border the city
- **Hiking**: Lackawanna River Heritage Trail (70+ mi), Nay Aug Park gorge trails
- **Fishing**: Lackawanna River is a designated PA River of the Year, Class A Wild Trout fishery
- **Healthcare**: Regional medical hub (Geisinger Community Medical Center, Regional Hospital of Scranton)
- **Culture**: Steamtown National Historic Site, Anthracite Heritage Museum, Electric City Trolley Museum
- **Arts**: Scranton Cultural Center at the Masonic Temple, Everhart Museum
- **Golf**: Pine Hills, Glenmaura National, Scranton Canoe Club

**Note:** "Skiing" tag omitted to keep within 7 tags (Montage Mountain is notable but seasonal). "Military" tag not added since defense presence is industrial/manufacturing rather than active military installation.
