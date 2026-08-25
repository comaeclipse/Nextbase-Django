# Erie, PA — Data Source Notes

**Retrieval Date:** 2026-08-20  
**Prepared by:** Antigravity AI Agent with human oversight  
**Target Row:** `Erie, PA` (`locations_location`)

---

## Identity & Geography

| Field | Value | Source |
|:---|:---|:---|
| City | Erie | — |
| State | PA | — |
| County | Erie | Census QuickFacts |
| Population | 94,861 | U.S. Census Bureau QuickFacts / 2020 Decennial Census (city/place) |
| Density | 4,956 per sq mi | Census QuickFacts (94,861 / 19.14 sq mi land area) |
| Latitude | 42.116594 | U.S. Census 2024 Gazetteer place centroid (`4224000` / `erie|PA`) |
| Longitude | -80.073503 | U.S. Census 2024 Gazetteer place centroid (`4224000` / `erie|PA`) |

**Sources:**
- U.S. Census Bureau QuickFacts (Erie city, Pennsylvania): https://www.census.gov/quickfacts/eriecitypennsylvania
- U.S. Census Bureau 2024 Gazetteer Place Files: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html

---

## Housing

| Field | Value | Source |
|:---|:---|:---|
| avg_home_value | 208273 | Zillow ZHVI |
| avg_home_value_display | $208,273 | Zillow ZHVI (July 31, 2026 data vintage) |

**Data Vintage:** July 31, 2026  
**Sources:**
- Zillow Home Value Index (Erie, PA): https://www.zillow.com/home-values/45347/erie-pa/
- Zillow Research Data: https://www.zillow.com/research/data/

**Note:** ZHVI reflects the typical mid-tier home value (SFR + Condo, smoothed and seasonally adjusted). 1-year change is +5.6%. Erie County ZHVI is $228,459.

---

## Taxes & Cost of Living

| Field | Value | Source |
|:---|:---|:---|
| sales_tax | 6.00% | PA Department of Revenue / Tax Foundation |
| income_tax | 3.07% | PA flat statutory personal income tax rate (state-owned) |
| col_index | 85 | Pre-import proxy estimate (derived post-import from BEA RPP by `sync-col-index-from-rpp.ts`) |
| cost_of_living | Low | Derived from BEA RPP parity index post-import |
| gas_price | $4.17 | AAA Gas Prices metro average for Erie, PA (August 20, 2026) |

**Sources:**
- Tax Foundation State Sales Tax Rates: https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/
- Tax Foundation State Individual Income Tax Rates: https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
- AAA Gas Prices (Erie, PA Metro): https://gasprices.aaa.com/?state=PA

**Note:** Erie County levies no local sales tax add-on, so the effective sales tax rate is the Pennsylvania state base rate of 6.00%. Military retirement pay is completely exempt from PA state personal income tax.

---

## Veterans Affairs

| Field | Value | Source |
|:---|:---|:---|
| has_va | Y | VA.gov official directory |
| nearest_va | Erie VA Medical Center | VA.gov |
| distance_to_va | 2 miles | Great-circle/driving distance from city centroid to 135 E 38th St |
| veterans_benefits | (see CSV) | PA DMVA / PA Department of Revenue |

**Sources:**
- Erie VA Medical Center: https://www.va.gov/erie-health-care/locations/erie-va-medical-center/ (135 East 38th Street, Erie, PA 16504)
- PA DMVA Benefits and Services: https://www.dmva.pa.gov/veteransaffairs/Pages/Benefits-and-Services.aspx
- PA Disabled Veterans Real Estate Tax Exemption: https://www.dmva.pa.gov/veteransaffairs/Pages/Tax-Exemption.aspx

**Note:** Erie has a full-service VA Medical Center located directly within the city limits at 135 E 38th St, providing comprehensive primary care, specialty care, surgical, and mental health services.

---

## Weather & Climate

| Field | Value | Source |
|:---|:---|:---|
| snow_annual | 104 | NOAA 1991–2020 Climate Normals (104.3 inches) |
| rain_annual | 43 | NOAA 1991–2020 Climate Normals (42.9 inches total precip) |
| sun_days | 160 | NCDC / NOAA Climate Data / Current Results (63 sunny + 97 partly sunny) |
| alw (AverageLowWinter) | 21 | NOAA 1991–2020 Normals (January mean daily min: 21.3°F) |
| avg_high_summer | 81 | NOAA 1991–2020 Normals (July mean daily max: 80.8°F) |
| humidity_summer | 72 | NOAA/NWS NCEI Climatological Data (July relative humidity) |
| climate | Humid continental (Dfb) | Köppen climate classification / lake-effect snow belt |
| climate_category | cold_snowy | Derived (snow_annual ≥ 30) |

**Station:** Erie International Airport (KERI / USW00014860; Lat: 42.083°, Lon: -80.183°)  
**Sources:**
- NOAA NCEI 1991–2020 U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- NWS Cleveland Climate Data for Erie, PA: https://www.weather.gov/cle/climate
- Current Results Sunshine & Humidity Normals: https://www.currentresults.com/Weather/Pennsylvania/annual-sunshine.php

---

## Politics & Elections

