# Troy, AL — Source Audit Notes

**Retrieval Date:** 2026-08-31  
**Target Location:** Troy, AL (Pike County)  
**Geography Type:** City (`is_candidate = true`)

---

## 1. Identity and Geography
- **Name:** Troy
- **State:** AL (Alabama)
- **County:** Pike County
- **Population:** 17,727 (U.S. Census 2020 Decennial Census PL 94-171 / ACS 5-year estimate)
- **Land Area:** 28.34 sq miles
- **Density:** 625 people / sq mile
- **Coordinates:** Latitude 31.80196, Longitude -85.96713 (US Census 2024 Gazetteer / `pace_derived.json` geoid `0176920`)
- **Primary Source URL:** https://www.census.gov/quickfacts/fact/table/troycityalabama/PST045223

---

## 2. Politics and Presidential Election Trends
- **County Sourced:** Pike County, AL
- **2016 Presidential Election Returns (Pike County):**
  - Donald Trump (R): 7,693 votes (58.42%)
  - Hillary Clinton (D): 5,056 votes (38.40%)
  - Other: 419 votes (3.18%)
  - Total Votes: 13,168
  - Two-party total: 12,749 (Trump 60.34%, Clinton 39.66%)
- **2024 Presidential Election Returns (Pike County):**
  - Donald Trump (R): 8,224 votes (62.14%)
  - Kamala Harris (D): 4,899 votes (37.02%)
  - Other: 111 votes (0.84%)
  - Total Votes: 13,234
  - Two-party total: 13,123 (Trump 62.67%, Harris 37.33%)
- **Trend Math (Two-Party Vote Share Delta):**
  - `rep_vote_share_change_pp` = 62.67% - 60.34% = **+2.33 pp** (+2.3 pp)
  - `dem_vote_share_change_pp` = 37.33% - 39.66% = **-2.33 pp** (-2.3 pp)
  - `ElectionChange`: `2.3 pp more Republican since 2016`
- **City Politics Characterization:** `County-level: Conservative` (55–64.9% Republican threshold)
- **Primary Source URLs:**
  - https://www.sos.alabama.gov/alabama-votes
  - https://uselectionatlas.org/RESULTS/

---

## 3. Housing and Real Estate
- **AvgHomeValue (ZHVI):** $186,874 (Zillow Home Value Index, mid-tier all homes, July/August 2026)
- **Primary Source URL:** https://www.zillow.com/home-values/41269/troy-al/

---

## 4. Taxes and Cost of Living
- **Sales Tax Rate:** 9.50% combined
  - Alabama State Sales Tax: 4.00%
  - Pike County Sales Tax: 2.50%
  - City of Troy Sales Tax: 3.00%
- **Income Tax Rate (State-owned reference):** 5.00% (Alabama top marginal individual income tax rate)
- **Cost of Living Index (Placeholder / RPP-derived):** 85
- **Primary Source URLs:**
  - https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/
  - https://revenue.alabama.gov/sales-use/sales-tax-rates/

---

## 5. Veterans Affairs and Military Benefits
- **Nearby VA Access (`has_va`):** `No` (Nearest outpatient facility > 25 crow-fly miles)
- **Nearest Outpatient VA Site:** `Wiregrass VA Clinic (Fort Novosel, AL)` — 36 miles
- **Nearest VA Medical Center (Hospital):** `Central Alabama VA Medical Center-Montgomery (Montgomery, AL)` — 43 miles
- **Veterans Benefits:** Alabama exempts U.S. military retirement pay from state individual income tax. Qualifying 100% disabled veterans receive full property tax exemption on primary homestead.
- **Primary Source URLs:**
  - VHA VAST ArcGIS FeatureServer: https://services1.arcgis.com/smmmD7AGkh7eJR2a/arcgis/rest/services/Veterans_Health_Administration_(VHA)_Facilities/FeatureServer/0
  - https://va.alabama.gov/

---

## 6. Defense Employer and Industry Hubs
- **TechHub:** `N`
- **DefenseHub / `defense_hub_manual`:** `Y`
- **Defense Presence Details:** Troy hosts Lockheed Martin's Missiles and Fire Control (MFC) Pike County Operations campus (3,863 acres, 800+ employees, 6 production facilities). The plant manufactures THAAD interceptors, Javelin anti-tank missiles, JASSM cruise missiles, LRASM, and HELLFIRE missiles.
- **Retail Amenities:**
  - `HasWalmart`: `Y` (Walmart Supercenter, 1420 US-231, Troy, AL 36081)
  - `HasCostco`: `N` (Nearest Costco located in Montgomery, AL, ~45 miles away)
- **Primary Source URLs:**
  - https://www.lockheedmartin.com/en-us/capabilities/missiles-and-fire-control.html

---

## 7. Safety and Policy Scores
- **Total Crime Index (TCI):** 118
- **Crime Rating:** `Moderate`
- **Marijuana Policy:** `Medical` (Alabama SB 46 medical cannabis program)
- **LGBTQ Rating / MEI:** `Not Rated / No Local MEI Score Verified` (HRC MEI 2025 does not rate Troy; MAP Alabama Equality policy score -10.50)
- **Primary Source URLs:**
  - https://cde.ucr.cjis.gov/ (FBI Crime Data Explorer)
  - https://www.hrc.org/resources/municipal-equality-index
  - https://www.lgbtmap.org/equality_maps/profile_state/AL

---

## 8. Weather and Climate Normals (1991–2020)
- **Station:** Troy Municipal Airport (KTOI) / Troy 3 SE, AL
- **Annual Snowfall:** 0 inches
- **Annual Rainfall:** 54 inches
- **Annual Sunny Days:** 220 days
- **Average Winter Low (Jan):** 38 °F
- **Average Summer High (July):** 91 °F
- **Summer Humidity (July avg):** 73%
- **Climate Classification:** `Humid subtropical`
- **Gas Price:** $3.70 (AAA Alabama state regular gas average as of August 31, 2026)
- **Primary Source URLs:**
  - https://www.ncei.noaa.gov/access/us-climate-normals/
  - https://gasprices.aaa.com/?state=AL