| Field | Value | Source |
|:---|:---|:---|
| state_party | D | Current PA governance (Gov. Josh Shapiro, D) |
| governor | D | Gov. Josh Shapiro (D) |
| city_politics | County-level: Mixed / Swing | 2024 two-party GOP vote share 50.52% (within 49–51% swing threshold) |
| election_2016 | Trump | Certified Erie County election returns |
| election_2016_percent | 49 | 48.57% total vote (50.83% two-party) |
| election_2024 | Trump | Certified Erie County election returns |
| election_2024_percent | 50 | 49.77% total vote (50.52% two-party) |
| rep_vote_share_change_pp | -0.31 | Two-party: 50.52% (2024) − 50.83% (2016) |
| dem_vote_share_change_pp | 0.31 | Two-party: 49.48% (2024) − 49.17% (2016) |
| election_change | 0.3 pp more Democratic since 2016 | Net presidential shift from 2016 to 2024 |

### Certified Vote Counts (Erie County, PA)

**2016 General Election:**
- Donald J. Trump (R): 60,069 votes (48.57% total)
- Hillary Clinton (D): 58,112 votes (46.99% total)
- Total two-party vote: 118,181
- Trump two-party share: 50.83%
- Clinton two-party share: 49.17%

**2024 General Election:**
- Donald J. Trump (R): 68,866 votes (49.77% total)
- Kamala D. Harris (D): 67,456 votes (48.76% total)
- Total two-party vote: 136,322
- Trump two-party share: 50.52%
- Harris two-party share: 49.48%

**Sources:**
- Pennsylvania Department of State Certified Election Results: https://www.electionreturns.pa.gov/
- Erie County Board of Elections Certified Returns: https://www.eriecountypa.gov/departments/elections-and-voter-registration/
- MIT Election Data and Science Lab (MEDSL): https://electionlab.mit.edu/data

---

## Safety & Social Policy

| Field | Value | Source |
|:---|:---|:---|
| tci | 105 | FBI UCR / OpenCrime 2024 violent crime rate indexed to 2024 national average (359.1 per 100k) |
| crime | Moderate | Sourced crime tier based on violent crime index |
| marijuana_status | Medical | PA Medical Marijuana Act (Act 16) |
| lgbtq_rating | 100 | Human Rights Campaign (HRC) Municipal Equality Index (MEI) |
| lgbtq_mei_score | 100 | HRC MEI 2024/2025 Scorecard |
| lgbtq_state_policy_score | 16.75 | Movement Advancement Project (MAP) PA Equality Profile (16.75/49) |
| lgbtq_score_source | HRC MEI 2025 score (100) + MAP PA state policy score (16.75) | HRC MEI & MAP |

**Sources:**
- FBI Crime Data Explorer (CDE) / Pennsylvania UCR: https://cde.ucr.cjis.gov/ / https://www.psp.pa.gov/
- OpenCrime / PlainCrime 2024 Erie Data: 375.6 violent crimes per 100k population (347 total violent crimes in 2024)
- TCI calculation: `375.6 / 359.1 * 100 = 104.6` -> rounded integer `105`
- HRC Municipal Equality Index (Erie, PA Scorecard): https://www.hrc.org/resources/municipal-equality-index (Perfect 100 scorecard)
- Movement Advancement Project (MAP) Pennsylvania Profile: https://www.lgbtmap.org/equality_maps/profile_state/PA

---

## Economic Hubs, Amenities, and Retail

| Field | Value | Source |
|:---|:---|:---|
| tech_hub | N | Regional industrial, logistics, and healthcare hub, not a specialized tech center |
| defense_hub_manual | N | No active major DoD base or primary defense contractor plant |
| has_walmart | Y | Walmart Store Directory (3 Erie locations) |
| has_costco | N | Costco Warehouse Directory (no warehouse in Erie) |

**Retail Notes:**
- `HasWalmart = Y`: Official Walmart store directory confirms 3 Supercenters in Erie, PA:
  - 2711 Elm St, Erie, PA 16504
  - 1825 Downs Dr, Erie, PA 16509
  - 5350 W Ridge Rd, Erie, PA 16506
- `HasCostco = N`: Official Costco directory confirms no Costco warehouse in Erie, PA. Nearest warehouses are in Cranberry Township (Pittsburgh area), Buffalo, NY, or Cleveland, OH.

---

## Description & Tags

**Tags:**
`["Lakes", "Beaches", "Healthcare", "Fishing", "Boating", "Parks", "Culture"]`

**Tag Justification:**
- **Lakes / Beaches / Boating**: Situated on Presque Isle Bay and Lake Erie; Presque Isle State Park features 13 public beaches and 7 miles of coastline.
- **Healthcare**: Erie VA Medical Center, UPMC Hamot, and Saint Vincent Hospital (AHN).
- **Fishing**: World-class freshwater fishing for walleye, yellow perch, and steelhead trout in Lake Erie and tributary streams.
- **Parks**: Presque Isle State Park (3,200 acres, 4+ million annual visitors), Frontier Park, Asbury Woods.
- **Culture**: Warner Theatre, Erie Art Museum, Erie Maritime Museum (home port of US Brig Niagara), Erie Philharmonic, and expERIEnce Children's Museum.

**Description:**
"Located along the southern shore of Lake Erie in northwestern Pennsylvania, Erie offers direct access to the Erie VA Medical Center, an affordable cost of living, and premier freshwater recreation anchored by Presque Isle State Park's beaches and trails. Military retirees benefit from Pennsylvania's full exemption of military retirement pay from state income tax, though the region experiences heavy lake-effect winter snowfall."
